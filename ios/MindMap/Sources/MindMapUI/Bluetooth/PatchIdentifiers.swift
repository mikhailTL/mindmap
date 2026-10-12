import CoreBluetooth

/// Every identifier the app uses to find and read the patch, in one place.
///
/// PLACEHOLDERS. These are to be set when the firmware is final, and nothing
/// outside this file should name a UUID.
///
/// The service and characteristic UUIDs below are the Nordic UART Service, the
/// service the current firmware sketch advertises and the same one the web app
/// pairs against in `src/lib/engine.js`. They are a stand-in for a MindMap
/// service UUID that does not exist yet. When the firmware settles:
///
///   1. replace `service`, `streamCharacteristic` and `controlCharacteristic`
///      with the firmware's own UUIDs;
///   2. check `PatchFrame.byteCount` and the scale factors in `PatchFrame`
///      against the packed struct the firmware writes;
///   3. leave everything else alone, because nothing else reads a UUID.
public enum PatchIdentifiers {

    /// Advertised service. Scanning filters on this, which is what keeps the
    /// scan from waking every other peripheral in the room.
    public static let service = CBUUID(string: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E")

    /// Notifies once per second with one `PatchFrame`.
    public static let streamCharacteristic = CBUUID(string: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E")

    /// Written to by the phone. Not used yet; listed so the discovery call
    /// asks for it in the same round trip rather than a second one later.
    public static let controlCharacteristic = CBUUID(string: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E")

    /// The name the firmware advertises, used only to label a peripheral in the
    /// pairing list when it reports no name of its own.
    public static let fallbackPeripheralName = "MindMap patch"

    /// How often the patch sends a frame. The patch streams at 1 Hz.
    public static let sampleHertz: Double = 1
}
