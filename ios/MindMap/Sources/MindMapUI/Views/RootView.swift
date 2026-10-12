#if os(iOS)
import SwiftUI
import MindMapKit

/// Four tabs, matching the web app: Today, Take a reading, Toolkit, Sharing.
///
/// No badge counts and no red dots. Nothing in this app is allowed to nag.
public struct RootView: View {

    @StateObject private var model: AppModel

    /// Main actor isolated, because `AppModel` is. Building the model here
    /// rather than in a default value expression is what keeps that isolation
    /// provable to the compiler.
    @MainActor
    public init() {
        _model = StateObject(wrappedValue: AppModel())
    }

    public var body: some View {
        TabView {
            TodayView(model: model)
                .tabItem { Label("Today", systemImage: "house.fill") }

            ReadingView(model: model)
                .tabItem { Label("Reading", systemImage: "waveform.path.ecg") }

            ToolkitView()
                .tabItem { Label("Toolkit", systemImage: "square.grid.2x2.fill") }

            SharingView(model: model)
                .tabItem { Label("Sharing", systemImage: "person.2.fill") }
        }
    }
}
#endif
