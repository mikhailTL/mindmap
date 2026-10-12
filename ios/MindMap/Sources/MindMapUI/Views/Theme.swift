#if os(iOS)
import SwiftUI
import MindMapKit

/// The small amount of shared presentation this app needs.
///
/// Deliberately thin. There are no custom fonts, no custom control styles and
/// no colour behind text: the system text styles carry Dynamic Type and the
/// system colours carry Dark Mode without a second code path. The only colour
/// this file adds is the one each signal owns, used on a graphic and never on
/// a word.
extension Color {
    /// Six hex digits, no alpha. Falls back to `.secondary` on anything else,
    /// so a typo cannot make a view fail to build or draw nothing.
    init(signalHex hex: String) {
        let cleaned = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        guard cleaned.count == 6, let value = UInt32(cleaned, radix: 16) else {
            self = .secondary
            return
        }
        self = Color(red: Double((value >> 16) & 0xFF) / 255,
                     green: Double((value >> 8) & 0xFF) / 255,
                     blue: Double(value & 0xFF) / 255)
    }
}

extension Signal {
    var color: Color { Color(signalHex: hex) }
}

/// The line that has to be on any screen showing a score, and in the App Store
/// description. Wording is fixed: see `Vocabulary.notAMedicalDevice`.
struct NotAMedicalDevice: View {
    var body: some View {
        Text(Vocabulary.notAMedicalDevice)
            .font(.footnote)
            .foregroundStyle(.secondary)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityAddTraits(.isStaticText)
    }
}

/// The score, drawn as one ring with the number inside it.
///
/// The ring is a graphic, so the number inside it is also given as an
/// accessibility label in words: a VoiceOver user should hear the sentence and
/// the number, not a percentage of a circle.
struct ScoreDial: View {
    let score: MindScore
    var diameter: CGFloat = 220

    private var fraction: Double {
        min(max(Double(score.value) / 100, 0), 1)
    }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.18), lineWidth: 16)
            Circle()
                .trim(from: 0, to: fraction)
                .stroke(Color.accentColor, style: StrokeStyle(lineWidth: 16, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 2) {
                Text("\(score.value)")
                    .font(.system(.largeTitle, design: .rounded).weight(.bold))
                    .monospacedDigit()
                Text(Vocabulary.score)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: diameter, height: diameter)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(Vocabulary.score) \(score.value) out of 100")
        .accessibilityValue(score.band.word)
    }
}

/// One of the four signals, under the score.
struct SignalRow: View {
    let contribution: SignalContribution

    private var distance: String {
        let n = String(format: "%.1f", abs(contribution.z))
        let plural = n == "1.0" ? "" : "s"
        if abs(contribution.z) < 0.05 { return "level with your own average" }
        let direction = contribution.z > 0 ? "above" : "below"
        return "\(n) standard deviation\(plural) \(direction) your own average"
    }

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Image(systemName: contribution.signal.symbolName)
                .foregroundStyle(contribution.signal.color)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                Text(contribution.signal.name)
                    .font(.body.weight(.semibold))
                Text(distance)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 8)
            if let value = contribution.value {
                Text("\(formatted(value)) \(contribution.signal.unit)")
                    .font(.callout)
                    .monospacedDigit()
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 2)
        .accessibilityElement(children: .combine)
    }

    private func formatted(_ value: Double) -> String {
        switch contribution.signal {
        case .heart: return String(format: "%.0f", value)
        case .sweat: return String(format: "%.2f", value)
        case .temp:  return String(format: "%.1f", value)
        case .move:  return String(format: "%.2f", value)
        }
    }
}

/// A short block of explanation, used where a screen has to say what something
/// is before it shows a number.
struct Explainer: View {
    let title: String
    let body_: String

    init(_ title: String, _ body_: String) {
        self.title = title
        self.body_ = body_
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.subheadline.weight(.semibold))
            Text(body_)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
#endif
