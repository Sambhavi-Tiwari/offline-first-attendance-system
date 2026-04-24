const CACHE_NAME = "attendance-v4";

const urlsToCache = [
  "/api/ui/",
  "/static/attendance/app.js",
  "/static/attendance/offline_db.js",
  "/static/attendance/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("/api/ui/");
        }
      });
    })
  );
});