import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EnrichResponse } from "@/lib/schemas";

export default function LastScansCarousel({
  scans,
  className
}: {
  scans: EnrichResponse[];
  className?: string;
}) {
  if (!scans.length) {
    return (
      <div className={cn("rounded-2xl border border-fog/40 bg-white/60 p-6 text-sm", className)}>
        No scans yet. Be the first.
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">Last 10 scans</h3>
        <span className="text-xs uppercase tracking-[0.2em] text-fog">Live</span>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {scans.map((scan) => (
          <article
            key={`${scan.Timestamp}-${scan.Barcode}`}
            className="min-w-[240px] snap-center rounded-2xl border border-fog/40 bg-white/70 p-4 shadow-soft backdrop-blur dark:bg-ink/70"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-fog/30">
                {scan.ImageURL ? (
                  <Image
                    src={scan.ImageURL}
                    alt={scan.Model ?? scan.Brand ?? "Scanned item"}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="text-xs text-fog">{new Date(scan.Timestamp).toLocaleString()}</p>
                <p className="font-semibold">{scan.Brand ?? "Unknown"}</p>
                <p className="text-sm text-fog">{scan.Model ?? scan.Barcode}</p>
              </div>
            </div>
            <div className="grid gap-1 text-xs text-fog">
              <span>CPU: {scan.CPU ?? "-"}</span>
              <span>RAM: {scan.RAM ?? "-"}</span>
              <span>SSD: {scan.SSD ?? "-"}</span>
              <span>Resale: {scan.ResaleUSD ?? "-"}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
