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
 *   On a slow network (29/10/2026, « comme WhatsApp ») a kept page is shown after 3.5 s of waiting;
 *   the network answer, when it comes, is kept and the screen is told (« page-updated »), which
 *   reads it again in the background.
 * - Pictures of the site and of the space (photos, banners, posts): kept on the device and shown at
 *   once, refreshed in the background (300 at most).
 * - Built files (/_next/static, hashed names): cache first.
 * - Signing out empties the kept pages and pictures (the next person on the device sees nothing),
 *   and stops the notifications of this device.
 * - Notifications outside the app (Web Push, 29/10/2026): « Nouveau message de … » with the photo
 *   of the person who wrote; a touch opens the conversation (or brings the open app to it).
 */
const VERSION = "jm-v2";
const PAGES = `${VERSION}-pages`;
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/hors-ligne";
const LAUNCH_URL = "/demarrage";
const PICTURES = `${VERSION}-pictures`;
const MAX_PAGES = 150;
const MAX_PICTURES = 300;
/** How long a page may take before the copy kept on the device is shown instead. */
const SLOW_MS = 3500;
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

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

/** Keeps a page that loaded; forgets it when it now sends elsewhere (signed out, no access). */
async function keep(request, response) {
  const cache = await caches.open(PAGES);
  if (response.redirected || !response.ok) await cache.delete(request, { ignoreVary: true });
  else {
    await cache.delete(request, { ignoreVary: true });
    await cache.put(request, response.clone());
    await trim(PAGES, MAX_PAGES);
  }
}

async function stored(request) {
  const exact = await caches.match(request, { cacheName: PAGES, ignoreVary: true });
  if (exact) return exact;
  // Same page with other parameters (a tab, a filter): better than nothing offline.
  return caches.match(request, { cacheName: PAGES, ignoreVary: true, ignoreSearch: true });
}

/** Tells the screens that a page shown from the device has come from the network. */
async function tellUpdated(url) {
  const clients = await self.clients.matchAll({ type: "window" });
  for (const client of clients) client.postMessage({ type: "page-updated", path: url.pathname });
}

async function page(request, event) {
  const url = new URL(request.url);
  const network = fetch(request).then(async (response) => {
    if (kept(url)) await keep(request, response);
    return response;
  });
  try {
    if (kept(url)) {
      // Only the very same page: another tab or filter would show the wrong screen.
      const copy = await caches.match(request, { cacheName: PAGES, ignoreVary: true });
      if (copy) {
        let late = false;
        const slow = new Promise((resolve) =>
          setTimeout(() => {
            late = true;
            resolve(copy);
          }, SLOW_MS),
        );
        const answer = await Promise.race([network, slow]);
        if (late) {
          event.waitUntil(
            network.then((response) => response.ok && tellUpdated(url)).catch(() => undefined),
          );
        }
        return answer;
      }
    }
    return await network;
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

/** A picture: the kept copy at once, the network one kept for next time. */
async function picture(request, event) {
  const cache = await caches.open(PICTURES);
  const copy = await cache.match(request);
  const fresh = fetch(request)
    .then(async (response) => {
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
        await trim(PICTURES, MAX_PICTURES);
      }
      return response;
    })
    .catch(() => null);
  if (copy) {
    event.waitUntil(fresh);
    return copy;
  }
  return (await fresh) || Response.error();
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
    event.waitUntil(
      Promise.all([
        caches.delete(PAGES),
        caches.delete(PICTURES),
        self.registration.pushManager
          .getSubscription()
          .then((subscription) => subscription && subscription.unsubscribe())
          .catch(() => undefined),
      ]),
    );
  }
  if (request.mode === "navigate") {
    if (url.pathname === LAUNCH_URL) event.respondWith(launch(request, event));
    else event.respondWith(page(request, event));
  } else if (url.pathname.startsWith("/_next/static/") || OFFLINE_ASSETS.includes(url.pathname))
    event.respondWith(builtFile(request));
  else if (request.destination === "image") event.respondWith(picture(request, event));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Jumanly", body: event.data ? event.data.text() : "" };
  }
  const options = {
    body: data.body || "",
    icon: data.icon || "/marque/jumanly-favicon-192.png",
    data: { url: data.url || "/app/notifications" },
  };
  if (data.tag) {
    options.tag = data.tag;
    options.renotify = true;
  }
  event.waitUntil(self.registration.showNotification(data.title || "Jumanly", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/app", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (!open) return self.clients.openWindow(url);
      return open
        .navigate(url)
        .then((client) => (client || open).focus())
        .catch(() => self.clients.openWindow(url));
    }),
  );
});
