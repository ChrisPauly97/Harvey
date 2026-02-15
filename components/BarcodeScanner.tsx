"use client";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {
            // Ignore errors on cleanup
          });
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode("qr-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      // iOS Safari-friendly configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // Enable all supported formats
        disableFlip: false,
      };

      // Try to get back camera for mobile devices
      try {
        const cameras = await Html5Qrcode.getCameras();
        let cameraId = { facingMode: "environment" };

        // On iOS, prefer the last camera (usually back camera)
        if (cameras && cameras.length > 0) {
          // Find back camera or use last camera
          const backCamera = cameras.find((camera) =>
            camera.label.toLowerCase().includes("back")
          );
          if (backCamera) {
            cameraId = backCamera.id as any;
          } else {
            cameraId = cameras[cameras.length - 1].id as any;
          }
        }

        await scanner.start(
          cameraId,
          config,
          (decodedText) => {
            // Successfully scanned
            isScanningRef.current = false;
            scanner
              .stop()
              .then(() => {
                setIsScanning(false);
                onScan(decodedText);
              })
              .catch(() => {
                setIsScanning(false);
                onScan(decodedText);
              });
          },
          (errorMessage) => {
            // Scanning errors (most are just "no barcode found" which is normal)
          }
        );

        setIsScanning(true);
        isScanningRef.current = true;
      } catch (err) {
        // Fallback to simple facingMode if camera enumeration fails
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            isScanningRef.current = false;
            scanner
              .stop()
              .then(() => {
                setIsScanning(false);
                onScan(decodedText);
              })
              .catch(() => {
                setIsScanning(false);
                onScan(decodedText);
              });
          },
          (errorMessage) => {
            // Ignore
          }
        );

        setIsScanning(true);
        isScanningRef.current = true;
      }
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(
        "Failed to access camera. Please ensure camera permissions are enabled in your browser settings."
      );
      setIsScanning(false);
      isScanningRef.current = false;
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        isScanningRef.current = false;
      } catch (err) {
        // Scanner already stopped
        setIsScanning(false);
        isScanningRef.current = false;
      }
    }
  };

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        className="w-full rounded-xl overflow-hidden bg-black"
        style={{ minHeight: isScanning ? "300px" : "0px" }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
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
        <p className="text-xs text-gray-500 text-center">
          Position the barcode within the square to scan
        </p>
      </div>
    </div>
  );
}
