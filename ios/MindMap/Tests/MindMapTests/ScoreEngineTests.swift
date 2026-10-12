import XCTest
@testable import MindMapKit

/// The bands, the sentence, and the two routes landing on one scale.
final class ScoreEngineTests: XCTestCase {

    private func engine() throws -> ScoreEngine {
        ScoreEngine(network: try MindScoreNetwork.bundled())
    }

    private func window(count: Int, movementG: Double = 0.01) -> [PatchSample] {
        (0..<count).map { i in
            PatchSample(sequence: UInt32(i + 1),
                        receivedAt: Date(timeIntervalSince1970: Double(i)),
                        heartBPM: 72,
                        sweatMicrosiemens: 2.9,
                        skinTempCelsius: 33.6,
                        movementG: movementG)
        }
    }

    func testTheBandCutPointsAreWhereTheWebAppPutsThem() {
        XCTAssertEqual(ScoreBand.of(0), .low)
        XCTAssertEqual(ScoreBand.of(34), .low)
        XCTAssertEqual(ScoreBand.of(35), .usual)
        XCTAssertEqual(ScoreBand.of(57), .usual)
        XCTAssertEqual(ScoreBand.of(58), .up)
        XCTAssertEqual(ScoreBand.of(72), .up)
        XCTAssertEqual(ScoreBand.of(73), .high)
        XCTAssertEqual(ScoreBand.of(100), .high)
        XCTAssertTrue(ScoreBand.low.calm)
        XCTAssertTrue(ScoreBand.usual.calm)
        XCTAssertFalse(ScoreBand.up.calm)
        XCTAssertFalse(ScoreBand.high.calm)
    }

    func testWithNoHistoryTheScoreSitsInTheMiddleAndSaysSo() throws {
        let score = try XCTUnwrap(engine().score(window: window(count: 30),
                                                 baseline: Baseline()))
        XCTAssertEqual(score.value, 50,
                       "With nothing to compare against, every z is zero and the network returns the middle.")
        XCTAssertEqual(score.band, .usual)
        XCTAssertEqual(score.source, .patch)
        XCTAssertEqual(score.contributions.count, 4)
        XCTAssertEqual(score.contributions.map(\.signal), [.heart, .sweat, .temp, .move])
        XCTAssertTrue(score.sentence.hasPrefix("Right now you are sitting in your usual range."))
        XCTAssertTrue(score.sentence.contains("Nothing in the reading stands out on its own."))
        XCTAssertNil(score.heldBackReason)
    }

    func testAnEmptyWindowScoresNothingRatherThanGuessing() throws {
        XCTAssertNil(try engine().score(window: [], baseline: Baseline()))
    }

    func testMovementOverTheLineHoldsTheReadingBack() throws {
        let score = try XCTUnwrap(engine().score(window: window(count: 30, movementG: 0.9),
                                                 baseline: Baseline()))
        let reason = try XCTUnwrap(score.heldBackReason)
        XCTAssertTrue(reason.contains("0.90 g"))
        XCTAssertTrue(reason.contains("not counted as stress"))
    }

    func testTheSentenceNamesTheBiggestSignalWhenThereIsOne() throws {
        /// A built-up baseline, then a reading well above it on heart.
        var baseline = Baseline()
        for _ in 0..<8 {
            baseline.update(with: ["heart": 70, "sweat": 2.9, "temp": 33.6, "move": 0.01],
                            dayKey: nil)
        }
        baseline.update(with: ["heart": 74, "sweat": 2.9, "temp": 33.6, "move": 0.01],
                        dayKey: nil)
        let raised = (0..<30).map { i in
            PatchSample(sequence: UInt32(i + 1), receivedAt: Date(),
                        heartBPM: 90, sweatMicrosiemens: 2.9,
                        skinTempCelsius: 33.6, movementG: 0.01)
        }
        let score = try XCTUnwrap(engine().score(window: raised, baseline: baseline))
        XCTAssertGreaterThan(score.value, 50)
        XCTAssertTrue(score.sentence.contains("Heart is the biggest single part of that"),
                      "Got: \(score.sentence)")
        XCTAssertTrue(score.sentence.contains("above your own average"))
    }

    func testTheRingsAreSignedDistanceAndNotAShareOfTheScore() {
        XCTAssertEqual(ScoreEngine.ringValue(for: 0, zLimit: 3), 50)
        XCTAssertEqual(ScoreEngine.ringValue(for: 3, zLimit: 3), 100)
        XCTAssertEqual(ScoreEngine.ringValue(for: -3, zLimit: 3), 0)
        XCTAssertEqual(ScoreEngine.ringValue(for: 99, zLimit: 3), 100)
        XCTAssertEqual(ScoreEngine.ringValue(for: 1.5, zLimit: 3), 75)
    }

    // MARK: The six questions

    func testTheMiddleOfEveryScaleIsTheMiddleOfTheRange() {
        let answers = Dictionary(uniqueKeysWithValues: SelfReport.items.map { ($0.id, 2) })
        let score = SelfReport.score(answers: answers)
        XCTAssertEqual(score.value, 50)
        XCTAssertEqual(score.band, .usual)
        XCTAssertEqual(score.source, .selfReport)
        XCTAssertTrue(score.sentence.contains("Nothing you answered stands out on its own."))
    }

    func testTheEndsOfEveryScaleReachBothBands() {
        let worst = Dictionary(uniqueKeysWithValues: SelfReport.items.map { ($0.id, 4) })
        let best = Dictionary(uniqueKeysWithValues: SelfReport.items.map { ($0.id, 0) })
        XCTAssertEqual(SelfReport.score(answers: worst).value, 92)
        XCTAssertEqual(SelfReport.score(answers: best).value, 8)
        XCTAssertEqual(SelfReport.score(answers: worst).band, .high)
        XCTAssertEqual(SelfReport.score(answers: best).band, .low)
    }

    func testTheSixQuestionsAreTheSixQuestions() {
        XCTAssertEqual(SelfReport.items.count, 6)
        XCTAssertEqual(SelfReport.items.map(\.id),
                       ["tension", "edge", "sleep", "energy", "focus", "demand"])
        XCTAssertEqual(SelfReport.points, [0, 1, 2, 3, 4])
        XCTAssertEqual(SelfReport.k, 2.4, accuracy: 1e-12,
                       "The same logistic constant as the patch route, which is what puts the two on one scale.")
    }

    func testAPartlyAnsweredSetIsNotComplete() {
        XCTAssertFalse(SelfReport.isComplete([:]))
        XCTAssertFalse(SelfReport.isComplete(["tension": 2]))
        let all = Dictionary(uniqueKeysWithValues: SelfReport.items.map { ($0.id, 1) })
        XCTAssertTrue(SelfReport.isComplete(all))
    }

    func testTheProductWordingIsFixedAndSaysWhatTheAppIsNot() {
        XCTAssertEqual(Vocabulary.score, "Mind Score")
        XCTAssertTrue(Vocabulary.notAMedicalDevice.contains("not a medical device"))
        XCTAssertTrue(Vocabulary.notAMedicalDevice.contains("does not diagnose or treat any condition"))
    }
}
