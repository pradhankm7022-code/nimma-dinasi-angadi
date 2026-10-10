import webpush from 'web-push'

export default {
  async fetch(req, env) {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    const { endpoint, p256dh, auth, payload } = body
    if (!endpoint || !p256dh || !auth || !payload) {
      return new Response('Missing fields', { status: 400 })
    }

    webpush.setVapidDetails(
      'mailto:nimmadinasi@example.com',
      env.VAPID_PUBLIC,
      env.VAPID_PRIVATE
    )

    try {
      await webpush.sendNotification(
        { endpoint, keys: { p256dh, auth } },
        payload
      )
      return new Response('ok')
    } catch (e) {
      // 410 Gone = subscription expired, tell caller to remove it
      const status = e.statusCode === 410 ? 410 : 500
      return new Response(e.message, { status })
    }
  },
}
