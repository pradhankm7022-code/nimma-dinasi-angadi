const NDA_LIBRARY_URL = import.meta.env.VITE_NDA_LIBRARY_URL as string
const CACHE_KEY = 'nda_store_url'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

interface StoreUrlCache {
  slug: string
  url: string
  cachedAt: number
}

function readCached(slug: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: StoreUrlCache = JSON.parse(raw)
    if (cache.slug !== slug) return null
    if (Date.now() - cache.cachedAt > CACHE_TTL) return null
    return cache.url
  } catch { return null }
}

function writeCache(slug: string, url: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ slug, url, cachedAt: Date.now() }))
  } catch {}
}

export async function resolveStoreUrl(slug: string): Promise<string> {
  const cached = readCached(slug)
  if (cached) return cached

  const params = new URLSearchParams({
    action: 'getStoreUrl',
    payload: JSON.stringify({ slug }),
  })
  const res = await fetch(`${NDA_LIBRARY_URL}?${params}`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Store not found')

  writeCache(slug, data.url)
  return data.url
}

export function getCachedStoreUrl(slug: string): string | null {
  return readCached(slug)
}
