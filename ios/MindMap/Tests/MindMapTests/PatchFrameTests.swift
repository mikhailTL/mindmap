import XCTest
@testable import MindMapKit
@testable import MindMapUI

/// The patch wire format.
///
/// The format itself is a placeholder until the firmware is final. What these
/// tests pin down is that decoding is the exact inverse of encoding, that a
/// frame of the wrong length is refused rather than read as rubbish, and that
/// the simulated patch goes through the same decode the radio does.
final class PatchFrameTests: XCTestCase {

    func testAFrameRoundTripsThroughTheWireFormat() throws {
        let data = PatchFrame.encode(sequence: 1234,
                                     heartBPM: 72.4,
                                     sweatMicrosiemens: 3.07,
                                     skinTempCelsius: 33.52,
                                     movementG: 0.014)
        XCTAssertEqual(data.count, PatchFrame.byteCount)

        let frame = try PatchFrame(data: data)
        XCTAssertEqual(frame.sequence, 1234)
        /// Each channel is fixed point, so the tolerance is half of one step
        /// of that channel's own scale.
        XCTAssertEqual(frame.heartBPM, 72.4, accuracy: 0.05)
        XCTAssertEqual(frame.sweatMicrosiemens, 3.07, accuracy: 0.005)
        XCTAssertEqual(frame.skinTempCelsius, 33.52, accuracy: 0.005)
        XCTAssertEqual(frame.movementG, 0.014, accuracy: 0.0005)
    }

    func testANegativeChannelSurvivesTheRoundTrip() throws {
        let data = PatchFrame.encode(sequence: 0,
                                     heartBPM: 0,
                                     sweatMicrosiemens: 0,
                                     skinTempCelsius: -4.25,
                                     movementG: 0)
        let frame = try PatchFrame(data: data)
        XCTAssertEqual(frame.skinTempCelsius, -4.25, accuracy: 0.005)
    }

    func testAFrameOfTheWrongLengthIsRefused() {
        XCTAssertThrowsError(try PatchFrame(data: Data([1, 2, 3]))) { error in
            XCTAssertEqual(error as? PatchFrame.DecodeError,
                           .wrongLength(got: 3, expected: PatchFrame.byteCount))
        }
        XCTAssertThrowsError(try PatchFrame(data: Data()))
        XCTAssertThrowsError(try PatchFrame(data: Data(repeating: 0,
                                                       count: PatchFrame.byteCount + 1)))
    }

    func testTheSequenceCounterIsLittleEndian() throws {
        var bytes = [UInt8](repeating: 0, count: PatchFrame.byteCount)
        bytes[0] = 0x01
        bytes[1] = 0x02
        bytes[2] = 0x03
        bytes[3] = 0x04
        let frame = try PatchFrame(data: Data(bytes))
        XCTAssertEqual(frame.sequence, 0x04030201)
    }

    func testTheSimulatedPatchProducesFramesTheRealDecoderCanRead() throws {
        let simulator = PatchSimulator(seed: 1)
        var previous: UInt32 = 0
        for _ in 0..<60 {
            let frame = try simulator.next()
            XCTAssertEqual(frame.sequence, previous + 1)
            previous = frame.sequence
            XCTAssertTrue(frame.heartBPM > 30 && frame.heartBPM < 200)
            XCTAssertTrue(frame.movementG >= 0)
            XCTAssertTrue(frame.skinTempCelsius > 20 && frame.skinTempCelsius < 45)
        }
    }

    func testTheSimulatedPatchIsDeterministic() throws {
        let a = PatchSimulator(seed: 99)
        let b = PatchSimulator(seed: 99)
        for _ in 0..<20 {
            XCTAssertEqual(try a.next(), try b.next())
        }
    }

    func testAFrameBecomesASampleWithTheSameFigures() throws {
        let frame = try PatchFrame(data: PatchFrame.encode(sequence: 7,
                                                           heartBPM: 70,
                                                           sweatMicrosiemens: 2.5,
                                                           skinTempCelsius: 33.3,
                                                           movementG: 0.4))
        let sample = frame.sample()
        XCTAssertEqual(sample.sequence, 7)
        XCTAssertEqual(sample.value(for: .heart), frame.heartBPM, accuracy: 1e-12)
        XCTAssertEqual(sample.value(for: .move), frame.movementG, accuracy: 1e-12)
        XCTAssertTrue(sample.aboveMovementLimit,
                      "0.4 g is over the 0.35 g line.")
    }
}
