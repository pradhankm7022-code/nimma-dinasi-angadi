import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/catalog/ProductCard'
import { BottomNav } from '../../components/ui/BottomNav'
import { KaButton } from '../../components/ui/KaButton'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import { useStore } from '../../contexts/StoreContext'

type View = 'categories' | 'all'

export function CatalogPage() {
  const { storeName, categories, products, loadingStore } = useStore()
  const { user, logout } = useAuth()
  const { lang } = useLang()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<View>(searchParams.get('view') === 'categories' ? 'categories' : 'all')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  function switchView(v: View) {
    setView(v)
    setSearchParams(v === 'categories' ? { view: 'categories' } : {}, { replace: true })
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleShare() {
    const url = window.location.origin
    const text = `Shop groceries online at ${storeName}: ${url}`
    if (navigator.share) {
      navigator.share({ title: storeName, text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'))
    }
    setMenuOpen(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = view === 'all' ? [...products] : products
    if (!q) return list
    return list
      .filter(p =>
        p.name_en.toLowerCase().includes(q) ||
        p.name_kn.toLowerCase().includes(q) ||
        (p.search_keys || '').toLowerCase().split(',').some(k => k.trim().includes(q))
      )
  }, [products, view, search])

  const isSearching = search.trim().length > 0

  return (
    <div className="min-h-svh bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{storeName}</h1>
          <div className="flex gap-1 items-center">
            <KaButton />
            <button
              onClick={() => switchView('categories')}
              className={`p-2 rounded-lg transition-colors ${view === 'categories' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Category view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => switchView('all')}
              className={`p-2 rounded-lg transition-colors ${view === 'all' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`}
              title="All products A–Z"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>

            {/* Gear menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className={`p-2 rounded-lg transition-colors ${menuOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
                title="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  {/* Dropdown */}
                  <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-lg border border-gray-100 w-56 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user?.phone}</p>
                    </div>
                    {/* Share */}
                    <button
                      onClick={handleShare}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share App
                    </button>
                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products in English or ಕನ್ನಡ…"
            className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      <div className="px-4 pt-4">
        {loadingStore ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
        ) : isSearching ? (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-16 text-sm">No products found</div>
            ) : (
              filtered.map(p => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        ) : view === 'categories' ? (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-95 transition-transform"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-800 text-center">{lang === 'kn' ? cat.name_kn : cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-16 text-sm">No products available</div>
            ) : (
              filtered.map(p => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
