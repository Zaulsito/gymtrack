const CACHE_NAME = 'gymtrack-v4'
const urlsToCache = ['/', '/index.html']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  )
})

// ── Rest timer en segundo plano ──────────────────────────────────────────────
let timerTimeout = null

self.addEventListener('message', event => {
  if (event.data?.type === 'START_REST_TIMER') {
    const { seconds } = event.data
    if (timerTimeout) clearTimeout(timerTimeout)

    timerTimeout = setTimeout(() => {
      self.registration.showNotification('GymTrack ⏱', {
        body: '¡Tiempo de descanso terminado! Vuelve al ejercicio 💪',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [300, 100, 300, 100, 300],
        tag: 'rest-timer',
        renotify: true,
        silent: false,
      })
    }, seconds * 1000)
  }

  if (event.data?.type === 'CANCEL_REST_TIMER') {
    if (timerTimeout) {
      clearTimeout(timerTimeout)
      timerTimeout = null
    }
  }
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) clientList[0].focus()
      else clients.openWindow('/')
    })
  )
})
