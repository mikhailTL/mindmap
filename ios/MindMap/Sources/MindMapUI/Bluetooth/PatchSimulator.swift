import Foundation
import MindMapKit

/// A stand-in patch that runs on the phone.
///
/// Every number this produces is generated here and now by the walk below. It
/// is not recorded from a person, it is not recorded from a built unit, and no
/// unit has been built or worn. It exists for two reasons:
///
///   * App Review has no patch, and a reviewer who cannot get past the pairing
///     screen will reject the app;
///   * the decode path and the scorer can be exercised on a simulator.
///
/// It writes real frames through `PatchFrame.encode` and they are decoded by
/// the same `PatchFrame(data:)` the radio path uses, so the simulated route
/// tests the wire format rather than going around it.
public final class PatchSimulator {

    /// Deterministic, so two runs of the demo show the same thing and a
    /// screenshot can be reproduced. A small linear congruential generator.
    private var state: UInt64
    private var sequence: UInt32 = 0

    /// Where the walk sits, in each channel's own unit.
    private var heart: Double = 72
    private var sweat: Double = 2.8
    private var temp: Double = 33.6
    private var move: Double = 0.02

    public init(seed: UInt64 = 20261012) {
        self.state = seed
    }

    /// 0 to 1.
    private func unit() -> Double {
        state = state &* 6364136223846793005 &+ 1442695040888963407
        return Double(state >> 11) / Double(1 << 53)
    }

    /// Roughly centred on zero.
    private func wobble() -> Double { unit() * 2 - 1 }

    /// The next second of the stream, as the bytes the firmware would write.
    public func nextFrameData() -> Data {
        sequence += 1

        /// A slow pull back toward the resting figure plus a small step, so the
        /// walk neither runs away nor sits still.
        func drift(_ value: Double, toward rest: Double, step: Double, pull: Double) -> Double {
            value + (rest - value) * pull + wobble() * step
        }

        heart = drift(heart, toward: 74, step: 0.9, pull: 0.03)
        sweat = drift(sweat, toward: 2.9, step: 0.05, pull: 0.04)
        temp  = drift(temp,  toward: 33.6, step: 0.03, pull: 0.05)
        move  = max(0, drift(move, toward: 0.03, step: 0.015, pull: 0.2))

        return PatchFrame.encode(sequence: sequence,
                                 heartBPM: heart,
                                 sweatMicrosiemens: sweat,
                                 skinTempCelsius: temp,
                                 movementG: move)
    }

    /// The next second, decoded the same way a radio frame is.
    public func next() throws -> PatchFrame {
        try PatchFrame(data: nextFrameData())
    }
}
