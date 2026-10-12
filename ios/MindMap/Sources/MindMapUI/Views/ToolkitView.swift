#if os(iOS)
import SwiftUI
import MindMapKit

/// The Teen Toolkit.
///
/// Nothing in here calls anything. Every tool is local logic on what was typed
/// or tapped, which is the only kind of claim this app can make honestly, and
/// nothing is labelled as intelligence it does not have.
///
/// Nothing in here asks for physical discomfort. Every step is either noticing
/// what is already there or slowing a breath down.
struct ToolkitView: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink {
                        PacerView()
                    } label: {
                        row("Paced breathing", "2 to 5 min",
                            "A circle to breathe with at five to six breaths a minute.")
                    }
                    NavigationLink {
                        FeelingMapView()
                    } label: {
                        row("Feeling map", "1 min",
                            "Put a dot on two axes and get the closest word out of sixteen. Wound up and flat are both bad days and they need opposite things.")
                    }
                    NavigationLink {
                        SensesView()
                    } label: {
                        row("Senses count", "3 min",
                            "Five things you can see, four you can hear, down to one. It holds the count and the list.")
                    }
                }

                Section("Also in the web app") {
                    Text("Absolute words and The pile are in the web app and are not in this build yet.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Section {
                    Text("If you are in danger now, that is an emergency number or a crisis line, not an app.")
                        .font(.footnote)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Toolkit")
        }
    }

    private func row(_ title: String, _ time: String, _ lede: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title).font(.body.weight(.semibold))
                Spacer(minLength: 8)
                Text(time).font(.caption).foregroundStyle(.secondary)
            }
            Text(lede)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 4)
    }
}

/// Paced breathing at the resonance-frequency rate, five to six breaths a
/// minute. The circle grows on the way in and shrinks on the way out, and the
/// animation does not run under Reduce Motion: the words carry it instead.
struct PacerView: View {

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// Breaths a minute.
    @State private var rate: Double = 5.5
    @State private var running = false
    @State private var breathingIn = true
    @State private var ticker: Task<Void, Never>?

    /// The share of each cycle spent breathing in.
    private let inShare = 0.4

    private var cycle: Double { 60 / rate }
    private var inSeconds: Double { cycle * inShare }
    private var outSeconds: Double { cycle * (1 - inShare) }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Circle()
                    .fill(Color.accentColor.opacity(0.22))
                    .overlay(Circle().stroke(Color.accentColor, lineWidth: 3))
                    .frame(width: 230, height: 230)
                    .scaleEffect(running && !reduceMotion ? (breathingIn ? 1 : 0.55) : 0.8)
                    .animation(reduceMotion ? nil
                               : .easeInOut(duration: breathingIn ? inSeconds : outSeconds),
                               value: breathingIn)
                    .accessibilityHidden(true)

                Text(running ? (breathingIn ? "Breathe in" : "Breathe out") : "Ready")
                    .font(.title2.weight(.semibold))
                    .accessibilityLabel(running ? (breathingIn ? "Breathe in" : "Breathe out") : "Ready")

                VStack(alignment: .leading, spacing: 8) {
                    Text("Pace")
                        .font(.subheadline.weight(.semibold))
                    Picker("Pace", selection: $rate) {
                        Text("5 a minute").tag(5.0)
                        Text("5.5 a minute").tag(5.5)
                        Text("6 a minute").tag(6.0)
                    }
                    .pickerStyle(.segmented)
                }

                Button(running ? "Stop" : "Start") {
                    if running { stop() } else { start() }
                }
                .font(.body.weight(.semibold))
                .buttonStyle(.borderedProminent)

                Text("Five to six breaths a minute is the pace the slow-breathing literature calls resonance frequency. Stop whenever you want. If it makes you light headed, stop and breathe normally.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding()
        }
        .navigationTitle("Paced breathing")
        .onDisappear { stop() }
    }

    private func start() {
        running = true
        breathingIn = true
        ticker?.cancel()
        ticker = Task { @MainActor in
            while !Task.isCancelled {
                let seconds = breathingIn ? inSeconds : outSeconds
                try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
                if Task.isCancelled { return }
                breathingIn.toggle()
            }
        }
    }

    private func stop() {
        ticker?.cancel()
        ticker = nil
        running = false
    }
}

