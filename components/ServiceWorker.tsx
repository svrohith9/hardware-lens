"use client";

import { useEffect } from "react";
import { Workbox } from "workbox-window";

export default function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const wb = new Workbox("/sw.js");
    wb.register();
  }, []);

  return null;
}
