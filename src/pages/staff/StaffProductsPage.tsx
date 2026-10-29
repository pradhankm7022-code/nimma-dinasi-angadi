import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createCategory, createProduct, deleteCategory, deleteProduct,
  getProducts, updateCategory, updateProduct
} from '../../api'
import { useStore } from '../../contexts/StoreContext'
import { useLang } from '../../contexts/LangContext'
import type { Category, Product, ProductVariant } from '../../types'
import { ImageUploader } from '../../components/staff/ImageUploader'
import { useStorePath } from '../../lib/useStorePath'
import { KaButton } from '../../components/ui/KaButton'

type Tab = 'products' | 'categories'

const STAFF_PRODUCTS_CACHE = 'nda_staff_products'

function readProductsCache(): Product[] {
  try { return JSON.parse(localStorage.getItem(STAFF_PRODUCTS_CACHE) || '[]') } catch { return [] }
}
function writeProductsCache(products: Product[]) {
  try { localStorage.setItem(STAFF_PRODUCTS_CACHE, JSON.stringify(products)) } catch {}
}

function getStaffToken(): string {
  return sessionStorage.getItem('nda_staff_token') ?? ''
}

const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name_en: '', name_kn: '', category_id: '', category: '', image_url: '', in_stock: true, variants: [], search_keys: '', order_count: 0,
}

