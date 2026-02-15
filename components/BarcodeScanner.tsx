"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    // Initialize reader with better detection hints
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);

    readerRef.current = new BrowserMultiFormatReader(hints);

    return () => {
      // Cleanup
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setError(null);
      setIsScanning(true);

      // Use the built-in continuous decode from video device
      controlsRef.current = await readerRef.current.decodeFromConstraints(
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result, error) => {
          if (result) {
            // Successfully scanned!
            const barcode = result.getText();

            // Stop scanning
            if (controlsRef.current) {
              controlsRef.current.stop();
              controlsRef.current = null;
            }

            setIsScanning(false);
            onScan(barcode);
          }
          // Errors are normal (no barcode found yet)
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(
        "Failed to access camera. Please allow camera permissions and try again."
      );
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full rounded-xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{
            display: isScanning ? "block" : "none",
            maxHeight: "400px",
            objectFit: "cover",
          }}
        />
        {!isScanning && (
          <div className="w-full h-48 flex items-center justify-center bg-gray-900">
            <span className="text-gray-500 text-sm">Camera preview</span>
          </div>
        )}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-40 border-4 border-emerald-500 rounded-lg shadow-lg animate-pulse"></div>
              <p className="text-white text-sm font-semibold mt-2 text-center bg-black/50 px-3 py-1 rounded">
                Scanning...
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          <p className="font-semibold mb-2">{error}</p>
          <p className="text-xs opacity-90">
            <strong>Tip:</strong> Make sure to allow camera access in your browser settings.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-4 rounded-xl font-semibold shadow-md transition-all active:scale-95"
          >
            📸 Start Camera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-6 py-4 rounded-xl font-semibold shadow-md transition-all active:scale-95"
          >
            ⏹️ Stop Camera
          </button>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Hold steady and position barcode in the green box
        </p>
      </div>
    </div>
  );
}
