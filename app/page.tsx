"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import LastScansCarousel from "@/components/LastScansCarousel";
import ModeToggle from "@/components/ModeToggle";
import ScannerModal from "@/components/ScannerModal";
import { barcodeSchema, enrichResponseSchema } from "@/lib/schemas";
import { useLastScans } from "@/hooks/useLastScans";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, string | null> | null>(null);
  const { scans, loading } = useLastScans();
  const [online, setOnline] = useState(true);

  const headline = useMemo(() => {
    return process.env.NEXT_PUBLIC_APP_NAME ?? "HardwareLens";
  }, []);

  const onDetected = async (barcode: string) => {
    setScannerOpen(false);
    const parsed = barcodeSchema.safeParse(barcode);
    if (!parsed.success) {
      toast.error("Invalid barcode");
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ barcode })
      });

      if (!response.ok) {
        throw new Error("Enrichment failed");
      }

      const payload = await response.json();
      const result = enrichResponseSchema.parse(payload);
      setLastResult(result);
      toast.success("Row added");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      if (!online) {
        toast.message("Offline: queued for sync");
      } else {
        toast.error(error instanceof Error ? error.message : "Scan failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-fog">Hardware Intelligence</p>
          <h1 className="font-display text-3xl md:text-4xl">{headline}</h1>
        </div>
        <ModeToggle />
      </header>

      <section className="flex flex-1 flex-col gap-10 px-6 pb-12 md:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-fog/40 bg-white/70 p-8 shadow-soft backdrop-blur dark:bg-ink/60">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl">Scan and enrich in seconds</h2>
                <p className="mt-2 text-sm text-fog">
                  Point your camera at a barcode to capture brand, specs, warranty, resale, and sustainability data.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex items-center justify-center gap-3 rounded-full bg-ember px-8 py-4 text-lg font-semibold text-white shadow-glow-red transition hover:-translate-y-1"
              >
                <span className="text-xl">●</span>
                Scan
              </button>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-fog/40 bg-white/70 p-4 text-sm dark:bg-ink/70">
                  <p className="text-fog">GS1 Verified</p>
                  <a
                    href={
                      process.env.NEXT_PUBLIC_GS1_LOOKUP_URL ??
                      "https://www.gs1.org/services/verified-by-gs1"
                    }
                    className="font-semibold underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Verify listings
                  </a>
                </div>
                <div className="rounded-2xl border border-fog/40 bg-white/70 p-4 text-sm dark:bg-ink/70">
                  <p className="text-fog">Offline queue</p>
                  <p className="font-semibold">Background sync ready</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-fog/40 bg-white/70 p-6 shadow-soft backdrop-blur dark:bg-ink/60">
              <h3 className="font-display text-xl">Latest enrichment</h3>
              {isLoading ? (
                <div className="mt-4 space-y-3">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-fog/40" />
                  <div className="h-4 w-full animate-pulse rounded bg-fog/30" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-fog/30" />
                </div>
              ) : lastResult ? (
                <div className="mt-4 grid gap-2 text-sm text-fog">
                  {Object.entries(lastResult).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="uppercase tracking-[0.2em] text-[10px] text-fog">{key}</span>
                      <span className="text-ink dark:text-paper">{value ?? "-"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-fog">No scans yet.</p>
              )}
            </div>

            <div className="rounded-3xl border border-fog/40 bg-white/70 p-6 shadow-soft backdrop-blur dark:bg-ink/60">
              <p className="text-xs uppercase tracking-[0.3em] text-fog">Status</p>
              <p className="mt-2 text-lg font-semibold">
                {online ? "Ready to scan" : "Offline mode"}
              </p>
              <p className="text-sm text-fog">
                {online
                  ? "Scans sync instantly to your sheet."
                  : "Scans queue and sync when you are back online."}
              </p>
            </div>
          </div>
        </div>

        <div className={cn("animate-rise-in", loading && "opacity-60")}> 
          <LastScansCarousel scans={scans} />
        </div>
      </section>

      <ScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={onDetected} />
    </main>
  );
}
