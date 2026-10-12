import Foundation

/// How a reading was taken. All three land on one scale, which is the point of
/// the shared last step in `ScoreEngine`.
public enum ReadingSource: String, Codable, Sendable {
    case patch
    case phoneSensors
    case selfReport

    public var label: String {
        switch self {
        case .patch:        return "Patch"
        case .phoneSensors: return "Camera and microphone"
        case .selfReport:   return "Six questions"
        }
    }
}

/// One raw sample off the patch. Four channels at 1 Hz, in the units the
/// firmware reports.
public struct PatchSample: Codable, Sendable, Equatable {
    /// Sample counter from the patch, incrementing once per second.
    public let sequence: UInt32
    /// When the phone received it.
    public let receivedAt: Date
    public let heartBPM: Double
    public let sweatMicrosiemens: Double
    public let skinTempCelsius: Double
    public let movementG: Double

    public init(sequence: UInt32, receivedAt: Date = Date(),
                heartBPM: Double, sweatMicrosiemens: Double,
                skinTempCelsius: Double, movementG: Double) {
        self.sequence = sequence
        self.receivedAt = receivedAt
        self.heartBPM = heartBPM
        self.sweatMicrosiemens = sweatMicrosiemens
        self.skinTempCelsius = skinTempCelsius
        self.movementG = movementG
    }

    public func value(for signal: Signal) -> Double {
        switch signal {
        case .heart: return heartBPM
        case .sweat: return sweatMicrosiemens
        case .temp:  return skinTempCelsius
        case .move:  return movementG
        }
    }

    /// Keyed the way `Baseline` keys its running statistics.
    public var features: [String: Double] {
        [Signal.heart.rawValue: heartBPM,
         Signal.sweat.rawValue: sweatMicrosiemens,
         Signal.temp.rawValue: skinTempCelsius,
         Signal.move.rawValue: movementG]
    }

    /// True when this one sample was taken while moving harder than the limit.
    public var aboveMovementLimit: Bool { movementG > movementLimitG }
}

/// What one signal contributed to a score, for the four rows under the number.
public struct SignalContribution: Sendable, Equatable, Identifiable {
    public let signal: Signal
    /// Distance from this wearer's own baseline, clamped the way the network
    /// clamps it.
    public let z: Double
    /// The measured value in the signal's own unit, when there was one.
    public let value: Double?
    /// 0 to 100, how far this one signal sits from the wearer's baseline. Not
    /// a share of the score: the four do not sum to it.
    public let ringValue: Int

    public var id: String { signal.rawValue }

    public init(signal: Signal, z: Double, value: Double?, ringValue: Int) {
        self.signal = signal
        self.z = z
        self.value = value
        self.ringValue = ringValue
    }
}
