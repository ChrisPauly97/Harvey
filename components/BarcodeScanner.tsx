"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          scanner
            .stop()
            .then(() => {
              setIsScanning(false);
              onScan(decodedText);
            })
            .catch((err) => console.error("Error stopping scanner:", err));
        },
        (errorMessage) => {
          // Scanning errors (most are just "no barcode found" which is normal)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(
        "Failed to access camera. Please ensure camera permissions are enabled."
      );
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        className="w-full rounded-lg overflow-hidden bg-black"
        style={{ minHeight: isScanning ? "400px" : "0px" }}
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-semibold text-lg shadow-lg transition-colors"
          >
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-lg font-semibold text-lg shadow-lg transition-colors"
          >
            Stop Camera
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 text-center">
        Position the barcode within the square to scan
      </p>
    </div>
  );
}
