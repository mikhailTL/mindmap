import Foundation
import Combine
import MindMapKit

/// Everything on screen hangs off this one object.
///
/// It holds the scorer, this person's own baseline, the readings taken so far,
/// and the consent ledger. It makes no network requests: there is no client in
/// the app, and `ShareTransport` has no conforming type, so the only way
/// anything leaves the device is a share sheet the student taps themselves.
@MainActor
public final class AppModel: ObservableObject {

    /// How long a reading runs for. Thirty seconds at 1 Hz is thirty samples.
    public static let readingSeconds = 30

    public enum Source: String, Equatable {
        case patch
        case demoPatch
    }

    public enum Phase: Equatable {
        case idle
        case collecting(secondsLeft: Int)
        case finished
    }

    // MARK: Published state

    /// Set when the weights could not be loaded. Every screen that shows a
    /// score checks this first, so a missing resource reads as a sentence
    /// rather than a crash.
    @Published public private(set) var scorerProblem: String?
    @Published public private(set) var phase: Phase = .idle
    @Published public private(set) var source: Source = .patch
    @Published public private(set) var today: MindScore?
    /// Most recent first.
    @Published public private(set) var history: [MindScore] = []
    @Published public private(set) var baseline = Baseline()
    @Published public var consent = ConsentLedger()
    /// Stays here. `JournalNote` has no `Shareable` conformance, so none of
    /// this can reach a payload.
    @Published public private(set) var notes: [JournalNote] = []
    /// Samples from the demo patch. The radio route keeps its own window in
    /// `patch.recent`.
    @Published public private(set) var demoWindow: [PatchSample] = []

    public let patch = PatchManager()

    // MARK: Internals

    private var engine: ScoreEngine?
    private let simulator = PatchSimulator()
    private var readingTask: Task<Void, Never>?

    public init() {
        do {
            engine = ScoreEngine(network: try MindScoreNetwork.bundled())
        } catch {
            scorerProblem = "\(error)"
        }
    }

    public var parameterCount: Int { engine?.network.parameterCount ?? 0 }
    public var architecture: [Int] { engine?.network.architecture ?? [] }

    /// The window the current source has filled.
    public var window: [PatchSample] {
        source == .patch ? patch.recent : demoWindow
    }

    public var isReading: Bool {
        if case .collecting = phase { return true }
        return false
    }

    // MARK: Taking a reading

    public func beginReading(using source: Source) {
        cancelReading()
        self.source = source
        switch source {
        case .patch:
            patch.clearWindow()
            patch.startScanning()
        case .demoPatch:
            demoWindow = []
        }
        phase = .collecting(secondsLeft: Self.readingSeconds)

        readingTask = Task { @MainActor [weak self] in
            for remaining in stride(from: Self.readingSeconds, through: 1, by: -1) {
                guard let self, !Task.isCancelled else { return }
                self.phase = .collecting(secondsLeft: remaining)
                if self.source == .demoPatch, let frame = try? self.simulator.next() {
                    self.demoWindow.append(frame.sample())
                }
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            guard let self, !Task.isCancelled else { return }
            self.finishReading()
        }
    }

    public func cancelReading() {
        readingTask?.cancel()
        readingTask = nil
        patch.stop()
        phase = .idle
    }

    /// Scores what was collected, folds it into this person's baseline, and
    /// keeps it. Folding happens after scoring, so a reading is measured
    /// against the days before it and not against itself.
    public func finishReading() {
        guard let engine else {
            phase = .idle
            return
        }
        let samples = window
        guard !samples.isEmpty else {
            phase = .idle
            return
        }
        let now = Date()
        guard let score = engine.score(window: samples, baseline: baseline, at: now) else {
            phase = .idle
            return
        }
        record(score)

        var features: [String: Double] = [:]
        for signal in Signal.allCases {
            let values = samples.map { $0.value(for: signal) }.filter { $0.isFinite }
            guard !values.isEmpty else { continue }
            features[signal.rawValue] = values.reduce(0, +) / Double(values.count)
        }
        baseline.update(with: features, dayKey: Baseline.dayKey(for: now))
        phase = .finished
        patch.stop()
    }

    /// The six-question route. No patch, no camera.
    public func recordSelfReport(answers: [String: Int], at date: Date = Date()) {
        record(SelfReport.score(answers: answers, at: date))
        phase = .finished
    }

    private func record(_ score: MindScore) {
        today = score
        history.insert(score, at: 0)
    }

    public func dismissResult() {
        phase = .idle
    }

    // MARK: Notes

    public func addNote(_ text: String, at date: Date = Date()) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        notes.insert(JournalNote(writtenAt: date, text: trimmed), at: 0)
    }

