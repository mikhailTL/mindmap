// swift-tools-version:5.9
import PackageDescription

/// The MindMap iOS sources as a local Swift package.
///
/// There is no checked-in Xcode project: see `ios/README.md` for why, and for
/// the numbered steps that turn this package into a running app. The package
/// is not a workaround, it is how the app target gets these modules, and it is
/// also what lets `swift test` run the scorer parity tests on a Mac without
/// opening Xcode or booting a simulator.
///
/// macOS is listed as a platform for that reason only. Every file that needs
/// UIKit or an iOS-only SwiftUI modifier is behind `#if os(iOS)`, so a host
/// build compiles the parts the tests exercise and skips the screens.
let package = Package(
    name: "MindMap",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "MindMapKit", targets: ["MindMapKit"]),
        .library(name: "MindMapUI", targets: ["MindMapUI"]),
    ],
    targets: [
        /// Models, the scorer and the consent types. Foundation only: no
        /// SwiftUI, no CoreBluetooth, nothing that needs a device.
        .target(
            name: "MindMapKit",
            path: "MindMap/Sources/MindMapKit",
            resources: [.process("Resources")]
        ),
        /// The screens, the CoreBluetooth manager and the app state.
        .target(
            name: "MindMapUI",
            dependencies: ["MindMapKit"],
            path: "MindMap/Sources/MindMapUI"
        ),
        .testTarget(
            name: "MindMapTests",
            dependencies: ["MindMapKit", "MindMapUI"],
            path: "MindMap/Tests/MindMapTests",
            resources: [.process("Fixtures")]
        ),
    ]
)
