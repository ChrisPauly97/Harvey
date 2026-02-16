"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface KeyboardBarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function KeyboardBarcodeScanner({
  onScan,
}: KeyboardBarcodeScannerProps) {
  const [isActive, setIsActive] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Barcode scanning typically completes within 50-100ms
  // If no input for 100ms, consider the barcode complete
  const BARCODE_TIMEOUT = 100;
  // Minimum barcode length to consider valid
  const MIN_BARCODE_LENGTH = 3;

  const completeBarcode = useCallback(() => {
    const barcode = barcodeBufferRef.current.trim();

    // Clear the buffer and input
    barcodeBufferRef.current = "";
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only process if barcode is long enough
    if (barcode.length >= MIN_BARCODE_LENGTH) {
      onScan(barcode);
    }

    // Keep focus on input for continuous scanning
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [onScan]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process if we're active
      if (!isActive || !inputRef.current) return;

      const key = event.key;

      // Handle Enter key - complete the barcode
      if (key === "Enter") {
        event.preventDefault();
        completeBarcode();
        return;
      }

      // Handle Escape to clear
      if (key === "Escape") {
        event.preventDefault();
        barcodeBufferRef.current = "";
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        return;
      }

      // Ignore non-printable keys
      if (key.length !== 1) return;

      // Add character to buffer
      barcodeBufferRef.current += key;
      if (inputRef.current) {
        inputRef.current.value = barcodeBufferRef.current;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to complete barcode if no more input
      timeoutRef.current = setTimeout(() => {
        completeBarcode();
      }, BARCODE_TIMEOUT);

      // Record scan time for visual feedback
      setLastScanTime(Date.now());
    };

    if (isActive) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isActive, completeBarcode]);

  const toggleScanning = () => {
    setIsActive(!isActive);
    if (!isActive) {
      // Focus input when starting
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl text-sm">
        <p className="font-semibold mb-2">📡 Keyboard Scanner Setup</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Configure your Netum C750 to Keyboard Emulation mode</li>
          <li>Click &quot;Start Scanning&quot; below to activate listener</li>
          <li>Scanner will send barcodes as keyboard input</li>
          <li>Barcode automatically detected and processed</li>
        </ol>
      </div>

      {/* Hidden input that captures keyboard input */}
      <input
        ref={inputRef}
        type="text"
        style={{ position: "absolute", left: "-9999px" }}
        readOnly
        aria-hidden="true"
        onBlur={() => {
          // Refocus if user accidentally clicks away
          if (isActive) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      />

      {/* Status and control */}
      <div
        className={`rounded-xl border-2 p-4 transition-all ${
          isActive
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold ${isActive ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-400"}`}>
              {isActive ? "🟢 Listening for barcodes" : "⚪ Scanner ready"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {isActive
                ? "Point scanner at barcode to scan"
                : "Click button below to start scanning"}
            </p>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <button
        onClick={toggleScanning}
        className={`w-full px-6 py-4 rounded-xl font-semibold shadow-md transition-all active:scale-95 text-white ${
          isActive
            ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
            : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        }`}
      >
        {isActive ? "⏹️ Stop Scanning" : "▶️ Start Scanning"}
      </button>

      {/* Scanner configuration instructions */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2">
        <p className="font-semibold">⚙️ Scanner Configuration</p>
        <p>To set up your Netum C750 for keyboard emulation:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Open the Netum Scanner app on your phone</li>
          <li>Go to Settings → Communication Mode</li>
          <li>Select &quot;Keyboard Emulation&quot; or &quot;HID Mode&quot;</li>
          <li>Pair the scanner via Bluetooth normally</li>
          <li>Once paired, scanned data will appear as keyboard input</li>
        </ol>
      </div>

      {/* Keyboard shortcuts */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 space-y-2">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</p>
        <ul className="space-y-1">
          <li>
            <kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-700">
              Enter
            </kbd>{" "}
            - Complete barcode (manual)
          </li>
          <li>
            <kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-700">
              Esc
            </kbd>{" "}
            - Clear input
          </li>
        </ul>
      </div>
    </div>
  );
}
