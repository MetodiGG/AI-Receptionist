const CACHE = 'ai-receptionist-shell-v1'
const ASSETS = ['/icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/dashboard')) return
  if (!['image', 'style', 'font'].includes(request.destination)) return
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    const copy = response.clone()
    caches.open(CACHE).then((cache) => cache.put(request, copy))
    return response
  })))
})

