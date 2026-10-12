import Foundation
import XCTest

/// Finds a fixture whichever way the resource ended up in the test bundle.
enum Fixture {
    static func url(_ name: String, extension ext: String = "json") throws -> URL {
        let bundle = Bundle.module
        let found = bundle.url(forResource: name, withExtension: ext)
            ?? bundle.url(forResource: name, withExtension: ext, subdirectory: "Fixtures")
        guard let found else {
            throw XCTSkip("The fixture \(name).\(ext) is not in the test bundle.")
        }
        return found
    }

    static func data(_ name: String, extension ext: String = "json") throws -> Data {
        try Data(contentsOf: try url(name, extension: ext))
    }
}
