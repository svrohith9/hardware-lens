"use client";

import { useEffect, useState } from "react";
import type { EnrichResponse } from "@/lib/schemas";

export function useLastScans() {
  const [scans, setScans] = useState<EnrichResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/enrich?last=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as EnrichResponse[];
        if (active) {
          setScans(data);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = window.setInterval(load, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { scans, loading };
}
