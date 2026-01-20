"use client";

import { useEffect } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { cn } from "@/lib/utils";

export default function ScannerModal({
  open,
  onClose,
  onDetected
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}) {
  const { videoRef, canvasRef, isActive, error, start, stop } = useBarcodeScanner(onDetected);

  useEffect(() => {
    if (open) {
      start();
    } else {
      stop();
    }
  }, [open, start, stop]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-paper">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-fog">Scanner</p>
          <h2 className="font-display text-2xl">Align the barcode</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            stop();
            onClose();
          }}
          className="rounded-full border border-fog/40 px-4 py-2 text-sm"
        >
          Close
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className={cn(
            "h-full w-full object-cover",
            !isActive && "opacity-60"
          )}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="scan-grid h-64 w-80 rounded-2xl border-2 border-ember/80 shadow-glow-red" />
        </div>
        {error && (
          <div className="absolute bottom-6 left-6 rounded-xl bg-ember/90 px-4 py-2 text-sm text-white">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
