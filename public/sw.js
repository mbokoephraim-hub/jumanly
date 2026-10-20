/*
 * Jumanly service worker (partie 12, E11 ; hors connexion élargi le 20/10, demande d'Ephraïm :
 * « comme WhatsApp, l'appli doit servir même déconnecté »).
 *
 * - Opening page (/demarrage, start of the installed app): kept, shown at once (even offline) and
 *   refreshed in the background, so the animated logo is there the instant the app opens.
 * - Pages of the signed-in space (/app/…): network first. Every page that loads is kept on this
 *   device, and shown when there is no connection. The talent space also asks for its main pages
 *   once per session (message « warm »), so they open offline even if not visited yet.
 *   Payment and tester pages are never kept.
 * - Built files (/_next/static, hashed names): cache first.
 * - Signing out empties the kept pages (the next person on the device sees nothing).
 * - Nothing is ever sent from the cache when the network answers (opening page aside).
 */
const VERSION = "jm-v2";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/hors-ligne";
const LAUNCH_URL = "/demarrage";
const MAX_PAGES = 60;
// Pictures of the offline page (mockup 08-05), stored with it.
const OFFLINE_ASSETS = [
  "/marque/jumanly-logo-principal.svg",
  "/illustrations/jumanly-amani-perplexe.svg",
];

const SPACE = /^\/app(\/|$)/;
// Bumped on sign-out: a warm-up still running then keeps nothing more.
let session = 0;
const NEVER_KEPT = [/^\/app\/abonnement\/payer/, /^\/app\/testeur/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((cache) => cache.addAll([OFFLINE_URL, LAUNCH_URL, "/icon.svg", ...OFFLINE_ASSETS]))
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

function kept(url) {
  return (
    url.origin === self.location.origin &&
    SPACE.test(url.pathname) &&
    !NEVER_KEPT.some((re) => re.test(url.pathname))
  );
}

async function trimPages() {
  const cache = await caches.open(PAGES);
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((key) => cache.delete(key)),
  );
}

/** Keeps a page that loaded; forgets it when it now sends elsewhere (signed out, no access). */
async function keep(request, response) {
  const cache = await caches.open(PAGES);
  if (response.redirected || !response.ok) await cache.delete(request, { ignoreVary: true });
  else {
    await cache.delete(request, { ignoreVary: true });
    await cache.put(request, response.clone());
    await trimPages();
  }
}

async function stored(request) {
  const exact = await caches.match(request, { cacheName: PAGES, ignoreVary: true });
  if (exact) return exact;
  // Same page with other parameters (a tab, a filter): better than nothing offline.
  return caches.match(request, { cacheName: PAGES, ignoreVary: true, ignoreSearch: true });
}

async function page(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (kept(url)) await keep(request, response);
    return response;
  } catch (error) {
    if (kept(url)) {
      const copy = await stored(request);
      if (copy) return copy;
    }
    const offline = await caches.match(OFFLINE_URL, { cacheName: STATIC });
    if (offline) return offline;
    throw error;
  }
}

async function launch(request, event) {
  const cache = await caches.open(STATIC);
  const copy = await cache.match(LAUNCH_URL);
  const fresh = fetch(request)
    .then(async (response) => {
      if (response.ok && !response.redirected) await cache.put(LAUNCH_URL, response.clone());
      return response;
    })
    .catch(() => null);
  if (copy) {
    event.waitUntil(fresh);
    return copy;
  }
  return (await fresh) || (await cache.match(OFFLINE_URL)) || Response.error();
}

async function builtFile(request) {
  const copy = await caches.match(request, { cacheName: STATIC });
  if (copy) return copy;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone());
  return response;
}

/** The main pages of the space, asked once per session so they open offline. */
async function warm(paths) {
  const started = session;
  for (const path of paths) {
    if (session !== started) return;
    const url = new URL(path, self.location.origin);
    if (!kept(url)) continue;
    const request = new Request(url, { credentials: "include", headers: { Accept: "text/html" } });
    try {
      const response = await fetch(request);
      // Signed out meanwhile: stop, keep nothing.
      if (session !== started || response.redirected) return;
      await keep(request, response);
    } catch {
      return;
    }
  }
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm" && Array.isArray(data.paths)) event.waitUntil(warm(data.paths));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Sign-out ends on /connexion?deconnecte=1, as a page or as an in-app navigation.
  if (url.searchParams.has("deconnecte")) {
    session += 1;
    event.waitUntil(caches.delete(PAGES));
  }
  if (request.mode === "navigate") {
    if (url.pathname === LAUNCH_URL) event.respondWith(launch(request, event));
    else event.respondWith(page(request));
  } else if (url.pathname.startsWith("/_next/static/") || OFFLINE_ASSETS.includes(url.pathname))
    event.respondWith(builtFile(request));
});
