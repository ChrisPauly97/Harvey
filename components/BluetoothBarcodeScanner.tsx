"use client";

import { useEffect, useRef, useState } from "react";

interface BluetoothBarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BluetoothBarcodeScanner({
  onScan,
}: BluetoothBarcodeScannerProps) {
  const [device, setDevice] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("disconnected");
  const characteristicRef = useRef<any>(null);
  const deviceNameRef = useRef<string>("");

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = () => {
    return (
      typeof window !== "undefined" &&
      (navigator as any).bluetooth !== undefined
    );
  };

  const pairDevice = async () => {
    if (!isBluetoothSupported()) {
      setError(
        "Web Bluetooth is not supported on this device. Try using Android Chrome or enable experimental features."
      );
      return;
    }

    setPairing(true);
    setError(null);

    try {
      // Request Bluetooth device with specific filters for common scanner services
      const bluetoothDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: "Netum" },
          { namePrefix: "C750" },
          { services: ["000018f0-0000-1000-8000-00805f9b34fb"] }, // Custom barcode service (common)
        ],
        optionalServices: [
          "device_information",
          "000018f0-0000-1000-8000-00805f9b34fb",
          "0000180a-0000-1000-8000-00805f9b34fb",
        ],
      });

      deviceNameRef.current = bluetoothDevice.name || "Unknown Scanner";
      setDevice(bluetoothDevice);

      // Connect to GATT server
      const server = await bluetoothDevice.gatt.connect();

      // Try to find a barcode characteristic
      // First, try the custom service for barcode data
      let characteristic: any = null;

      try {
        const service = await server.getPrimaryService(
          "000018f0-0000-1000-8000-00805f9b34fb"
        );
        characteristic = await service.getCharacteristic(
          "2a37" // Common barcode characteristic
        );
      } catch (e) {
        // If specific service fails, try to enumerate all services
        const services = await server.getPrimaryServices();

        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            // Look for characteristics that support notifications or reads
            if (
              char.properties.notify ||
              char.properties.read ||
              char.properties.indicate
            ) {
              characteristic = char;
              break;
            }
          }
          if (characteristic) break;
        }
      }

      if (!characteristic) {
        throw new Error(
          "Could not find barcode characteristic on device. Please check device compatibility."
        );
      }

      characteristicRef.current = characteristic;

      // Start listening for data
      if (characteristic.properties.notify) {
        await characteristic.startNotifications();
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleBarcodeData
        );
      } else if (characteristic.properties.read) {
        // Poll for data if notifications aren't supported
        startPolling(characteristic);
      }

      setConnected(true);
      setStatus("connected");
      setPairing(false);
    } catch (err: any) {
      console.error("Bluetooth pairing error:", err);
      setStatus("error");
      setPairing(false);

      if (err.name === "NotFoundError") {
        setError("No Bluetooth device found. Make sure your scanner is on.");
      } else if (err.name === "NotAllowedError") {
        setError("Bluetooth permission denied. Please try again.");
      } else {
        setError(
          err.message ||
            "Failed to pair with Bluetooth device. Check that your Netum C750 is in pairing mode."
        );
      }
    }
  };

  const handleBarcodeData = (event: Event) => {
    const characteristic = event.target as any;
    const value = characteristic.value;

    if (!value) return;

    // Convert the DataView to string
    // Most barcode scanners send ASCII-encoded barcode data
    let barcode = "";

    for (let i = 0; i < value.byteLength; i++) {
      const byte = value.getUint8(i);
      // Filter out non-printable characters and common delimiters (null, newline, etc)
      if (byte >= 32 && byte <= 126) {
        barcode += String.fromCharCode(byte);
      }
    }

    barcode = barcode.trim();

    if (barcode.length >= 3) {
      onScan(barcode);
    }
  };

  const startPolling = (characteristic: any) => {
    const pollInterval = setInterval(async () => {
      try {
        const value = await characteristic.readValue();
        const event = new Event("characteristicvaluechanged");
        Object.defineProperty(event, "target", {
          value: { value },
          enumerable: true,
        });
        handleBarcodeData(event);
      } catch (err) {
        clearInterval(pollInterval);
      }
    }, 1000);
  };

  const disconnect = async () => {
    try {
      if (characteristicRef.current?.properties.notify) {
        await characteristicRef.current.stopNotifications();
        characteristicRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleBarcodeData
        );
      }

      if (device?.gatt.connected) {
        await device.gatt.disconnect();
      }

      setConnected(false);
      setDevice(null);
      setStatus("disconnected");
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  if (!isBluetoothSupported()) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
        <p className="font-semibold mb-2">❌ Bluetooth Not Supported</p>
        <p className="text-xs">
          Web Bluetooth is only supported on Android Chrome and certain other
          browsers. Please use a compatible device or browser.
        </p>
      </div>
    );
  }

  if (connected && device) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl">
          <p className="font-semibold mb-1">✅ Connected</p>
          <p className="text-sm">Device: {deviceNameRef.current}</p>
          <p className="text-xs mt-1">🟢 Listening for barcodes...</p>
        </div>

        <button
          onClick={disconnect}
          className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 px-6 py-3 rounded-xl font-semibold transition-all"
        >
          🔌 Disconnect Scanner
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl text-sm">
        <p className="font-semibold mb-2">📡 Bluetooth Scanner Setup</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Turn on your Netum C750 scanner</li>
          <li>Put the scanner in Bluetooth pairing mode</li>
          <li>Click &quot;Pair Scanner&quot; below</li>
          <li>Select your scanner from the list</li>
          <li>Start scanning!</li>
        </ol>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          <p className="font-semibold mb-1">Error</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      <button
        onClick={pairDevice}
        disabled={pairing}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold shadow-md transition-all active:scale-95"
      >
        {pairing ? "Pairing..." : "📱 Pair Bluetooth Scanner"}
      </button>

      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 space-y-2">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          Troubleshooting:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Make sure Bluetooth is enabled on your phone</li>
          <li>Check that the scanner is in pairing mode</li>
          <li>
            If pairing fails, restart the scanner and try again
          </li>
          <li>This feature requires Android Chrome or compatible browser</li>
        </ul>
      </div>
    </div>
  );
}
