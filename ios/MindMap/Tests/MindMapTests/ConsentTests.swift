import XCTest
@testable import MindMapKit

/// The consent types, and in particular what they refuse.
///
/// The strongest guarantee in this file is not tested here, because it cannot
/// be: `JournalNote`, `LocationFix` and `MicrophoneSession` have no `Shareable`
/// conformance, so `builder.add(note)` does not compile. There is no runtime
/// path to try. What is tested is everything the compiler cannot catch: a
/// category the grant does not name, a granularity finer than the audience may
/// ever see, an expired grant, and an empty ledger.
final class ConsentTests: XCTestCase {

    private let day = "2026-10-12"

    private func parentGrant(categories: Set<DataCategory>,
                             finest: Granularity = .instant) -> ConsentGrant {
        ConsentGrant(audience: .parent, categories: categories, finestGranularity: finest)
    }

    // MARK: The parent ceiling

    func testAParentGrantIsFlooredToADayEvenWhenItAsksForMore() {
        let grant = parentGrant(categories: [.dailyScore], finest: .instant)
        XCTAssertEqual(grant.finestGranularity, .day,
                       "A parent may see nothing finer-grained than a day, whatever the grant asks for.")
    }

    func testAParentCannotBeSentSecondBySecondReadings() throws {
        let grant = parentGrant(categories: [.dailyScore, .signalDetail])
        var builder = try SharePayloadBuilder(grant: grant)
        try builder.add(DailyScore(dayKey: day, value: 38))

        let detail = SignalDetail(takenAt: Date(), signal: .heart, value: 70)
        XCTAssertThrowsError(try builder.add(detail)) { error in
            XCTAssertEqual(error as? ConsentError,
                           .tooFine(.signalDetail, asked: .instant, allowed: .day, .parent),
                           "Expected a tooFine refusal, got \(error).")
        }

        let payload = builder.build()
        XCTAssertEqual(payload.categories, [.dailyScore])
        XCTAssertTrue(payload.items.allSatisfy { $0.granularity == .day })
    }

    func testAParentIsNotEvenOfferedAnythingFinerThanADay() {
        let offered = Set(ShareCatalog.offerable(to: .parent).map(\.category))
        XCTAssertTrue(offered.contains(.dailyScore))
        XCTAssertFalse(offered.contains(.signalDetail))
        XCTAssertFalse(offered.contains(.readingTimeline))
    }

    // MARK: Categories the grant does not name

    func testACategoryThatWasNotGrantedIsRefused() throws {
        let grant = parentGrant(categories: [.dailyScore])
        var builder = try SharePayloadBuilder(grant: grant)
        XCTAssertThrowsError(try builder.add(SleepDuration(dayKey: day, hours: 7.5))) { error in
            XCTAssertEqual(error as? ConsentError,
                           .categoryNotGranted(.sleepDuration, .parent))
        }
        XCTAssertTrue(builder.build().isEmpty)
    }

    func testAddIfAllowedReportsTheRefusalRatherThanDroppingItQuietly() throws {
        let grant = parentGrant(categories: [.dailyScore])
        var builder = try SharePayloadBuilder(grant: grant)
        let refusal = builder.addIfAllowed(WearStatus(dayKey: day, worn: true))
        XCTAssertEqual(refusal, .categoryNotGranted(.wearStatus, .parent))
        XCTAssertTrue(builder.build().isEmpty)
    }

    // MARK: Categories nothing can carry

    func testNamingANeverShareableCategoryInAGrantHasNoEffect() {
        let grant = parentGrant(categories: [.dailyScore, .note, .location, .audio])
        XCTAssertEqual(grant.categories, [.dailyScore])
    }

    func testTheCatalogSaysNothingShareableCarriesANoteALocationOrAudio() {
        for category in DataCategory.neverShareable {
            let row = ShareCatalog.rows.first { $0.category == category }
            XCTAssertNotNil(row, "\(category) should still be listed, so the screen can say it is never shared.")
            XCTAssertNil(row?.granularity,
                         "\(category) must have no shareable granularity.")
            XCTAssertFalse(row?.shareable ?? true)
        }
        XCTAssertEqual(DataCategory.neverShareable, [.note, .location, .audio])
    }

    func testEveryShareableCategoryIsOnTheCatalogAndNoneOfThemIsNeverShareable() {
        let shareable = ShareCatalog.rows.filter(\.shareable).map(\.category)
        XCTAssertFalse(shareable.isEmpty)
        for category in shareable {
            XCTAssertFalse(DataCategory.neverShareable.contains(category))
        }
    }

    // MARK: Grants and the ledger

    func testAnExpiredGrantCannotStartAPayload() {
        let grant = ConsentGrant(audience: .medicalProfessional,
                                 categories: [.dailyScore],
                                 finestGranularity: .day,
                                 grantedAt: Date(timeIntervalSince1970: 0),
                                 expiresAt: Date(timeIntervalSince1970: 100))
        XCTAssertFalse(grant.isActive(at: Date(timeIntervalSince1970: 200)))
        XCTAssertThrowsError(try SharePayloadBuilder(grant: grant,
                                                     now: Date(timeIntervalSince1970: 200))) { error in
            XCTAssertEqual(error as? ConsentError, .grantNotActive(.medicalProfessional))
        }
    }

    func testAFreshLedgerSharesNothingWithAnybody() {
        let ledger = ConsentLedger()
        for audience in Audience.allCases {
            XCTAssertNil(ledger.grant(for: audience))
            XCTAssertThrowsError(try ledger.builder(for: audience))
        }
    }

    func testRevokingRemovesTheGrantOutright() {
        var ledger = ConsentLedger()
        ledger.record(ConsentGrant(audience: .parent,
                                   categories: [.dailyScore],
                                   finestGranularity: .day))
        XCTAssertNotNil(ledger.grant(for: .parent))
        ledger.revoke(.parent)
        XCTAssertNil(ledger.grant(for: .parent))
        XCTAssertTrue(ledger.grants.isEmpty, "Revoking leaves no archived copy.")
    }

    func testThereIsNeverMoreThanOneActiveGrantPerAudience() {
        var ledger = ConsentLedger()
        ledger.record(ConsentGrant(audience: .parent, categories: [.dailyScore],
                                   finestGranularity: .day))
        ledger.record(ConsentGrant(audience: .parent, categories: [.dayBand],
                                   finestGranularity: .day))
        XCTAssertEqual(ledger.grants.filter { $0.audience == .parent }.count, 1)
        XCTAssertEqual(ledger.grant(for: .parent)?.categories, [.dayBand])
    }

    // MARK: A professional sees only what was consented to

    func testAMedicalProfessionalGetsExactlyTheGrantAndNoMore() throws {
        let grant = ConsentGrant(audience: .medicalProfessional,
                                 categories: [.dailyScore, .signalDetail],
                                 finestGranularity: .instant)
        var builder = try SharePayloadBuilder(grant: grant)
        try builder.add(DailyScore(dayKey: day, value: 61))
        try builder.add(SignalDetail(takenAt: Date(), signal: .sweat, value: 3.0))
        XCTAssertThrowsError(try builder.add(SleepDuration(dayKey: day, hours: 7)))
        XCTAssertEqual(builder.build().categories, [.dailyScore, .signalDetail])
    }

    func testGranularityOrdersCoarsestFirst() {
        XCTAssertLessThan(Granularity.day, Granularity.hour)
        XCTAssertLessThan(Granularity.hour, Granularity.instant)
        XCTAssertEqual(Audience.parent.ceiling, .day)
        XCTAssertEqual(Audience.student.ceiling, .instant)
    }
}
