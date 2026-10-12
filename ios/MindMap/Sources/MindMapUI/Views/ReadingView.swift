#if os(iOS)
import SwiftUI
import MindMapKit

/// Take a reading, in three states on one screen: choose a way in, take the
/// reading, see the result.
///
/// Entering a reading replaces the chooser rather than appearing under it,
/// which is what stops the screen asking somebody to scroll for the thing a
/// card just described. Same decision as `src/views/CheckIn.jsx`.
struct ReadingView: View {

    @ObservedObject var model: AppModel

    private enum Route: Hashable {
        case chooser
        case patch
        case demoPatch
        case questions
    }

    @State private var route: Route = .chooser
    @State private var answers: [String: Int] = [:]

    var body: some View {
        NavigationStack {
            Group {
                switch route {
                case .chooser:
                    chooser
                case .patch:
                    collecting(source: .patch)
                case .demoPatch:
                    collecting(source: .demoPatch)
                case .questions:
                    questions
                }
            }
            .navigationTitle("Take a reading")
        }
    }

    // MARK: Choosing

    private var chooser: some View {
        List {
            Section {
                Button {
                    route = .patch
                    model.beginReading(using: .patch)
                } label: {
                    way(title: "Use the patch",
                        lede: "Thirty seconds of four signals at once. The patch goes on the outer upper arm, long axis along the arm.",
                        symbol: "dot.radiowaves.left.and.right")
                }
                Button {
                    route = .questions
                    answers = [:]
                } label: {
                    way(title: "Answer six questions",
                        lede: "No patch and no camera. Six scales, then one \(Vocabulary.score) and the sentence that goes with it.",
                        symbol: "list.bullet")
                }
            }

            Section("Without a patch to hand") {
                Button {
                    route = .demoPatch
                    model.beginReading(using: .demoPatch)
                } label: {
                    way(title: "Demo patch",
                        lede: "A simulated stream generated on this phone, so the reading and the score can be seen without a unit. Not recorded from anybody.",
                        symbol: "square.dashed")
                }
                Button("Fill in a fortnight of demo readings") {
                    model.seedDemoHistory()
                }
                .font(.callout)
            }

            Section {
                Explainer("What the model is",
                          "Four signals, each as a distance from your own fourteen-day baseline, through a \(model.parameterCount)-parameter model fitted to a published-coefficient reference model. The reference model and the fit are documented in tools/net/train.py. It is not trained on anybody's readings.")
                NotAMedicalDevice()
            }
        }
        .listStyle(.insetGrouped)
    }

    private func way(title: String, lede: String, symbol: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(Color.accentColor)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.body.weight(.semibold))
                Text(lede)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.vertical, 4)
        .accessibilityElement(children: .combine)
    }

    // MARK: Collecting

    @ViewBuilder
    private func collecting(source: AppModel.Source) -> some View {
        List {
            if case .finished = model.phase, let score = model.today {
                Section {
                    VStack(spacing: 16) {
                        Text(score.sentence)
                            .font(.title3.weight(.semibold))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                        ScoreDial(score: score, diameter: 190)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                if !score.contributions.isEmpty {
                    Section("The four signals") {
                        ForEach(score.contributions) { SignalRow(contribution: $0) }
                    }
                }
                Section {
                    Button("Done") {
                        model.dismissResult()
                        route = .chooser
                    }
                }
            } else {
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        if case .collecting(let left) = model.phase {
                            Text("Hold still.")
                                .font(.title2.weight(.semibold))
                            Text("\(left) second\(left == 1 ? "" : "s") left.")
                                .font(.body)
                                .monospacedDigit()
                                .foregroundStyle(.secondary)
                            ProgressView(value: Double(AppModel.readingSeconds - left),
                                         total: Double(AppModel.readingSeconds))
                        } else {
                            Text("Getting ready.").font(.title2.weight(.semibold))
                        }
                        if source == .patch {
                            Text(model.patch.status.sentence)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                            if let problem = model.patch.lastDecodeProblem {
                                Text(problem)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        } else {
                            Text("Simulated stream, generated on this phone.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 6)
                }

                Section("Coming in") {
                    if let latest = model.window.last {
                        ForEach(Signal.allCases) { signal in
                            HStack {
                                Image(systemName: signal.symbolName)
                                    .foregroundStyle(signal.color)
                                    .accessibilityHidden(true)
                                Text(signal.name)
                                Spacer(minLength: 8)
                                Text(reading(latest, signal))
                                    .monospacedDigit()
                                    .foregroundStyle(.secondary)
                            }
                            .accessibilityElement(children: .combine)
                        }
                        Text("\(model.window.count) sample\(model.window.count == 1 ? "" : "s") so far, one a second.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else {
                        Text("Nothing yet.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section {
                    Button("Stop") {
                        model.cancelReading()
                        route = .chooser
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private func reading(_ sample: PatchSample, _ signal: Signal) -> String {
        let value = sample.value(for: signal)
        switch signal {
        case .heart: return String(format: "%.0f %@", value, signal.unit)
        case .sweat: return String(format: "%.2f %@", value, signal.unit)
        case .temp:  return String(format: "%.1f %@", value, signal.unit)
        case .move:  return String(format: "%.2f %@", value, signal.unit)
        }
    }

    // MARK: The six questions

    private var questions: some View {
        List {
            if case .finished = model.phase, let score = model.today {
                Section {
                    VStack(spacing: 16) {
                        Text(score.sentence)
                            .font(.title3.weight(.semibold))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                        ScoreDial(score: score, diameter: 190)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                }
                Section {
                    Button("Done") {
                        model.dismissResult()
                        route = .chooser
                        answers = [:]
                    }
                }
            } else {
                ForEach(SelfReport.items) { item in
                    Section {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(item.question)
                                .font(.body.weight(.semibold))
                                .fixedSize(horizontal: false, vertical: true)
                            Picker(item.question, selection: binding(for: item)) {
                                ForEach(SelfReport.points, id: \.self) { point in
                                    Text("\(point)").tag(point)
                                }
                            }
                            .pickerStyle(.segmented)
                            .labelsHidden()
                            HStack {
                                Text(item.low)
                                Spacer(minLength: 8)
                                Text(item.high)
                            }
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }

                Section {
                    Button("See the score") {
                        model.recordSelfReport(answers: answers)
                    }
                    .disabled(!SelfReport.isComplete(answers))
                    Button("Back") {
                        route = .chooser
                        answers = [:]
                    }
                }

                Section {
                    NotAMedicalDevice()
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private func binding(for item: SelfReport.Item) -> Binding<Int> {
        Binding(get: { answers[item.id] ?? 2 },
                set: { answers[item.id] = $0 })
    }
}
#endif
