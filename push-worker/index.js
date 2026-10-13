// Web Push (RFC 8291 aes128gcm) + VAPID (RFC 8292) using Web Crypto API

const b64 = {
  encode: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
  decode: (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) str += '='
    return Uint8Array.from(atob(str), c => c.charCodeAt(0))
  }
}

async function makeVapidToken(audience, subject, publicKeyB64, privateKeyB64) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64.encode(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64.encode(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 43200, sub: subject })))
  const unsigned = `${header}.${claims}`

  const pubBytes = b64.decode(publicKeyB64) // 65 bytes uncompressed
  const key = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC', crv: 'P-256',
      d: privateKeyB64,
      x: b64.encode(pubBytes.slice(1, 33)),
      y: b64.encode(pubBytes.slice(33, 65)),
      key_ops: ['sign'],
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  )
  return `${unsigned}.${b64.encode(sig)}`
}

// RFC 8291 — aes128gcm content encoding
async function encrypt(plaintext, p256dhB64, authB64) {
  const recipientPublicKey = b64.decode(p256dhB64)
  const authSecret = b64.decode(authB64)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Ephemeral server key pair
  const serverKP = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  )
  const serverPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKP.publicKey))

  // ECDH shared secret
  const recipientKey = await crypto.subtle.importKey(
    'raw', recipientPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  )
  const ikm = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: recipientKey }, serverKP.privateKey, 256
  ))

  // PRK via HKDF-SHA-256 with auth secret
  const prkKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const prkInfo = concat(
    utf8('WebPush: info\0'),
    recipientPublicKey,
    serverPublicRaw
  )
  const prk = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: prkInfo },
    prkKey, 256
  ))

  // CEK and nonce
  const cekKey = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits'])
  const cek = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: utf8('Content-Encoding: aes128gcm\0') },
    cekKey, 128
  ))
  const nonceKey = await crypto.subtle.importKey('raw', prk, 'HKDF', false, ['deriveBits'])
  const nonce = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: utf8('Content-Encoding: nonce\0') },
    nonceKey, 96
  ))

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])

  // Pad: 1 byte delimiter (0x02 = last record) + plaintext
  const plaintextBytes = new TextEncoder().encode(plaintext)
  const padded = new Uint8Array(plaintextBytes.length + 1)
  padded[0] = 2 // padding delimiter — last record
  padded.set(plaintextBytes, 1)

  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce }, aesKey, padded
  ))

  // RFC 8291 header: salt(16) + rs(4) + idlen(1) + serverPublic(65) + ciphertext
  const rs = 4096
  const header = new Uint8Array(16 + 4 + 1 + serverPublicRaw.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, rs, false) // big-endian
  header[20] = serverPublicRaw.length
  header.set(serverPublicRaw, 21)

  return concat(header, ciphertext)
}

function utf8(str) { return new TextEncoder().encode(str) }

function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) { out.set(a, offset); offset += a.length }
  return out
}

export default {
  async fetch(req, env) {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

    let body
    try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }

    const { endpoint, p256dh, auth, payload } = body
    if (!endpoint || !p256dh || !auth || !payload) {
      return new Response('Missing fields: ' + JSON.stringify({ endpoint: !!endpoint, p256dh: !!p256dh, auth: !!auth, payload: !!payload }), { status: 400 })
    }

    try {
      const url = new URL(endpoint)
      const audience = `${url.protocol}//${url.host}`
      const token = await makeVapidToken(audience, `mailto:${env.VAPID_SUBJECT || 'admin@example.com'}`, env.VAPID_PUBLIC, env.VAPID_PRIVATE)

      const encrypted = await encrypt(payload, p256dh, auth)

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `vapid t=${token},k=${env.VAPID_PUBLIC}`,
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL': '60',
        },
        body: encrypted,
      })

      const text = await res.text()
      console.log(`FCM response: ${res.status} ${text}`)
      if (!res.ok) return new Response(`Push failed: ${res.status} ${text}`, { status: 500 })
      return new Response('ok')
    } catch (e) {
      console.error(`Push error: ${e.message}\n${e.stack}`)
      return new Response(e.message, { status: 500 })
    }
  }
}
