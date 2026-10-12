import Foundation

// MARK: - What can be shared

/// The Mind Score for one day. A day is the finest a score is ever expressed
/// at, which is why there is no hourly score type anywhere in the product.
public struct DailyScore: Shareable, Equatable {
    public static let category: DataCategory = .dailyScore
    public static let granularity: Granularity = .day

    public let dayKey: String
    public let value: Int

    public init(dayKey: String, value: Int) {
        self.dayKey = dayKey
        self.value = value
    }
}

/// Whether a day sat above this person's own usual range.
public struct DayBand: Shareable, Equatable {
    public static let category: DataCategory = .dayBand
    public static let granularity: Granularity = .day

    public let dayKey: String
    public let band: ScoreBand

    public init(dayKey: String, band: ScoreBand) {
        self.dayKey = dayKey
        self.band = band
    }
}

/// Roughly how long they slept, worked out from movement and not from anything
/// they wrote.
public struct SleepDuration: Shareable, Equatable {
    public static let category: DataCategory = .sleepDuration
    public static let granularity: Granularity = .day

    public let dayKey: String
    public let hours: Double

    public init(dayKey: String, hours: Double) {
        self.dayKey = dayKey
        self.hours = hours
    }
}

/// Whether the patch was being worn that day.
public struct WearStatus: Shareable, Equatable {
    public static let category: DataCategory = .wearStatus
    public static let granularity: Granularity = .day

    public let dayKey: String
    public let worn: Bool

    public init(dayKey: String, worn: Bool) {
        self.dayKey = dayKey
        self.worn = worn
    }
}

/// When readings were taken. Shareable, but only at an hour, and therefore
/// never with a parent.
public struct ReadingTimeline: Shareable, Equatable {
    public static let category: DataCategory = .readingTimeline
    public static let granularity: Granularity = .hour

    public let dayKey: String
    public let hoursOfDay: [Int]

    public init(dayKey: String, hoursOfDay: [Int]) {
        self.dayKey = dayKey
        self.hoursOfDay = hoursOfDay
    }
}

/// One signal at one moment. Instant granularity, so a grant has to ask for it
/// explicitly and a parent can never be given it.
public struct SignalDetail: Shareable, Equatable {
    public static let category: DataCategory = .signalDetail
    public static let granularity: Granularity = .instant

    public let takenAt: Date
    public let signal: Signal
    public let value: Double

    public init(takenAt: Date, signal: Signal, value: Double) {
        self.takenAt = takenAt
        self.signal = signal
        self.value = value
    }
}

// MARK: - What cannot

/// What a student writes in their own journal. Never shared, with anybody.
public struct JournalNote: NeverShared, Equatable {
    public static let category: DataCategory = .note

    public let writtenAt: Date
    public let text: String

    public init(writtenAt: Date, text: String) {
        self.writtenAt = writtenAt
        self.text = text
    }
}

/// The app does not ask for location and nothing in it produces one of these.
/// The type exists so that the rule lives in the type system rather than in a
/// paragraph: if location were ever captured, it still could not be put in a
/// payload without someone adding a `Shareable` conformance by hand.
public struct LocationFix: NeverShared, Equatable {
    public static let category: DataCategory = .location

    public let at: Date
    public let latitude: Double
    public let longitude: Double

    public init(at: Date, latitude: Double, longitude: Double) {
        self.at = at
        self.latitude = latitude
        self.longitude = longitude
    }
}

/// A record that the microphone ran, and nothing else. No samples, no
/// transcript, no bytes. The microphone is never recorded or sent, so there is
/// no type in this product that holds what was said.
public struct MicrophoneSession: NeverShared, Equatable {
    public static let category: DataCategory = .audio

    public let startedAt: Date
    public let seconds: Double

    public init(startedAt: Date, seconds: Double) {
        self.startedAt = startedAt
        self.seconds = seconds
    }
}

// MARK: - The catalog

/// Every category this product holds, with the finest it is held at and whether
/// anything could ever carry it off the device.
///
/// Each row names the type it describes, so the table cannot drift away from
/// the types. The Sharing screen draws itself from this.
public enum ShareCatalog {

    public struct Row: Identifiable, Sendable, Equatable {
        public let category: DataCategory
        /// Nil for a category nothing shareable carries.
        public let granularity: Granularity?
        public var id: String { category.rawValue }
        public var shareable: Bool { granularity != nil }
    }

    public static let rows: [Row] = [
        Row(category: DailyScore.category,      granularity: DailyScore.granularity),
        Row(category: DayBand.category,         granularity: DayBand.granularity),
        Row(category: SleepDuration.category,   granularity: SleepDuration.granularity),
        Row(category: WearStatus.category,      granularity: WearStatus.granularity),
        Row(category: ReadingTimeline.category, granularity: ReadingTimeline.granularity),
        Row(category: SignalDetail.category,    granularity: SignalDetail.granularity),
        Row(category: JournalNote.category,     granularity: nil),
        Row(category: LocationFix.category,     granularity: nil),
        Row(category: MicrophoneSession.category, granularity: nil),
    ]