export function StaffProductsPage() {
  const { categories, setCategories } = useStore()
  const { lang } = useLang()
  const sp = useStorePath()
  const [tab, setTab] = useState<Tab>('products')

  // Products state
  const cached = readProductsCache()
  const [products, setProducts] = useState<Product[]>(cached)
  const [loadingProducts, setLoadingProducts] = useState(cached.length === 0)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isNewProduct, setIsNewProduct] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productError, setProductError] = useState('')
  const [search, setSearch] = useState('')

  // Categories state
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [isNewCat, setIsNewCat] = useState(false)
  const [savingCat, setSavingCat] = useState(false)
  const [catError, setCatError] = useState('')
  const [editingCatId, setEditingCatId] = useState('')

  useEffect(() => {
    getProducts()
      .then(res => {
        setProducts(res.products)
        writeProductsCache(res.products)
      })
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }, [])

  // ── Product actions ──────────────────────────────────────
  function openNewProduct() {
    setEditingProduct({ id: '', ...EMPTY_PRODUCT })
    setIsNewProduct(true)
    setProductError('')
  }

  function openEditProduct(p: Product) {
    setEditingProduct({ ...p, variants: p.variants.map(v => ({ ...v })) })
    setIsNewProduct(false)
    setProductError('')
  }

  async function handleSaveProduct() {
    if (!editingProduct) return
    setSavingProduct(true)
    setProductError('')
    try {
      if (isNewProduct) {
        const res = await createProduct(editingProduct, getStaffToken())
        setProducts(prev => {
          const next = [...prev, { ...editingProduct, id: res.id }]
          writeProductsCache(next)
          return next
        })
      } else {
        await updateProduct(editingProduct, getStaffToken())
        setProducts(prev => {
          const next = prev.map(p => p.id === editingProduct.id ? editingProduct : p)
          writeProductsCache(next)
          return next
        })
      }
      setEditingProduct(null)
    } catch (err: unknown) {
      setProductError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await deleteProduct(id, getStaffToken())
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id)
      writeProductsCache(next)
      return next
    })
  }

  function updateVariant(idx: number, field: keyof ProductVariant, value: string | number | boolean) {
    if (!editingProduct) return
    const variants = editingProduct.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v)
    setEditingProduct({ ...editingProduct, variants })
  }

  function addVariant() {
    if (!editingProduct) return
    setEditingProduct({ ...editingProduct, variants: [...editingProduct.variants, { label: '', price: 0 }] })
  }

  function removeVariant(idx: number) {
    if (!editingProduct) return
    setEditingProduct({ ...editingProduct, variants: editingProduct.variants.filter((_, i) => i !== idx) })
  }

  function setDefault(idx: number) {
    if (!editingProduct) return
    setEditingProduct({
      ...editingProduct,
      variants: editingProduct.variants.map((v, i) => ({ ...v, default: i === idx })),
    })
  }

  // ── Category actions ─────────────────────────────────────
  function openNewCat() {
    setEditingCat({ id: '', name: '', name_kn: '', image_url: '' })
    setIsNewCat(true)
    setEditingCatId('')
    setCatError('')
  }

  function openEditCat(cat: Category) {
    setEditingCat({ ...cat })
    setIsNewCat(false)
    setEditingCatId(cat.id)
    setCatError('')
  }

  async function handleSaveCat() {
    if (!editingCat || !editingCat.name.trim()) {
      setCatError('Name is required')
      return
    }
    setSavingCat(true)
    setCatError('')
    try {
      if (isNewCat) {
        const res = await createCategory(editingCat.name, editingCat.image_url, getStaffToken())
        setCategories([...categories, { ...editingCat, id: res.id, name_kn: editingCat.name_kn || editingCat.name }])
      } else {
        await updateCategory(editingCatId, editingCat.name, editingCat.image_url, getStaffToken())
        setCategories(categories.map(c => c.id === editingCatId ? { ...editingCat, id: editingCatId } : c))
      }
      setEditingCat(null)
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingCat(false)
    }
  }

  async function handleDeleteCat(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return
    await deleteCategory(cat.id, getStaffToken())
    setCategories(categories.filter(c => c.id !== cat.id))
  }

  // ── Product edit screen ───────────────────────────────────
  if (editingProduct) {
    return (
      <div className="min-h-svh bg-gray-50 pb-8">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setEditingProduct(null)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">{isNewProduct ? 'New Product' : 'Edit Product'}</h1>
          <button onClick={handleSaveProduct} disabled={savingProduct}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
            {savingProduct ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="px-4 pt-4 space-y-4 max-w-lg">
          {productError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{productError}</div>}

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <ImageUploader
              imageUrl={editingProduct.image_url}
              onUpload={url => setEditingProduct({ ...editingProduct, image_url: url })}
            />
          </div>

          {[
            { label: 'Name (English)', field: 'name_en', placeholder: 'Sugar' },
            { label: 'Name (Kannada)', field: 'name_kn', placeholder: 'ಸಕ್ಕರೆ' },
            { label: 'Search Keys (transliteration)', field: 'search_keys', placeholder: 'sakkare, sugar' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text" value={editingProduct[field as keyof typeof editingProduct] as string}
                onChange={e => setEditingProduct({ ...editingProduct, [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          ))}

          {/* Category dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={editingProduct.category_id}
              onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value, category: categories.find(c => c.id === e.target.value)?.name ?? '' })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
            >
              <option value="">Select category…</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={editingProduct.in_stock}
              onChange={e => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
              className="rounded accent-green-600" />
            In Stock
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Variants</p>
              <button onClick={addVariant} className="text-xs text-green-600 font-medium hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {editingProduct.variants.map((v, i) => (
                <div key={i} className="flex gap-2 items-center bg-white border border-gray-200 rounded-lg p-2">
                  <input
                    type="text" value={v.label}
                    onChange={e => updateVariant(i, 'label', e.target.value.toUpperCase())}
                    placeholder="100G" className="flex-1 border-none outline-none text-sm bg-transparent"
                  />
                  <input
                    type="number" value={v.price === 0 ? '' : v.price}
                    onChange={e => updateVariant(i, 'price', parseFloat(e.target.value) || 0)}
                    onFocus={e => e.target.select()}
                    placeholder="Price" className="w-20 border-none outline-none text-sm bg-transparent text-right"
                  />
                  <button onClick={() => setDefault(i)}
                    className={`text-xs px-2 py-0.5 rounded-full border ${v.default ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 text-gray-500'}`}>
                    Default
                  </button>
                  <button onClick={() => removeVariant(i)} className="text-gray-400 hover:text-red-500 ml-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Category edit screen ──────────────────────────────────
  if (editingCat) {
    return (
      <div className="min-h-svh bg-gray-50 pb-8">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setEditingCat(null)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">{isNewCat ? 'New Category' : 'Edit Category'}</h1>
          <button onClick={handleSaveCat} disabled={savingCat}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
            {savingCat ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="px-4 pt-4 space-y-4 max-w-lg">
          {catError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{catError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text" value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
              placeholder="Fruits"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <ImageUploader
              imageUrl={editingCat.image_url}
              onUpload={url => setEditingCat({ ...editingCat, image_url: url })}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Main list screen ──────────────────────────────────────
  const q = search.trim().toLowerCase()
  const filteredProducts = q
    ? products.filter(p =>
        p.name_en.toLowerCase().includes(q) ||
        p.name_kn.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    : products

  return (
    <div className="min-h-svh bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={sp('/staff/orders')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Manage</h1>
        </div>
        <div className="flex items-center gap-2">
          <KaButton />
          <button
            onClick={() => tab === 'products' ? openNewProduct() : openNewCat()}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 bg-white px-4">
        {(['products', 'categories'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 px-4 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search bar — products only */}
      {tab === 'products' && (
        <div className="px-4 pt-3 bg-white border-b border-gray-100">
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-gray-100 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      )}

      <div className="px-4 pt-4 space-y-3">
        {tab === 'products' ? (
          loadingProducts ? (
            <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">{products.length === 0 ? 'No products yet' : 'No results'}</div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3 items-center">
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {lang === 'kn' && p.name_kn ? p.name_kn : p.name_en}
                  </p>
                  <p className="text-xs text-gray-400">{p.category} · {p.variants.map(v => v.label).join(', ')}</p>
                  {!p.in_stock && <span className="text-xs text-red-500 font-medium">Out of stock</span>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEditProduct(p)} className="text-xs text-green-600 font-medium hover:underline">Edit</button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
                </div>
              </div>
            ))
          )
        ) : (
          categories.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">No categories yet</div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3 items-center">
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEditCat(cat)} className="text-xs text-green-600 font-medium hover:underline">Edit</button>
                  <button onClick={() => handleDeleteCat(cat)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
