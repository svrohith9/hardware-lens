/* eslint-disable no-undef */
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js");

if (workbox) {
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages",
      networkTimeoutSeconds: 3
    })
  );

  workbox.routing.registerRoute(
    ({ url, request }) => url.pathname === "/api/enrich" && request.method === "POST",
    new workbox.strategies.NetworkOnly({
      plugins: [
        new workbox.backgroundSync.BackgroundSyncPlugin("enrichQueue", {
          maxRetentionTime: 24 * 60
        })
      ]
    }),
    "POST"
  );

  workbox.routing.registerRoute(
    ({ url }) => url.pathname === "/api/enrich" && url.searchParams.has("last"),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "last-scans",
      plugins: [new workbox.expiration.ExpirationPlugin({ maxAgeSeconds: 60 })]
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images",
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 50 })]
    })
  );
}
