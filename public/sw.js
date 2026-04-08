// ZFlix Service Worker
// Network-first for API, Cache-first for static assets

const CACHE_NAME = 'zflix-v1'
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
]

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // Pre-cache critical static assets (best-effort)
      await Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url))
      )
      // Activate immediately without waiting for old SW to unload
      self.skipWaiting()
    })()
  )
})

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove old caches
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
      // Take control of all clients immediately
      await clients.claim()
    })()
  )
})

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== location.origin) return

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API calls → Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets (_next/static, fonts, icons, images) → Cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf)$/)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation requests → Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Default → network-first
  event.respondWith(networkFirst(request))
})

// ─── Strategies ───────────────────────────────────────────────────────────────

/**
 * Network-first: try network, fall back to cache.
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await cache.match(request)
    return cached ?? new Response('Hors ligne', { status: 503, statusText: 'Service indisponible' })
  }
}

/**
 * Cache-first: serve from cache if available, otherwise fetch and cache.
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    return new Response('Ressource indisponible', { status: 503 })
  }
}

/**
 * Network-first with offline HTML fallback for navigation.
 */
async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(CACHE_NAME)
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached

    // Return offline fallback page
    const offlinePage = await cache.match(OFFLINE_URL)
    return (
      offlinePage ??
      new Response(
        `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>ZFlix — Hors ligne</title></head>
<body style="background:#171D20;color:#E8F4FA;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;">
  <div>
    <h1 style="color:#BDE6FB;font-size:2rem;margin-bottom:1rem;">ZFlix</h1>
    <p>Vous êtes hors ligne. Vérifiez votre connexion internet.</p>
  </div>
</body>
</html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    )
  }
}
