import Foundation
import Combine
import CoreBluetooth
import MindMapKit

/// Finds the patch, subscribes to its stream, and turns frames into samples.
///
/// Scope on purpose: this scans, connects, subscribes and decodes. It does not
/// score, it does not store, and it never sends anything anywhere. The score
/// comes from `ScoreEngine` and the window it is handed comes from `recent`.
///
/// Callbacks all arrive on the main queue, because the manager is created with
/// `queue: .main`. That is what makes it safe for the published properties
/// below to drive SwiftUI directly.
public final class PatchManager: NSObject, ObservableObject {

    public enum Status: Equatable {
        /// Before the first state callback. Creating a `CBCentralManager` is
        /// what triggers the system permission prompt, so nothing is created
        /// until the student taps to pair.
        case idle
        case unsupported
        case unauthorized
        case poweredOff
        case scanning
        case connecting(String)
        case streaming(String)
        case disconnected(String?)
        case failed(String)

        public var isStreaming: Bool {
            if case .streaming = self { return true }
            return false
        }

        /// One plain sentence, for the pairing screen. No jargon, no codes.
        public var sentence: String {
            switch self {
            case .idle:
                return "Not connected."
            case .unsupported:
                return "This device cannot connect to the patch."
            case .unauthorized:
                return "MindMap does not have permission to use Bluetooth. You can turn it on in Settings."
            case .poweredOff:
                return "Bluetooth is off. Turn it on to connect the patch."
            case .scanning:
                return "Looking for your patch."
            case .connecting(let name):
                return "Connecting to \(name)."
            case .streaming(let name):
                return "Connected to \(name). Reading once a second."
            case .disconnected(let name):
                if let name { return "\(name) disconnected." }
                return "The patch disconnected."
            case .failed(let why):
                return why
            }
        }
    }

    /// How many samples to keep. Ten minutes at 1 Hz, which is more than any
    /// one reading needs and still a small array.
    public static let windowCapacity = 600

    @Published public private(set) var status: Status = .idle
    @Published public private(set) var latest: PatchSample?
    /// Oldest first.
    @Published public private(set) var recent: [PatchSample] = []
    /// Set when a frame arrived that this build could not read, so the pairing
    /// screen can say the firmware and the app disagree rather than failing
    /// silently.
    @Published public private(set) var lastDecodeProblem: String?

    private var central: CBCentralManager?
    private var patch: CBPeripheral?
    private var stream: CBCharacteristic?
    /// Set when the student asks to connect before Bluetooth is ready, so the
    /// scan starts by itself once it is.
    private var wantsToScan = false

    public override init() {
        super.init()
    }

    // MARK: Student-driven actions

    /// Starts looking for the patch. The first call is also what asks the
    /// system for Bluetooth permission, which is why it is only ever called
    /// from a tap.
    public func startScanning() {
        wantsToScan = true
        lastDecodeProblem = nil
        if central == nil {
            central = CBCentralManager(delegate: self, queue: .main)
            return
        }
        beginScanIfReady()
    }

    public func stop() {
        wantsToScan = false
        central?.stopScan()
        if let patch {
            central?.cancelPeripheralConnection(patch)
        }
        patch = nil
        stream = nil
        if case .failed = status { return }
        status = .idle
    }

    /// Clears the window. A reading that is finished should not bleed into the
    /// next one.
    public func clearWindow() {
        recent = []
        latest = nil
    }

    // MARK: Internals

