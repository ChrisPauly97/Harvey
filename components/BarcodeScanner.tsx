"use client";

import { BrowserMultiFormatReader, DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize the reader with hints for better detection
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      // Common retail barcodes
      1, // UPC_A
      2, // UPC_E
      3, // EAN_13
      4, // EAN_8
      5, // CODE_39
      6, // CODE_93
      7, // CODE_128
      8, // ITF
    ]);

    readerRef.current = new BrowserMultiFormatReader(hints);

    return () => {
      // Cleanup on unmount
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;

    try {
      setError(null);
      setIsScanning(true);
      setLastScan("");

      // Request camera with high resolution for better barcode detection
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Scan continuously
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !readerRef.current || !isScanning) return;

        try {
          const result = await readerRef.current.decodeFromVideoElement(
            videoRef.current
          );

          if (result) {
            const barcode = result.getText();

            // Prevent duplicate scans
            if (barcode !== lastScan) {
              setLastScan(barcode);

              // Stop scanning
              if (scanIntervalRef.current) {
                window.clearInterval(scanIntervalRef.current);
              }

              // Stop the video stream
              if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
                videoRef.current.srcObject = null;
              }

              setIsScanning(false);
              onScan(barcode);
            }
          }
        } catch (err) {
          // No barcode found in this frame - this is normal
        }
      }, 100); // Scan 10 times per second
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(
        "Failed to access camera. Please allow camera permissions in Safari settings."
      );
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    // Stop interval
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop the video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setLastScan("");
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
            <strong>iOS Tip:</strong> Go to Settings → Safari → Camera → Allow.
            Then refresh this page and try again.
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
          Hold steady and position barcode clearly in view
        </p>
      </div>
    </div>
  );
}
