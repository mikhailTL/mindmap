#if os(iOS)
import SwiftUI
import MindMapKit

/// Who sees what, and the switches that decide it.
///
/// Nothing is shared by default: a new install has an empty ledger, which is a
/// device that shares nothing. Every row here is a consent change, not a
/// setting, and the student makes all of them.
///
/// Two rules are in the types rather than on this screen, which is why they
/// cannot be undone by editing a view:
///
///   * a parent may be shown nothing finer-grained than a day, because
///     `Audience.parent.ceiling` is `.day` and the grant initialiser floors
///     every grant by it;
///   * notes, location and anything said into the microphone have no
///     `Shareable` conformance anywhere, so they cannot be put in a payload at
///     all.
struct SharingView: View {

    @ObservedObject var model: AppModel
    @State private var audience: Audience = .parent

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Who", selection: $audience) {
                        Text("Parent").tag(Audience.parent)
                        Text(Vocabulary.pro).tag(Audience.medicalProfessional)
                    }
                    .pickerStyle(.segmented)
                    Text(Vocabulary.consentShort + " " + Vocabulary.consentOff)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }

                grantSection

                neverSection

                if let preview = model.preview(for: audience) {
                    Section("What would be sent") {
                        if preview.payload.isEmpty {
                            Text("Nothing. No category is switched on.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        } else {
                            ForEach(Array(preview.payload.categories).sorted(by: { $0.rawValue < $1.rawValue }), id: \.rawValue) { category in
                                Text(category.label)
                                    .font(.callout)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            Text("\(preview.payload.items.count) item\(preview.payload.items.count == 1 ? "" : "s"), built against the grant made on this device.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        ForEach(preview.refused.indices, id: \.self) { index in
                            Text(preview.refused[index].description)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }

                Section {
                    Button("Turn off everything for \(audience.label)", role: .destructive) {
                        model.consent.revoke(audience)
                    }
                }

                Section {
                    Text("MindMap makes no network requests. Nothing leaves this phone unless you share it yourself, and a share is built from the switches above and checked against them one item at a time.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                    NotAMedicalDevice()
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Sharing")
        }
    }

    // MARK: Sections

    private var grantSection: some View {
        Section("Shared with \(audience.label)") {
            ForEach(ShareCatalog.offerable(to: audience)) { row in
                Toggle(isOn: binding(for: row.category)) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.category.label)
                            .fixedSize(horizontal: false, vertical: true)
                        if let granularity = row.granularity {
                            Text(granularity.label)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            if audience == .parent {
                Text("A parent sees a day at a time and never finer. That is not a setting on this screen.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var neverSection: some View {
        Section("Never shared, with anybody") {
            ForEach(ShareCatalog.rows.filter { !$0.shareable }) { row in
                Text(row.category.label)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: Grant editing

    private func binding(for category: DataCategory) -> Binding<Bool> {
        Binding(
            get: {
                model.consent.grant(for: audience)?.categories.contains(category) ?? false
            },
            set: { isOn in
                var categories = model.consent.grant(for: audience)?.categories ?? []
                if isOn {
                    categories.insert(category)
                } else {
                    categories.remove(category)
                }
                if categories.isEmpty {
                    model.consent.revoke(audience)
                } else {
                    /// Asked at the finest the chosen categories need. The
                    /// grant initialiser floors it by the audience ceiling, so
                    /// asking for more than a parent may see simply gives a
                    /// parent a day.
                    let finest = categories
                        .compactMap { category in
                            ShareCatalog.rows.first { $0.category == category }?.granularity
                        }
                        .max() ?? .day
                    model.consent.record(ConsentGrant(audience: audience,
                                                      categories: categories,
                                                      finestGranularity: finest))
                }
            })
    }
}
#endif
