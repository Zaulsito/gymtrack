self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  const data = e.data?.json() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'GymTrack', {
      body:    data.body  || '¡Es hora de entrenar! 💪',
      icon:    '/icon-512.png',
      badge:   '/icon-512.png',
      vibrate: [200, 100, 200],
      data:    { url: '/' },
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'))
})

// Alarma local: el SW revisa cada minuto si hay que notificar
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_CHECK') {
    checkAndNotify(e.data.payload)
  }
})

async function checkAndNotify({ title, body }) {
  await self.registration.showNotification(title, {
    body,
    icon:    '/icon-512.png',
    badge:   '/icon-512.png',
    vibrate: [200, 100, 200],
    data:    { url: '/' },
  })
}
