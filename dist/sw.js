// MovEat service worker — minimal runtime caching for an installable PWA.
// No build-time precache manifest: we cache at runtime so hashed asset names
// don't need to be known ahead of time. API and media are never cached (live data).

const CACHE = "moveat-v3"

self.addEventListener("install", () => {
   self.skipWaiting()
})

self.addEventListener("activate", (event) => {
   event.waitUntil(
      (async () => {
         const keys = await caches.keys()
         await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
         await self.clients.claim()
      })(),
   )
})

self.addEventListener("fetch", (event) => {
   const req = event.request
   if (req.method !== "GET") return

   const url = new URL(req.url)

   // Never cache the platform API or live media — always hit the network.
   if (url.pathname.startsWith("/v1") || url.pathname.startsWith("/media")) return

   // App shell navigations: network-first, fall back to cached shell when offline.
   if (req.mode === "navigate") {
      event.respondWith(networkFirst(req))
      return
   }

   // Same-origin static assets (JS/CSS/fonts/icons): cache-first.
   if (url.origin === self.location.origin) {
      event.respondWith(cacheFirst(req))
   }
})

async function networkFirst(req) {
   const cache = await caches.open(CACHE)
   try {
      const res = await fetch(req)
      if (res && res.ok) cache.put(req, res.clone())
      return res
   } catch {
      const cached = await cache.match(req)
      return cached || (await cache.match("/")) || Response.error()
   }
}

async function cacheFirst(req) {
   const cache = await caches.open(CACHE)
   const cached = await cache.match(req)
   if (cached) return cached
   const res = await fetch(req)
   if (res && res.ok) cache.put(req, res.clone())
   return res
}