/// A two-axis map, energy against pleasantness, and the nearest of sixteen
/// words to wherever the dot is put. The word is the point: wound up and flat
/// are both bad days and they ask for opposite things.
///
/// Ported from `src/kit/feelings.jsx`, including the sixteen words and what
/// each one asks for.
struct FeelingMapView: View {

    struct Feeling: Identifiable {
        let word: String
        let x: Double
        let y: Double
        let asks: String
        var id: String { word }
    }

    /// x: unpleasant to pleasant. y: low energy to high energy.
    static let words: [Feeling] = [
        Feeling(word: "Panicky", x: -0.75, y: 0.90,
                asks: "Energy first. The pacer is the one built for this."),
        Feeling(word: "Angry", x: -0.85, y: 0.55,
                asks: "Wait before you send anything. Energy down first."),
        Feeling(word: "Anxious", x: -0.55, y: 0.70,
                asks: "A long out-breath, then name what the worry is actually about."),
        Feeling(word: "Overloaded", x: -0.35, y: 0.45,
                asks: "Too many things at once. The pile is for splitting them up."),
        Feeling(word: "Restless", x: -0.10, y: 0.70,
                asks: "Energy with nowhere to go. Move first, sit still second."),
        Feeling(word: "Keen", x: 0.45, y: 0.75,
                asks: "Nothing to fix. Spend it on the thing you were avoiding."),
        Feeling(word: "Excited", x: 0.80, y: 0.85, asks: "Nothing to fix."),
        Feeling(word: "Proud", x: 0.85, y: 0.35,
                asks: "Nothing to fix. Worth telling one person."),
        Feeling(word: "Stuck", x: -0.70, y: -0.10,
                asks: "One sentence is doing the damage. Absolute words is for that."),
        Feeling(word: "Embarrassed", x: -0.45, y: 0.10,
                asks: "It shrinks fastest when it is said out loud to one person."),
        Feeling(word: "Low", x: -0.80, y: -0.55,
                asks: "Not a problem to solve at speed. Senses count is the gentlest one here."),
        Feeling(word: "Drained", x: -0.40, y: -0.80,
                asks: "Rest, not technique. None of this is urgent."),
        Feeling(word: "Bored", x: -0.05, y: -0.60,
                asks: "Not a stress state. Nothing here is for it."),
        Feeling(word: "Settled", x: 0.55, y: -0.30, asks: "Nothing to fix."),
        Feeling(word: "Calm", x: 0.70, y: -0.70,
                asks: "Nothing to fix. This is the one the pacer is aiming at."),
        Feeling(word: "Sleepy", x: 0.25, y: -0.90, asks: "Nothing to fix."),
    ]

    @State private var x: Double = 0
    @State private var y: Double = 0
    @State private var placed = false

    private var found: Feeling? {
        guard placed else { return nil }
        return Self.nearest(x: x, y: y)
    }

    static func nearest(x: Double, y: Double) -> Feeling {
        words.min { a, b in
            (x - a.x) * (x - a.x) + (y - a.y) * (y - a.y)
                < (x - b.x) * (x - b.x) + (y - b.y) * (y - b.y)
        } ?? words[0]
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Put the dot where you are. Left to right is unpleasant to pleasant, bottom to top is low energy to high energy.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)

