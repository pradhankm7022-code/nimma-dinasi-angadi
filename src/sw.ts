/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'New Order', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/staff/orders' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes('/staff/orders'))
      if (existing) return existing.focus()
      return clients.openWindow('/staff/orders')
    })
  )
})
