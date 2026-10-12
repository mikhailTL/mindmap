import Foundation

/// The six-question route, ported from `src/lib/engine.js`.
///
/// Same last step and same constant as the patch route, so a day scored from
/// six answers lands on the same scale as a day scored from the patch. The
/// weights are a starting allocation and are not fitted to anybody.
public enum SelfReport {

    public struct Item: Identifiable, Sendable, Equatable {
        public let id: String
        public let weight: Double
        public let question: String
        public let low: String
        public let high: String
        /// How to name this item in a sentence when it pushed the score up.
        public let up: String
        /// How to name it when it pushed the score down.
        public let down: String
    }

    /// Five points, 0 to 4, exactly as the web app presents them.
    public static let points: [Int] = [0, 1, 2, 3, 4]

    public static let items: [Item] = [
        Item(id: "tension", weight: 1.0,
             question: "How tense does your body feel right now?",
             low: "Loose", high: "Very tight",
             up: "how tense your body feels", down: "how loose your body feels"),
        Item(id: "edge", weight: 1.1,
             question: "How on edge do you feel?",
             low: "Settled", high: "Very on edge",
             up: "how on edge you feel", down: "how settled you feel"),
        Item(id: "sleep", weight: 0.9,
             question: "How was last night compared with your usual?",
             low: "Better", high: "Much worse",
             up: "last night's sleep", down: "last night's sleep"),
        Item(id: "energy", weight: 0.8,
             question: "How is your energy right now?",
             low: "Full", high: "Empty",
             up: "how low your energy is", down: "how much energy you have"),
        Item(id: "focus", weight: 0.8,
             question: "How hard is it to hold your focus?",
             low: "Easy", high: "Very hard",
             up: "how hard focusing is", down: "how easily you are focusing"),
        Item(id: "demand", weight: 1.0,
             question: "How much has today asked of you so far?",
             low: "Very little", high: "A great deal",
             up: "how much today has asked of you", down: "how light today has been"),
    ]

    /// The logistic constant the other routes use.
    public static let k: Double = 2.4

    static let weightSum: Double = items.reduce(0) { $0 + $1.weight }

    public struct Contribution: Sendable {
        public let item: Item
        public let raw: Double
    }

    /// `answers` keys are item ids, values 0 to 4. An unanswered item is
    /// treated as the middle point, which is what the web app does by making
    /// the button to finish wait for all six.
    public static func score(answers: [String: Int], at date: Date = Date()) -> MindScore {
        let contributions = items.map { item in
            Contribution(item: item,
                         raw: item.weight * (Double(answers[item.id] ?? 2) - 2) / 2)
        }
        let s = contributions.reduce(0) { $0 + $1.raw } / weightSum
        let p = 1 / (1 + exp(-k * s))
        let value = Int((p * 100).rounded())
        let band = ScoreBand.of(value)
        return MindScore(
            value: value,
            probability: p,
            band: band,
            sentence: sentence(band: band, contributions: contributions),
            contributions: [],
            source: .selfReport,
            takenAt: date,
            baselineDays: 0,
            heldBackReason: nil)
    }

    /// One sentence, then the number.
    public static func sentence(band: ScoreBand, contributions: [Contribution]) -> String {
        let verb = band == .usual ? "sitting" : "running"
        let lead = "Right now you are \(verb) \(band.word)."
        guard let top = contributions.max(by: { abs($0.raw) < abs($1.raw) }) else { return lead }
        if abs(top.raw) < 0.25 {
            return lead + " Nothing you answered stands out on its own."
        }
        let name = top.raw > 0 ? top.item.up : top.item.down
        return lead + " The biggest single part of that is \(name)."
    }

    /// Answers complete enough to score.
    public static func isComplete(_ answers: [String: Int]) -> Bool {
        items.allSatisfy { answers[$0.id] != nil }
    }
}