                /// A square rather than a free-form canvas, so the two axes
                /// mean the same thing on every screen width.
                GeometryReader { geometry in
                    let side = min(geometry.size.width, 320)
                    ZStack {
                        Rectangle()
                            .fill(Color.secondary.opacity(0.12))
                        Path { path in
                            path.move(to: CGPoint(x: side / 2, y: 0))
                            path.addLine(to: CGPoint(x: side / 2, y: side))
                            path.move(to: CGPoint(x: 0, y: side / 2))
                            path.addLine(to: CGPoint(x: side, y: side / 2))
                        }
                        .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 26, height: 26)
                            .position(x: (x + 1) / 2 * side, y: (1 - y) / 2 * side)
                            .opacity(placed ? 1 : 0.35)
                    }
                    .frame(width: side, height: side)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 0)
                            .onChanged { value in
                                x = min(max(value.location.x / side * 2 - 1, -1), 1)
                                y = min(max(1 - value.location.y / side * 2, -1), 1)
                                placed = true
                            }
                    )
                }
                .frame(height: 320)
                .accessibilityElement()
                .accessibilityLabel("Feeling map")
                .accessibilityValue(found?.word ?? "Nothing placed yet")
                .accessibilityAdjustableAction { direction in
                    switch direction {
                    case .increment: x = min(x + 0.12, 1)
                    case .decrement: x = max(x - 0.12, -1)
                    @unknown default: break
                    }
                    placed = true
                }

                if let found {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(found.word).font(.title2.weight(.semibold))
                        Text(found.asks)
                            .font(.callout)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
            .padding()
        }
        .navigationTitle("Feeling map")
    }
}

/// Five, four, three, two, one, holding the count and the entries, which is the
/// part the exercise never has on paper. Any sense can be skipped: there is not
/// always something to smell, and the exercise should not stall on it.
struct SensesView: View {

    struct Step: Identifiable {
        let id: String
        let count: Int
        let ask: String
        let example: String
    }

    static let steps: [Step] = [
        Step(id: "see", count: 5, ask: "Five things you can see",
             example: "a door handle, the corner of a screen"),
        Step(id: "hear", count: 4, ask: "Four things you can hear",
             example: "a fan, traffic, somebody two rooms away"),
        Step(id: "feel", count: 3, ask: "Three things you can feel touching you",
             example: "the chair, a sleeve, the floor"),
        Step(id: "smell", count: 2, ask: "Two things you can smell",
             example: "or nothing, which is an answer"),
        Step(id: "taste", count: 1, ask: "One thing you can taste",
             example: "water counts"),
    ]

    @State private var at = 0
    @State private var got: [String: [String]] = [:]
    @State private var text = ""

    private var step: Step? { at < Self.steps.count ? Self.steps[at] : nil }

    var body: some View {
        List {
            if let step {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(step.ask).font(.title3.weight(.semibold))
                            .fixedSize(horizontal: false, vertical: true)
                        Text("For example: \(step.example)")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.vertical, 4)

                    HStack {
                        TextField("One thing", text: $text)
                            .submitLabel(.done)
                            .onSubmit(add)
                        Button("Add", action: add)
                            .disabled(text.trimmingCharacters(in: .whitespaces).isEmpty)
                    }

                    /// Indexed rather than keyed on the text: two of the
                    /// five things you can see can perfectly well be the same
                    /// words, and duplicate identities break a ForEach.
                    let entries = got[step.id] ?? []
                    ForEach(entries.indices, id: \.self) { index in
                        Text(entries[index])
                    }

                    Text("\((got[step.id] ?? []).count) of \(step.count)")
                        .font(.footnote)
                        .monospacedDigit()
                        .foregroundStyle(.secondary)

                    Button("Skip this one") {
                        text = ""
                        at += 1
                    }
                    .font(.callout)
                }
            } else {
                Section {
                    Text("That is the whole thing.").font(.title3.weight(.semibold))
                    Button("Start again") {
                        at = 0
                        got = [:]
                        text = ""
                    }
                }
                ForEach(Self.steps) { step in
                    if let entries = got[step.id], !entries.isEmpty {
                        Section(step.ask) {
                            ForEach(entries.indices, id: \.self) { Text(entries[$0]) }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Senses count")
    }

    private func add() {
        guard let step else { return }
        let trimmed = String(text.trimmingCharacters(in: .whitespacesAndNewlines).prefix(60))
        guard !trimmed.isEmpty else { return }
        var entries = got[step.id] ?? []
        entries.append(trimmed)
        got[step.id] = entries
        text = ""
        if entries.count >= step.count { at += 1 }
    }
}
#endif
