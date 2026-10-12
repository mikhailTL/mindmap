import XCTest
@testable import MindMapKit

/// The Swift scorer against the JavaScript one.
///
/// The expected values in `Fixtures/net-parity.json` were produced by running
/// the repo's own `src/signals/net.js` through `ios/tools/gen-parity-fixture.mjs`.
/// They are the web app's answers, not a second Swift implementation, so this
/// test fails if the port drifts from the product.
final class ScorerParityTests: XCTestCase {

    private struct Parity: Decodable {
        struct Case: Decodable {
            let z: [Double]
            let score: Int
            let p: Double
            let ref: Int
        }
        let signals: [String]
        let arch: [Int]
        let zLimit: Double
        let paramCount: Int
        let count: Int
        let cases: [Case]
    }

    private func loadFixture() throws -> Parity {
        try JSONDecoder().decode(Parity.self, from: try Fixture.data("net-parity"))
    }

    func testWeightsFileMatchesTheShippedNetwork() throws {
        let network = try MindScoreNetwork.bundled()
        let fixture = try loadFixture()
        XCTAssertEqual(network.architecture, fixture.arch)
        XCTAssertEqual(network.architecture, [4, 16, 10, 1])
        XCTAssertEqual(network.parameterCount, fixture.paramCount)
        XCTAssertEqual(network.parameterCount, 261)
        XCTAssertEqual(network.zLimit, fixture.zLimit, accuracy: 1e-12)
        XCTAssertEqual(fixture.signals,
                       MindScoreNetwork.inputOrder.map(\.rawValue),
                       "The four inputs are in a fixed order and the score depends on it.")
    }

    func testScoreMatchesTheJavaScriptScorerWithinOnePoint() throws {
        let network = try MindScoreNetwork.bundled()
        let fixture = try loadFixture()
        XCTAssertGreaterThan(fixture.cases.count, 500)

        var worstScoreGap = 0
        var worstProbabilityGap = 0.0
        var worstInput: [Double] = []

        for item in fixture.cases {
            let run = network.run(item.z)
            let scoreGap = abs(run.score - item.score)
            let probabilityGap = abs(run.p - item.p)
            if scoreGap > worstScoreGap {
                worstScoreGap = scoreGap
                worstInput = item.z
            }
            worstProbabilityGap = max(worstProbabilityGap, probabilityGap)
            XCTAssertLessThanOrEqual(scoreGap, 1,
                "At z \(item.z) Swift returned \(run.score) and JavaScript returned \(item.score).")
        }

        XCTAssertLessThanOrEqual(worstScoreGap, 1,
            "Worst score gap \(worstScoreGap) at z \(worstInput).")
        /// The two run the same arithmetic in the same order, so the only
        /// difference available to them is the last bits of tanh and exp.
        XCTAssertLessThan(worstProbabilityGap, 1e-9,
            "Worst probability gap \(worstProbabilityGap).")
    }

    func testReferenceModelMatchesTheJavaScriptReference() throws {
        let network = try MindScoreNetwork.bundled()
        let fixture = try loadFixture()
        for item in fixture.cases {
            let mine = network.reference(item.z).score
            XCTAssertLessThanOrEqual(abs(mine - item.ref), 1,
                "At z \(item.z) the Swift reference model returned \(mine) and JavaScript returned \(item.ref).")
        }
    }

    func testInputsAreClampedAndNonFiniteInputsAreTreatedAsZero() throws {
        let network = try MindScoreNetwork.bundled()
        XCTAssertEqual(network.score([99, 99, 99, 99]), network.score([3, 3, 3, 3]))
        XCTAssertEqual(network.score([-99, -99, -99, -99]), network.score([-3, -3, -3, -3]))
        XCTAssertEqual(network.score([.nan, 0, 0, 0]), network.score([0, 0, 0, 0]))
        XCTAssertEqual(network.score([.infinity, 0, 0, 0]), network.score([3, 0, 0, 0]))
    }

    func testMovementGatesRatherThanAdds() throws {
        let network = try MindScoreNetwork.bundled()
        /// A high heart and sweat reading taken while still should score above
        /// the same reading taken while moving, because movement discounts the
        /// other three rather than counting as stress.
        let still = network.score([2, 2, 0, -1])
        let moving = network.score([2, 2, 0, 3])
        XCTAssertGreaterThan(still, moving)
        /// Movement on its own is not stress: a still ordinary day and an
        /// active ordinary day both sit near the middle.
        XCTAssertLessThan(abs(network.score([0, 0, 0, 3]) - 50), 6)
    }

    func testMalformedWeightsAreRefusedRatherThanGuessedAt() {
        let shortLayer = Data(#"{"arch":[4,2,1],"zLimit":3.0,"layers":[{"w":[1,2],"b":[0,0]},{"w":[1,1],"b":[0]}]}"#.utf8)
        XCTAssertThrowsError(try MindScoreNetwork(jsonData: shortLayer))

        let noLayers = Data(#"{"arch":[4,16,10,1],"zLimit":3.0,"layers":[]}"#.utf8)
        XCTAssertThrowsError(try MindScoreNetwork(jsonData: noLayers))

        let badZ = Data(#"{"arch":[1,1],"zLimit":0,"layers":[{"w":[1],"b":[0]}]}"#.utf8)
        XCTAssertThrowsError(try MindScoreNetwork(jsonData: badZ))
    }
}
