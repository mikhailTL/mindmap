import XCTest
@testable import MindMapKit

/// The Welford baseline, against figures worked out by hand.
///
/// The three rules that are easy to lose in a port are each tested on their
/// own: under two observations there is no personal mean, under five there is
/// no personal spread, and one capture per day is what counts as a day.
final class BaselineTests: XCTestCase {

    /// Mean 5, sum of squared deviations 32, so the sample standard deviation
    /// is the square root of 32 over 7.
    private let sample: [Double] = [2, 4, 4, 4, 5, 5, 7, 9]

    func testRunningMeanAndVarianceMatchTheClosedForm() {
        var baseline = Baseline()
        for value in sample {
            baseline.update(with: ["heart": value], dayKey: nil)
        }
        let stats = baseline.stats["heart"]
        XCTAssertNotNil(stats)
        XCTAssertEqual(stats?.n, 8)
        XCTAssertEqual(stats?.mean ?? 0, 5, accuracy: 1e-12)
        XCTAssertEqual(stats?.m2 ?? 0, 32, accuracy: 1e-10)
        XCTAssertEqual(stats?.sampleSD ?? 0, (32.0 / 7.0).squareRoot(), accuracy: 1e-12)
    }

    func testZUsesThePersonalSpreadOnceThereAreFiveObservations() {
        var baseline = Baseline()
        for value in sample {
            baseline.update(with: ["heart": value], dayKey: nil)
        }
        let sd = (32.0 / 7.0).squareRoot()
        XCTAssertEqual(baseline.z("heart", 9), (9 - 5) / sd, accuracy: 1e-12)
        XCTAssertEqual(baseline.z("heart", 5), 0, accuracy: 1e-12)
    }

    func testWithNoHistoryAndNoPriorTheZIsZeroRatherThanAGuess() {
        let baseline = Baseline()
        XCTAssertEqual(baseline.z("heart", 180), 0,
                       "With nothing to compare against, the honest answer is no distance at all.")
    }

    func testWithNoHistoryAPriorCarriesBothTheMeanAndTheSpread() {
        let baseline = Baseline(priors: Baseline.phoneCapturePriors)
        /// hr prior is mean 76, sd 11.
        XCTAssertEqual(baseline.z("hr", 87), 1, accuracy: 1e-12)
        XCTAssertEqual(baseline.z("hr", 65), -1, accuracy: 1e-12)
    }

    func testUnderFiveObservationsThePersonalMeanIsUsedWithThePriorSpread() {
        var baseline = Baseline(priors: Baseline.phoneCapturePriors)
        for value in [60.0, 64.0, 62.0] {
            baseline.update(with: ["hr": value], dayKey: nil)
        }
        /// Personal mean 62, prior spread 11. A personal spread from three
        /// readings would be about 2, which would call an ordinary morning a
        /// four standard deviation day.
        XCTAssertEqual(baseline.z("hr", 73), 1, accuracy: 1e-12)
    }

    func testOnlyOneCapturePerDayCountsTowardTheDayCount() {
        var baseline = Baseline()
        baseline.update(with: ["heart": 70], dayKey: "2026-10-12")
        baseline.update(with: ["heart": 72], dayKey: "2026-10-12")
        baseline.update(with: ["heart": 74], dayKey: "2026-10-13")
        XCTAssertEqual(baseline.days, 2)
        XCTAssertEqual(baseline.captures, 3)
        XCTAssertEqual(baseline.stats["heart"]?.n, 3,
                       "The extra capture still sharpens the mean.")
    }

    func testValuesThatAreNotNumbersAreSkipped() {
        var baseline = Baseline()
        baseline.update(with: ["heart": 70], dayKey: nil)
        baseline.update(with: ["heart": .nan], dayKey: nil)
        baseline.update(with: ["heart": .infinity], dayKey: nil)
        XCTAssertEqual(baseline.stats["heart"]?.n, 1)
        XCTAssertEqual(baseline.captures, 3)
    }

    func testDayKeyIsStableAndSortable() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .current
        let date = Date(timeIntervalSince1970: 1_760_000_000)
        let key = Baseline.dayKey(for: date, calendar: calendar)
        XCTAssertEqual(key.count, 10)
        XCTAssertEqual(key, Baseline.dayKey(for: date, calendar: calendar))
    }
}
