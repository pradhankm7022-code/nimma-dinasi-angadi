import { useState } from 'react'
import type { Product } from '../../types'
import { useStore } from '../../contexts/StoreContext'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const { addToCart, cart, updateCartQty } = useStore()
  const defaultIdx = product.variants.findIndex(v => v.default) ?? 0
  const [variantIdx, setVariantIdx] = useState(defaultIdx >= 0 ? defaultIdx : 0)

  const variant = product.variants[variantIdx]
  const cartItem = cart.find(
    c => c.product_id === product.id && c.variant_label === variant.label
  )
  const qty = cartItem?.qty ?? 0

  function increment() {
    if (qty === 0) {
      addToCart({
        product_id: product.id,
        product_name_en: product.name_en,
        product_name_kn: product.name_kn,
        product_image_url: product.image_url,
        variant_label: variant.label,
        variant_price: variant.price,
        qty: 1,
      })
    } else {
      updateCartQty(product.id, variant.label, qty + 1)
    }
  }

  function decrement() {
    updateCartQty(product.id, variant.label, qty - 1)
  }

  // swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) setVariantIdx(i => Math.min(i + 1, product.variants.length - 1))
      else setVariantIdx(i => Math.max(i - 1, 0))
    }
    setTouchStart(null)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex gap-3 p-3 shadow-sm">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name_en} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🛒</div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{product.name_en}</p>
        <p className="text-xs text-gray-400 truncate">{product.name_kn}</p>

        {/* Variant pills */}
        {product.variants.length > 0 && (
          <div
            className="flex gap-1 mt-0.5 overflow-x-auto scrollbar-hide"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {product.variants.map((v, i) => (
              <button
                key={v.label}
                onClick={() => setVariantIdx(i)}
                className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap ${
                  i === variantIdx
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Qty control */}
        <div className="mt-auto flex items-center justify-end">
          {qty === 0 ? (
            <button
              onClick={increment}
              className="bg-white border-2 border-green-600 text-green-600 font-bold text-sm px-5 py-0.5 rounded-lg active:scale-95 transition-transform"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center bg-green-600 rounded-lg overflow-hidden">
              <button onClick={decrement} className="px-3 py-1 text-white font-bold text-lg leading-none active:bg-green-700">−</button>
              <span className="px-2 py-1 text-white font-bold text-sm min-w-[24px] text-center">{qty}</span>
              <button onClick={increment} className="px-3 py-1 text-white font-bold text-lg leading-none active:bg-green-700">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
