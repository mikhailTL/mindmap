import SwiftUI
import MindMapUI

/// The app target is this file and nothing else.
///
/// Everything else lives in the two package modules, which is what keeps the
/// scorer and the consent types testable without a simulator. If this file
/// will not build, the local package is almost certainly not added to the
/// target yet: see step 4 in `ios/README.md`.
@main
struct MindMapApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}
