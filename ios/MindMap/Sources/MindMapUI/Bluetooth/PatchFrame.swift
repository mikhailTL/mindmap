import Foundation
import MindMapKit

/// One 1 Hz, four-channel frame off the patch.
///
/// PLACEHOLDER WIRE FORMAT, to be checked against the firmware when it is
/// final. Twelve bytes, little endian, no padding:
///
///     offset  size  type    channel       scale
///     0       4     uint32  sequence      one count per second
///     4       2     int16   heart         bpm times 10
///     6       2     int16   sweat         microsiemens times 100
///     8       2     int16   temperature   degrees Celsius times 100
///     10      2     int16   movement      g times 1000
///
/// Fixed point rather than floats so a frame fits well inside one BLE
/// notification, and signed so a channel can report a negative drift without a
/// second encoding rule. Decoded byte by byte rather than by reinterpreting
/// memory, so there is no alignment or host-endianness assumption to get wrong.
public struct PatchFrame: Equatable, Sendable {

    public static let byteCount = 12

    public static let heartScale: Double = 10
    public static let sweatScale: Double = 100
    public static let temperatureScale: Double = 100
    public static let movementScale: Double = 1000

    public enum DecodeError: Error, Equatable, CustomStringConvertible {
        case wrongLength(got: Int, expected: Int)

        public var description: String {
            switch self {
            case .wrongLength(let got, let expected):
                return "The patch sent \(got) bytes and this build expects \(expected). The firmware and the app disagree about the frame format."
            }
        }
    }

    public let sequence: UInt32
    public let heartBPM: Double
    public let sweatMicrosiemens: Double
    public let skinTempCelsius: Double
    public let movementG: Double

    public init(data: Data) throws {
        guard data.count == Self.byteCount else {
            throw DecodeError.wrongLength(got: data.count, expected: Self.byteCount)
        }
        let bytes = [UInt8](data)

        func u16(_ i: Int) -> UInt16 {
            UInt16(bytes[i]) | (UInt16(bytes[i + 1]) << 8)
        }
        func i16(_ i: Int) -> Int16 {
            Int16(bitPattern: u16(i))
        }

        let seq = UInt32(bytes[0])
            | (UInt32(bytes[1]) << 8)
            | (UInt32(bytes[2]) << 16)
            | (UInt32(bytes[3]) << 24)

        self.sequence = seq
        self.heartBPM = Double(i16(4)) / Self.heartScale
        self.sweatMicrosiemens = Double(i16(6)) / Self.sweatScale
        self.skinTempCelsius = Double(i16(8)) / Self.temperatureScale
        self.movementG = Double(i16(10)) / Self.movementScale
    }

    /// The same frame as bytes. Here so a test can round trip a frame without
    /// a patch, and so the simulated patch in `PatchSimulator` writes exactly
    /// what the firmware will.
    public static func encode(sequence: UInt32, heartBPM: Double, sweatMicrosiemens: Double,
                              skinTempCelsius: Double, movementG: Double) -> Data {
        var bytes = [UInt8]()
        bytes.append(UInt8(truncatingIfNeeded: sequence))
        bytes.append(UInt8(truncatingIfNeeded: sequence >> 8))
        bytes.append(UInt8(truncatingIfNeeded: sequence >> 16))
        bytes.append(UInt8(truncatingIfNeeded: sequence >> 24))

        func append(_ value: Double, scale: Double) {
            let scaled = (value * scale).rounded()
            let bounded = min(max(scaled, Double(Int16.min)), Double(Int16.max))
            let raw = UInt16(bitPattern: Int16(bounded))
            bytes.append(UInt8(truncatingIfNeeded: raw))
            bytes.append(UInt8(truncatingIfNeeded: raw >> 8))
        }
        append(heartBPM, scale: heartScale)
        append(sweatMicrosiemens, scale: sweatScale)
        append(skinTempCelsius, scale: temperatureScale)
        append(movementG, scale: movementScale)
        return Data(bytes)
    }

    public func sample(receivedAt: Date = Date()) -> PatchSample {
        PatchSample(sequence: sequence,
                    receivedAt: receivedAt,
                    heartBPM: heartBPM,
                    sweatMicrosiemens: sweatMicrosiemens,
                    skinTempCelsius: skinTempCelsius,
                    movementG: movementG)
    }
}