    /// What this audience could be offered at most. Not what they have: that
    /// is the grant.
    public static func offerable(to audience: Audience) -> [Row] {
        rows.filter { row in
            guard let g = row.granularity else { return false }
            return g <= audience.ceiling
        }
    }
}

// MARK: - The payload

/// Everything that is about to leave the device, and nothing else.
///
/// There is no initialiser that takes items. The only way to make one is
/// `SharePayloadBuilder`, which needs an active `ConsentGrant`, and the only
/// thing it accepts is a `Shareable`.
public struct SharePayload: Codable, Sendable, Equatable {

    public struct Item: Codable, Sendable, Equatable {
        public let category: DataCategory
        public let granularity: Granularity
        public let encoded: Data
    }

    public let audience: Audience
    public let grantID: UUID
    public let builtAt: Date
    public let items: [Item]

    fileprivate init(audience: Audience, grantID: UUID, builtAt: Date, items: [Item]) {
        self.audience = audience
        self.grantID = grantID
        self.builtAt = builtAt
        self.items = items
    }

    public var isEmpty: Bool { items.isEmpty }

    public var categories: Set<DataCategory> { Set(items.map(\.category)) }
}

/// Builds a payload one datum at a time, checking each against the grant.
///
/// Three things have to be true before a datum is in: the grant is active, the
/// grant names the category, and the datum is no finer than the grant allows.
/// A failure throws rather than dropping the datum quietly, because a silent
/// drop is how a sharing screen ends up lying about what it sent.
public struct SharePayloadBuilder {

    private let grant: ConsentGrant
    private let now: Date
    private var items: [SharePayload.Item] = []
    private let encoder: JSONEncoder

    public init(grant: ConsentGrant, now: Date = Date()) throws {
        guard grant.isActive(at: now) else { throw ConsentError.grantNotActive(grant.audience) }
        self.grant = grant
        self.now = now
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        self.encoder = encoder
    }

    public mutating func add<T: Shareable>(_ value: T) throws {
        let category = T.category
        let granularity = T.granularity

        if DataCategory.neverShareable.contains(category) {
            throw ConsentError.neverShareable(category)
        }
        guard grant.categories.contains(category) else {
            throw ConsentError.categoryNotGranted(category, grant.audience)
        }
        guard granularity <= grant.finestGranularity else {
            throw ConsentError.tooFine(category, asked: granularity,
                                       allowed: grant.finestGranularity, grant.audience)
        }
        guard let data = try? encoder.encode(value) else {
            throw ConsentError.encodingFailed(category)
        }
        items.append(SharePayload.Item(category: category, granularity: granularity,
                                       encoded: data))
    }

    /// Adds a datum if the grant allows it, and reports what was refused
    /// instead of throwing. For a screen that lists what will be sent.
    @discardableResult
    public mutating func addIfAllowed<T: Shareable>(_ value: T) -> ConsentError? {
        do {
            try add(value)
            return nil
        } catch let error as ConsentError {
            return error
        } catch {
            return .encodingFailed(T.category)
        }
    }

    public func build() -> SharePayload {
        SharePayload(audience: grant.audience, grantID: grant.id, builtAt: now, items: items)
    }
}

/// Anything that moves a payload off the device.
///
/// The parameter type is the whole point: a transport cannot be handed a note,
/// a location, a raw sample or an arbitrary blob, only a payload that a grant
/// has already been checked against. There is no conforming type in this
/// project yet, and the app makes no network requests.
public protocol ShareTransport {
    func send(_ payload: SharePayload) async throws
}

/// The grants this device holds, one per audience at most.
///
/// Starts empty. An empty ledger is a device that shares nothing, which is the
/// state a new account is in.
public struct ConsentLedger: Codable, Sendable, Equatable {

    public private(set) var grants: [ConsentGrant] = []

    public init() {}

    public func grant(for audience: Audience, at date: Date = Date()) -> ConsentGrant? {
        grants.first { $0.audience == audience && $0.isActive(at: date) }
    }

    /// Replaces any grant for the same audience, so there is never more than
    /// one active grant per audience to reason about.
    public mutating func record(_ grant: ConsentGrant) {
        grants.removeAll { $0.audience == grant.audience }
        grants.append(grant)
    }

    /// Revoking is removing. There is no archived copy.
    public mutating func revoke(_ audience: Audience) {
        grants.removeAll { $0.audience == audience }
    }

    public mutating func revokeEverything() {
        grants.removeAll()
    }

    public func builder(for audience: Audience, at date: Date = Date()) throws -> SharePayloadBuilder {
        guard let grant = grant(for: audience, at: date) else {
            throw ConsentError.grantNotActive(audience)
        }
        return try SharePayloadBuilder(grant: grant, now: date)
    }
}
