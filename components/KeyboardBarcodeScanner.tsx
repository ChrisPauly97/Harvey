"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface KeyboardBarcodeScannerProps {
  onScan: (barcode: string) => void;
  isActive?: boolean;  // NEW: Allow parent to control scanning state
}

export default function KeyboardBarcodeScanner({
  onScan,
  isActive = true,  // Accept isActive as a prop (default: true)
}: KeyboardBarcodeScannerProps) {
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount/when activated for immediate scanning
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

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

      // Don't capture input if user is typing in another input/textarea
      // (but allow input from our own hidden scanner input)
      const target = event.target as HTMLElement;
      if ((target.tagName === "INPUT" || target.tagName === "TEXTAREA") && target !== inputRef.current) {
        return;
      }

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

  return (
    <>
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
    </>
  );
}
