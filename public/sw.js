/*
 * Jumanly service worker (partie 12, E11): offline reading of the profile and of lessons already
 * opened on this device, and an offline page for everything else.
 *
 * - Pages: network first. Profile and lesson pages that load are kept in a cache, and shown when
 *   there is no connection. Other pages are never stored.
 * - Built files (/_next/static, hashed names): cache first.
 * - Signing out empties the page cache (the next person on the device sees nothing).
 * - Nothing is ever sent from the cache when the network answers.
 */
const VERSION = "jm-v1";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/hors-ligne";
const MAX_PAGES = 40;

// Pages readable offline: the profile and the lessons (one entry per lesson opened).
const OFFLINE_READABLE = [/^\/app\/profil\/?$/, /^\/app\/learn\/[^/]+\/?$/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icon.svg"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function readableOffline(url) {
  return (
    url.origin === self.location.origin && OFFLINE_READABLE.some((re) => re.test(url.pathname))
  );
}

async function trimPages() {
  const cache = await caches.open(PAGES);
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((key) => cache.delete(key)),
  );
}

async function page(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (readableOffline(url)) {
      const cache = await caches.open(PAGES);
      // Signed out or session over: the page now redirects to sign-in, forget the stored copy.
      if (response.redirected || !response.ok) await cache.delete(request, { ignoreVary: true });
      else {
        await cache.put(request, response.clone());
        await trimPages();
      }
    }
    return response;
  } catch (error) {
    if (readableOffline(url)) {
      const stored = await caches.match(request, { cacheName: PAGES, ignoreVary: true });
      if (stored) return stored;
    }
    const offline = await caches.match(OFFLINE_URL, { cacheName: STATIC });
    if (offline) return offline;
    throw error;
  }
}

async function builtFile(request) {
  const stored = await caches.match(request, { cacheName: STATIC });
  if (stored) return stored;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Sign-out ends on /connexion?deconnecte=1, as a page or as an in-app navigation.
  if (url.searchParams.has("deconnecte")) event.waitUntil(caches.delete(PAGES));
  if (request.mode === "navigate") event.respondWith(page(request));
  else if (url.pathname.startsWith("/_next/static/")) event.respondWith(builtFile(request));
});