    private func beginScanIfReady() {
        guard let central, wantsToScan else { return }
        guard central.state == .poweredOn else {
            status = Self.status(for: central.state)
            return
        }
        status = .scanning
        central.scanForPeripherals(withServices: [PatchIdentifiers.service],
                                   options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
    }

    private static func status(for state: CBManagerState) -> Status {
        switch state {
        case .poweredOn:   return .scanning
        case .poweredOff:  return .poweredOff
        case .unauthorized: return .unauthorized
        case .unsupported: return .unsupported
        case .resetting:   return .idle
        case .unknown:     return .idle
        @unknown default:  return .idle
        }
    }

    private func name(of peripheral: CBPeripheral) -> String {
        peripheral.name ?? PatchIdentifiers.fallbackPeripheralName
    }

    private func append(_ sample: PatchSample) {
        latest = sample
        recent.append(sample)
        if recent.count > Self.windowCapacity {
            recent.removeFirst(recent.count - Self.windowCapacity)
        }
    }
}

// MARK: - CBCentralManagerDelegate

extension PatchManager: CBCentralManagerDelegate {

    public func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            beginScanIfReady()
        } else {
            status = Self.status(for: central.state)
        }
    }

    public func centralManager(_ central: CBCentralManager,
                               didDiscover peripheral: CBPeripheral,
                               advertisementData: [String: Any],
                               rssi RSSI: NSNumber) {
        central.stopScan()
        patch = peripheral
        peripheral.delegate = self
        status = .connecting(name(of: peripheral))
        central.connect(peripheral, options: nil)
    }

    public func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        peripheral.discoverServices([PatchIdentifiers.service])
    }

    public func centralManager(_ central: CBCentralManager,
                               didFailToConnect peripheral: CBPeripheral,
                               error: Error?) {
        status = .failed("Could not connect to \(name(of: peripheral)). Try again, or take a reading without the patch.")
        patch = nil
        stream = nil
    }

    public func centralManager(_ central: CBCentralManager,
                               didDisconnectPeripheral peripheral: CBPeripheral,
                               error: Error?) {
        stream = nil
        patch = nil
        status = .disconnected(peripheral.name)
        if wantsToScan {
            beginScanIfReady()
        }
    }
}

// MARK: - CBPeripheralDelegate

extension PatchManager: CBPeripheralDelegate {

    public func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil else {
            status = .failed("The patch connected but did not answer. Try again.")
            return
        }
        guard let service = peripheral.services?.first(where: { $0.uuid == PatchIdentifiers.service }) else {
            status = .failed("That device is not a MindMap patch.")
            return
        }
        peripheral.discoverCharacteristics(
            [PatchIdentifiers.streamCharacteristic, PatchIdentifiers.controlCharacteristic],
            for: service)
    }

    public func peripheral(_ peripheral: CBPeripheral,
                           didDiscoverCharacteristicsFor service: CBService,
                           error: Error?) {
        guard error == nil else {
            status = .failed("The patch connected but did not answer. Try again.")
            return
        }
        guard let characteristic = service.characteristics?
            .first(where: { $0.uuid == PatchIdentifiers.streamCharacteristic }) else {
            status = .failed("This patch does not offer the reading it is meant to. Its firmware may be older than the app.")
            return
        }
        stream = characteristic
        guard characteristic.properties.contains(.notify) else {
            status = .failed("This patch cannot stream readings to the app. Its firmware may be older than the app.")
            return
        }
        peripheral.setNotifyValue(true, for: characteristic)
        status = .streaming(name(of: peripheral))
    }

    public func peripheral(_ peripheral: CBPeripheral,
                           didUpdateValueFor characteristic: CBCharacteristic,
                           error: Error?) {
        guard characteristic.uuid == PatchIdentifiers.streamCharacteristic else { return }
        guard error == nil, let data = characteristic.value else { return }
        do {
            let frame = try PatchFrame(data: data)
            lastDecodeProblem = nil
            append(frame.sample())
        } catch let problem as PatchFrame.DecodeError {
            lastDecodeProblem = problem.description
        } catch {
            lastDecodeProblem = "A reading from the patch could not be read."
        }
    }

    public func peripheral(_ peripheral: CBPeripheral,
                           didUpdateNotificationStateFor characteristic: CBCharacteristic,
                           error: Error?) {
        if let error {
            status = .failed("The patch stopped sending readings. \(error.localizedDescription)")
        }
    }
}
