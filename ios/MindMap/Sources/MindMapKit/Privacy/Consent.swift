import Foundation

/// How fine a piece of information is in time.
///
/// Ordered coarsest first, so `>` means "finer than". The comparison is what
/// the audience ceiling and the grant check are written against, and it is the
/// reason a parent cannot be shown an afternoon.
public enum Granularity: Int, Comparable, Codable, Sendable, CaseIterable {
    case day = 0
    case hour = 1
    case instant = 2

    public static func < (a: Granularity, b: Granularity) -> Bool {
        a.rawValue < b.rawValue
    }

    public var label: String {
        switch self {
        case .day:     return "a day at a time"
        case .hour:    return "an hour at a time"
        case .instant: return "second by second"
        }
    }
}

/// The kinds of information this product holds. Named by feature, not by data
/// category, which is the rule `src/lib/terms.js` sets for copy and which this
/// type keeps for code as well.
public enum DataCategory: String, Codable, Sendable, CaseIterable {
    case dailyScore
    case dayBand
    case sleepDuration
    case wearStatus
    case signalDetail
    case readingTimeline
    case note
    case location
    case audio

    /// Never leaves the device, for anybody, under any grant. Nothing that
    /// conforms to `Shareable` carries one of these, and the grant initialiser
    /// drops them if one is ever named.
    public static let neverShareable: Set<DataCategory> = [.note, .location, .audio]

    public var label: String {
        switch self {
        case .dailyScore:      return "Mind Score for a day"
        case .dayBand:         return "Whether a day was above their usual"
        case .sleepDuration:   return "Roughly how long they slept"
        case .wearStatus:      return "Whether the patch was being worn"
        case .signalDetail:    return "Second-by-second readings"
        case .readingTimeline: return "When readings were taken"
        case .note:            return "Notes. What a student writes in their own journal"
        case .location:        return "Location"
        case .audio:           return "Anything they say. The microphone is never recorded or sent"
        }
    }
}

/// Anything this product holds about a person.
public protocol MindMapDatum: Codable, Sendable {
    static var category: DataCategory { get }
}

/// The only way into a share payload.
///
/// Conforming a type to this is a consent decision, not a refactor. A type that
/// does not conform cannot be handed to `SharePayloadBuilder.add`, so the
/// compiler, not a code review, is what stops a note or a location from
/// reaching a parent screen, an export or a share link.
public protocol Shareable: MindMapDatum {
    /// The finest this datum is ever expressed at. A grant may ask for less;
    /// it can never ask for more.
    static var granularity: Granularity { get }
}

/// Stays on the device. There is deliberately no `Shareable` conformance for
/// any of these anywhere in the project.
public protocol NeverShared: MindMapDatum {}

/// Who is asking. One name for each of them, everywhere.
public enum Audience: String, Codable, Sendable, CaseIterable {
    case student
    case parent
    case medicalProfessional

    public var label: String {
        switch self {
        case .student:            return "Student"
        case .parent:             return "Parent"
        case .medicalProfessional: return "Medical Professional"
        }
    }

    /// The finest this audience can ever be shown, whatever a grant says.
    ///
    ///   * the student owns the data and sees all of their own;
    ///   * a parent may see nothing finer-grained than a day, which is a
    ///     product rule and not a setting;
    ///   * a medical professional is bounded by the grant alone, which is what
    ///     "sees only what was consented to" means.
    public var ceiling: Granularity {
        switch self {
        case .student:            return .instant
        case .parent:             return .day
        case .medicalProfessional: return .instant
        }
    }
}

/// An explicit, dated grant from the student for one audience.
///
/// Nothing is shared by default. There is no constructor that produces a grant
/// covering everything, the categories have to be named one at a time, and a
/// grant can be revoked by deleting it.
public struct ConsentGrant: Codable, Sendable, Equatable, Identifiable {
    public let id: UUID
    public let audience: Audience
    /// What the student picked, with anything unshareable removed.
    public let categories: Set<DataCategory>
    /// What the student picked, floored by the audience ceiling.
    public let finestGranularity: Granularity
    public let grantedAt: Date
    /// Nil means until revoked. A professional grant should carry a date.
    public let expiresAt: Date?

    public init(id: UUID = UUID(),
                audience: Audience,
                categories: Set<DataCategory>,
                finestGranularity: Granularity,
                grantedAt: Date = Date(),
                expiresAt: Date? = nil) {
        self.id = id
        self.audience = audience
        self.categories = categories.subtracting(DataCategory.neverShareable)
        self.finestGranularity = min(finestGranularity, audience.ceiling)
        self.grantedAt = grantedAt
        self.expiresAt = expiresAt
    }

    public func isActive(at date: Date = Date()) -> Bool {
        guard date >= grantedAt else { return false }
        guard let expiresAt else { return true }
        return date < expiresAt
    }

    public func allows(category: DataCategory, granularity: Granularity) -> Bool {
        guard !DataCategory.neverShareable.contains(category) else { return false }
        guard categories.contains(category) else { return false }
        return granularity <= finestGranularity
    }

    /// A grant that shares nothing. The starting state for every audience.
    public static func nothing(for audience: Audience, at date: Date = Date()) -> ConsentGrant {
        ConsentGrant(audience: audience, categories: [], finestGranularity: .day, grantedAt: date)
    }
}

public enum ConsentError: Error, Equatable, CustomStringConvertible {
    case grantNotActive(Audience)
    case categoryNotGranted(DataCategory, Audience)
    case tooFine(DataCategory, asked: Granularity, allowed: Granularity, Audience)
    case neverShareable(DataCategory)
    case encodingFailed(DataCategory)

    public var description: String {
        switch self {
        case .grantNotActive(let a):
            return "There is no active grant for a \(a.label)."
        case .categoryNotGranted(let c, let a):
            return "A \(a.label) has not been given \(c.label)."
        case .tooFine(let c, let asked, let allowed, let a):
            return "A \(a.label) may see \(c.label) at \(allowed.label) at most, and this is \(asked.label)."
        case .neverShareable(let c):
            return "\(c.label) never leaves the device."
        case .encodingFailed(let c):
            return "\(c.label) could not be encoded for sharing."
        }
    }
}
