import Foundation

/// Turns readings into one Mind Score.
///
/// The patch route is the network in `MindScoreNetwork`, fed z-scores from the
/// wearer's own `Baseline`. The self-report route is in `SelfReport`. Both end
/// in the same logistic with the same constant, which is what puts them on one
/// scale.
public struct ScoreEngine: Sendable {

    public let network: MindScoreNetwork

    public init(network: MindScoreNetwork) {
        self.network = network
    }

    /// Scores a window of patch samples.
    ///
    /// The window is averaged per channel first, because one second of a
    /// four-channel stream is not a day. `baseline` is this wearer's own, and
    /// is not updated here: a caller folds the window in once it has decided
    /// the reading counts.
    public func score(window: [PatchSample], baseline: Baseline,
                      at date: Date = Date()) -> MindScore? {
        guard !window.isEmpty else { return nil }

        var mean: [Signal: Double] = [:]
        for signal in Signal.allCases {
            let values = window.map { $0.value(for: signal) }.filter { $0.isFinite }
            guard !values.isEmpty else { continue }
            mean[signal] = values.reduce(0, +) / Double(values.count)
        }
        guard mean.count == Signal.allCases.count else { return nil }

        var z: [Signal: Double] = [:]
        for (signal, value) in mean {
            z[signal] = network.clampZ(baseline.z(signal.rawValue, value))
        }

        let vector = MindScoreNetwork.inputOrder.map { z[$0] ?? 0 }
        let run = network.run(vector)
        let gate = network.reference(vector).gate

        let contributions = MindScoreNetwork.inputOrder.map { signal in
            SignalContribution(signal: signal,
                               z: z[signal] ?? 0,
                               value: mean[signal],
                               ringValue: Self.ringValue(for: z[signal] ?? 0,
                                                         zLimit: network.zLimit))
        }

        let band = ScoreBand.of(run.score)
        let peakMovement = window.map { $0.movementG }.max() ?? 0
        /// Two ways a reading gets held back, and both have to say the same
        /// thing on screen: the movement channel sat high enough for the
        /// network's own gate to close, or one sample in the window went over
        /// the 0.35 g line that the capture route uses.
        let held = gate < 0.5 || peakMovement > movementLimitG

        return MindScore(
            value: run.score,
            probability: run.p,
            band: band,
            sentence: Self.sentence(band: band, contributions: contributions, held: held),
            contributions: contributions,
            source: .patch,
            takenAt: date,
            baselineDays: baseline.days,
            heldBackReason: held ? Self.heldBackSentence(peakMovement: peakMovement) : nil)
    }

    /// Where one signal's ring sits, 0 to 100.
    ///
    /// A plain linear map of this signal's own signed distance from the
    /// wearer's baseline, so an ordinary day sits at 50 and the clamp limits
    /// sit at the ends. It is NOT that signal's share of the score: the four
    /// never sum to the centre number, because the centre number is four
    /// z-scores through a network and not an average.
    public static func ringValue(for z: Double, zLimit: Double) -> Int {
        let clamped = min(max(z, -zLimit), zLimit)
        return Int((100 * (clamped + zLimit) / (2 * zLimit)).rounded())
    }

    /// One sentence, then the number. Never the other way round.
    ///
    /// Attribution uses the reference model's three coefficients, because the
    /// network has no per-signal weight to read off and those coefficients are
    /// what it was fitted against. `tools/net/train.py` documents them.
    public static func sentence(band: ScoreBand, contributions: [SignalContribution],
                                held: Bool) -> String {
        let verb = band == .usual ? "sitting" : "running"
        let lead = "Right now you are \(verb) \(band.word)."

        if held {
            return lead + " You were moving while this was taken, so heart, sweat and temperature are discounted rather than counted as stress."
        }

        let weighted: [(SignalContribution, Double)] = contributions.compactMap { c in
            guard c.signal != .move else { return nil }
            let i = c.signal.inputIndex
            guard i < MindScoreNetwork.Reference.weights.count else { return nil }
            return (c, MindScoreNetwork.Reference.weights[i] * c.z)
        }
        guard let top = weighted.max(by: { abs($0.1) < abs($1.1) }) else { return lead }

        if abs(top.1) < 0.3 {
            return lead + " Nothing in the reading stands out on its own."
        }
        return lead + " \(top.0.signal.name) is the biggest single part of that: \(describe(z: top.0.z)) your own average."
    }

    static func heldBackSentence(peakMovement: Double) -> String {
        let peak = String(format: "%.2f", peakMovement)
        return "You were moving at \(peak) g, over the \(String(format: "%.2f", movementLimitG)) g line. The reading is kept but not counted as stress."
    }

    static func describe(z: Double) -> String {
        let n = String(format: "%.1f", abs(z))
        let plural = n == "1.0" ? "" : "s"
        let direction = z > 0 ? "above" : "below"
        return "\(n) standard deviation\(plural) \(direction)"
    }
}
