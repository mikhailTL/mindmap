import Foundation

/// The four bands the whole product shares, from `src/signals/score.js` and
/// `src/lib/engine.js`. Both routes use these cut points so the two agree on
/// what "usual" means.
public enum ScoreBand: String, Codable, Sendable, CaseIterable {
    case low
    case usual
    case up
    case high

    public static func of(_ n: Int) -> ScoreBand {
        if n < 35 { return .low }
        if n < 58 { return .usual }
        if n < 73 { return .up }
        return .high
    }

    /// The phrase that completes "Right now you are running ...".
    public var word: String {
        switch self {
        case .low:   return "easier than usual"
        case .usual: return "in your usual range"
        case .up:    return "a little high"
        case .high:  return "high"
        }
    }

    /// A band that does not need a sentence pointing anywhere.
    public var calm: Bool { self == .usual || self == .low }
}

/// One number a day, 0 to 100, against this person's own baseline.
public struct MindScore: Sendable, Equatable, Identifiable {
    public let value: Int
    /// The network's output before rounding, kept so a chart can draw it.
    public let probability: Double
    public let band: ScoreBand
    /// The one sentence that goes above the number. Sentence first, number
    /// second, never the other way round.
    public let sentence: String
    public let contributions: [SignalContribution]
    public let source: ReadingSource
    public let takenAt: Date
    /// How many days of this person's own history the baseline had. Under
    /// about a week the number is read against borrowed spread, not theirs.
    public let baselineDays: Int
    /// Set when movement pulled the other three toward zero rather than
    /// counting them as stress.
    public let heldBackReason: String?
    /// Stable for the life of this value, so a list keeps its rows in place
    /// even when two readings land in the same second.
    public let id = UUID()

    public init(value: Int, probability: Double, band: ScoreBand, sentence: String,
                contributions: [SignalContribution], source: ReadingSource,
                takenAt: Date, baselineDays: Int, heldBackReason: String?) {
        self.value = value
        self.probability = probability
        self.band = band
        self.sentence = sentence
        self.contributions = contributions
        self.source = source
        self.takenAt = takenAt
        self.baselineDays = baselineDays
        self.heldBackReason = heldBackReason
    }
}

/// Product vocabulary, from `src/lib/terms.js`. One name per thing. Do not add
/// a second name for the same thing.
public enum Vocabulary {
    public static let score = "Mind Score"
    public static let scoreRange = "0 to 100"
    public static let scoreDefinition =
        "One number a day, 0 to 100, measured against your own normal rather than anybody else's."
    public static let pro = "Medical Professional"
    public static let consentShort =
        "A guardian opens the account. The student chooses what is shared."
    public static let consentOff =
        "Any of it can be switched off by the student, at any time."
    /// Says what the product is and what it is not. Required on any screen
    /// that shows a score, and in the App Store description.
    public static let notAMedicalDevice =
        "MindMap measures physiology and reports patterns. It is not a medical device and does not diagnose or treat any condition."
}
