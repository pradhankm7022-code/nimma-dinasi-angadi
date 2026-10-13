import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../../components/catalog/ProductCard'
import { BottomNav } from '../../components/ui/BottomNav'
import { KaButton } from '../../components/ui/KaButton'
import { useStore } from '../../contexts/StoreContext'

export function CategoryProductsPage() {
  const { id } = useParams<{ id: string }>()
  const { products, categories, loadingStore } = useStore()
  const navigate = useNavigate()

  const categoryName = categories.find(c => c.id === id)?.name ?? ''

  const categoryProducts = useMemo(() => {
    return products
      .filter(p => p.category_id === id)
      .sort((a, b) => a.name_en.localeCompare(b.name_en))
  }, [products, id])

  return (
    <div className="min-h-svh bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{categoryName}</h1>
        <KaButton />
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loadingStore ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
        ) : categoryProducts.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">No products in this category</div>
        ) : (
          categoryProducts.map(p => <ProductCard key={p.id} product={p} />)
        )}
      </div>

      <BottomNav />
    </div>
  )
}
