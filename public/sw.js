/*
 * Shikkha Chat — service worker.
 *
 * Conservative, framework-agnostic caching so the app is installable and keeps
 * working offline without ever serving stale *authenticated* HTML for the wrong
 * user. Strategy:
 *   - Navigations  -> network-first; when offline, show the static offline page.
 *     (We deliberately do NOT cache dashboard HTML: it is per-user and dynamic.)
 *   - Static build assets, icons, images, fonts -> cache-first (safe, hashed).
 *   - /api/* and Next data -> network-only (never cached).
 *   - Cross-origin images (ERP files) -> cache-first, opaque-safe.
 * Bump VERSION to ship a new cache; old caches are purged on activate.
 */
const VERSION = "v1";
const STATIC_CACHE = "shikkha-static-" + VERSION;
const RUNTIME_CACHE = "shikkha-runtime-" + VERSION;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isStaticAsset = (pathname) =>
  pathname.startsWith("/_next/static/") ||
  pathname.startsWith("/icons/") ||
  pathname.startsWith("/images/") ||
  pathname.startsWith("/Banner-imaes/") ||
  /\.(?:css|js|mjs|png|jpe?g|svg|webp|gif|ico|woff2?|ttf|otf)$/i.test(pathname);

const isImage = (pathname) =>
  /\.(?:png|jpe?g|svg|webp|gif|avif)$/i.test(pathname) ||
  pathname.startsWith("/_next/image");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Cross-origin: only handle images cache-first (opaque responses are cacheable).
  if (url.origin !== self.location.origin) {
    if (req.destination === "image" || isImage(url.pathname)) {
      event.respondWith(
        caches.match(req).then(
          (hit) =>
            hit ||
            fetch(req)
              .then((res) => {
                try {
                  const copy = res.clone();
                  caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
                } catch {}
                return res;
              })
              .catch(() => hit)
        )
      );
    }
    return;
  }

  // Never touch API, auth or Next data requests.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/login")
  ) {
    return;
  }

  // Navigations: network-first, offline fallback page.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || Response.error())
      )
    );
    return;
  }

  // Static assets: cache-first.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req)
            .then((res) => {
              if (res && res.ok) {
                const copy = res.clone();
                caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
              }
              return res;
            })
            .catch(() => hit)
      )
    );
    return;
  }

  // Everything else: network-first, fall back to any cached copy.
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
