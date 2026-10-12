import Foundation

/// The four signals the patch measures, in the one order every surface uses.
///
/// Ported from `src/signals/sensors.js` and `src/signals/net.js`. The order is
/// load bearing: it is the order of the network's four inputs, so changing it
/// changes the score.
public enum Signal: String, CaseIterable, Codable, Sendable, Identifiable {
    case heart
    case sweat
    case temp
    case move

    public var id: String { rawValue }

    /// Index of this signal in a reading's z-score vector.
    public var inputIndex: Int {
        switch self {
        case .heart: return 0
        case .sweat: return 1
        case .temp:  return 2
        case .move:  return 3
        }
    }

    public var name: String {
        switch self {
        case .heart: return "Heart"
        case .sweat: return "Sweat"
        case .temp:  return "Temperature"
        case .move:  return "Movement"
        }
    }

    public var unit: String {
        switch self {
        case .heart: return "bpm"
        case .sweat: return "\u{00B5}S"
        case .temp:  return "\u{00B0}C"
        case .move:  return "g"
        }
    }

    /// One line, the same wording the web app uses.
    public var short: String {
        switch self {
        case .heart: return "How fast it beats, and how steady the beat is."
        case .sweat: return "Sweat you cannot feel. Rises first when you tense."
        case .temp:  return "Skin cools under strain, warms as you settle."
        case .move:  return "Separates a hard run from a hard day."
        }
    }

    /// The hex the web app gives this signal, carried over so the two products
    /// agree. Graphics only: colour never carries text in this product.
    public var hex: String {
        switch self {
        case .heart: return "e11919"
        case .sweat: return "e86a05"
        case .temp:  return "199e19"
        case .move:  return "1560e0"
        }
    }

    /// SF Symbol for this signal.
    public var symbolName: String {
        switch self {
        case .heart: return "heart.fill"
        case .sweat: return "drop.fill"
        case .temp:  return "thermometer"
        case .move:  return "figure.walk"
        }
    }
}

/// Movement above this, in g, holds a reading back rather than counting it as
/// stress. Same line as `src/signals/motion.js`.
public let movementLimitG: Double = 0.35
