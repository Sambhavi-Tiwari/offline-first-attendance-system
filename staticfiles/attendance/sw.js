const CACHE_NAME = "attendance-cache-v1";

const urlsToCache = [
  "/api/ui/",
  "/static/attendance/attendance.js",
  "/static/attendance/offline_db.js",
  "/static/attendance/attendance.css"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
