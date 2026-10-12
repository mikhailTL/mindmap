#if os(iOS)
import SwiftUI
import MindMapKit

/// One score, one sentence, the four signals. In that order, every time.
///
/// The sentence comes before the number on purpose: a number on its own is
/// something a fifteen year old can read as a verdict, and the sentence is what
/// makes it a description.
struct TodayView: View {

    @ObservedObject var model: AppModel

    var body: some View {
        NavigationStack {
            List {
                if let problem = model.scorerProblem {
                    Section {
                        Text("The scorer could not start.")
                            .font(.body.weight(.semibold))
                        Text(problem)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                } else if let score = model.today {
                    scoreSection(score)
                    signalsSection(score)
                    weekSection()
                } else {
                    emptySection()
                }

                Section {
                    NotAMedicalDevice()
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Today")
        }
    }

    @ViewBuilder
    private func scoreSection(_ score: MindScore) -> some View {
        Section {
            VStack(spacing: 18) {
                Text(score.sentence)
                    .font(.title3.weight(.semibold))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                ScoreDial(score: score)

                Text("\(score.source.label). \(Vocabulary.scoreDefinition)")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)

                if score.baselineDays < 7 {
                    Text("Your own normal is still being worked out: \(score.baselineDays) day\(score.baselineDays == 1 ? "" : "s") so far. Until there is about a fortnight, the number is read against borrowed figures rather than yours.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let held = score.heldBackReason {
                    Text(held)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    @ViewBuilder
    private func signalsSection(_ score: MindScore) -> some View {
        if !score.contributions.isEmpty {
            Section("The four signals") {
                ForEach(score.contributions) { contribution in
                    SignalRow(contribution: contribution)
                }
                Explainer("These do not add up to the number above",
                          "Each row is that signal's own distance from your fourteen-day baseline. The number in the middle is four of those distances through one small model at once, so it is a blend and not an average.")
            }
        }
    }

    @ViewBuilder
    private func weekSection() -> some View {
        if model.history.count > 1 {
            Section("Recent readings") {
                ForEach(model.history.prefix(14)) { score in
                    HStack {
                        Text(score.takenAt, style: .date)
                            .font(.callout)
                        Spacer(minLength: 8)
                        Text(score.band.word)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                        Text("\(score.value)")
                            .font(.callout.weight(.semibold))
                            .monospacedDigit()
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }

    @ViewBuilder
    private func emptySection() -> some View {
        Section {
            VStack(alignment: .leading, spacing: 10) {
                Text("No reading yet today.")
                    .font(.title3.weight(.semibold))
                Text("A reading takes thirty seconds. The patch, or six questions if you have not got it with you.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.vertical, 6)
        }
    }
}
#endif