    /// Removes by index set without `remove(atOffsets:)`, which SwiftUI
    /// declares. This file imports Foundation and Combine only.
    public func deleteNote(at offsets: IndexSet) {
        for index in offsets.sorted(by: >) where notes.indices.contains(index) {
            notes.remove(at: index)
        }
    }

    // MARK: Sharing

    /// What this audience would actually be sent, and what was refused.
    ///
    /// Built through `SharePayloadBuilder`, so a category the grant does not
    /// name and anything finer than the grant allows come back as refusals
    /// rather than quietly going missing.
    public func preview(for audience: Audience, at date: Date = Date())
        -> (payload: SharePayload, refused: [ConsentError])? {
        guard var builder = try? consent.builder(for: audience, at: date) else { return nil }
        var refused: [ConsentError] = []

        for score in history.prefix(14) {
            let key = Baseline.dayKey(for: score.takenAt)
            if let error = builder.addIfAllowed(DailyScore(dayKey: key, value: score.value)) {
                refused.append(error)
            }
            if let error = builder.addIfAllowed(DayBand(dayKey: key, band: score.band)) {
                refused.append(error)
            }
            if let error = builder.addIfAllowed(WearStatus(dayKey: key, worn: score.source == .patch)) {
                refused.append(error)
            }
        }
        if let latest = history.first {
            let key = Baseline.dayKey(for: latest.takenAt)
            let hour = Calendar.current.component(.hour, from: latest.takenAt)
            if let error = builder.addIfAllowed(ReadingTimeline(dayKey: key, hoursOfDay: [hour])) {
                refused.append(error)
            }
            for contribution in latest.contributions {
                if let error = builder.addIfAllowed(
                    SignalDetail(takenAt: latest.takenAt, signal: contribution.signal,
                                 value: contribution.value ?? 0)) {
                    refused.append(error)
                }
            }
        }
        /// Distinct reasons only. Fourteen days of the same refusal is one
        /// thing to tell somebody, not fourteen.
        var seen = Set<String>()
        let distinct = refused.filter { seen.insert($0.description).inserted }
        return (builder.build(), distinct)
    }

    // MARK: Demo data

    /// Fills in a fortnight so Today, the week and Sharing have something in
    /// them on a fresh install.
    ///
    /// Every figure is generated by `PatchSimulator` on this device. None of it
    /// is recorded from a person and none of it comes from a built unit.
    public func seedDemoHistory(days: Int = 14, calendar: Calendar = .current) {
        guard let engine else { return }
        var seeded: [MindScore] = []
        var working = Baseline()
        let now = Date()
        for back in stride(from: days - 1, through: 0, by: -1) {
            guard let day = calendar.date(byAdding: .day, value: -back, to: now) else { continue }
            var samples: [PatchSample] = []
            for _ in 0..<Self.readingSeconds {
                if let frame = try? simulator.next() {
                    samples.append(frame.sample(receivedAt: day))
                }
            }
            guard !samples.isEmpty else { continue }
            if let score = engine.score(window: samples, baseline: working, at: day) {
                seeded.append(score)
            }
            var features: [String: Double] = [:]
            for signal in Signal.allCases {
                let values = samples.map { $0.value(for: signal) }
                features[signal.rawValue] = values.reduce(0, +) / Double(values.count)
            }
            working.update(with: features, dayKey: Baseline.dayKey(for: day, calendar: calendar))
        }
        baseline = working
        history = seeded.reversed()
        today = history.first
    }
}
