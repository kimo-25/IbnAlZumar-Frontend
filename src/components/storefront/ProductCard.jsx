// File: src/components/storefront/ProductCard.jsx
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { getImageUrl, getProductImagePath, handleImageError } from '../../utils/imageHelper'
import { buildVariantLabel, formatCurrency } from '../../utils/catalog'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)
  
  // تحديد الاسم المفضل (العربي أولاً)
  const displayName = product.nameAr || product.name || ''

  const defaultVariant = product.variants?.find((variant) => variant.isDefault) || product.variants?.[0] || null
  const price = defaultVariant?.price ?? product.price ?? product.sellingPrice
  const originalPrice = defaultVariant?.originalPrice ?? product.originalPrice ?? price
  const discountPercentage = defaultVariant?.discountPercentage ?? product.discountPercentage ?? 0
  const rawImagePath = defaultVariant?.imageUrl || getProductImagePath(product)
  const imageSrc = getImageUrl(rawImagePath)
  const hasDiscount = discountPercentage > 0 && Number(originalPrice) > Number(price)
  const savings = Math.max(0, Number(originalPrice) - Number(price))

  function handleAddToCart() {
    addItem(
      {
        id: defaultVariant?.id || product.id,
        name: displayName,
        sku: product.sku,
        price,
        imageUrl: rawImagePath,
        variantId: defaultVariant?.id || null,
        variantLabel: buildVariantLabel(defaultVariant),
        selectedOptions: defaultVariant?.attributes || {},
      },
      1
    )
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
  }

  const outOfStock = product.inStock === false
  const stockLabel = outOfStock ? 'نفد المخزون' : 'متوفر'

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle transition hover:-translate-y-0.5 hover:border-amber/60 hover:shadow-lg">
      
      {/* 🖼️ قسم الصورة والبادجات العلوية */}
      <div className="relative aspect-square w-full bg-canvas overflow-hidden">
        <Link to={`/products/${product.id}`} className="block h-full w-full">
          <img
            src={imageSrc}
            alt={displayName}
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* 🏷️ الشارات العلوية */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 z-10">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
              outOfStock ? 'bg-danger text-white' : 'bg-success text-white'
            }`}
          >
            {stockLabel}
          </span>

          {hasDiscount && (
            <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              وفر {formatCurrency(savings)}
            </span>
          )}
        </div>
      </div>

      {/* 📝 تفاصيل المنتج والمعلومات */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        
        {/* SKU ورقم الصنف */}
        {product.sku && (
          <span className="w-fit rounded-md bg-canvas px-2 py-0.5 font-mono text-[11px] text-ink-soft border border-border/50">
            {product.sku}
          </span>
        )}

        {/* اسم المنتج العربي أولاً */}
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold text-ink transition group-hover:text-amber-dark" dir="auto">
            {displayName}
          </h3>
        </Link>

        {/* الفئة أو الـ Attributes */}
        {defaultVariant?.attributes && (
          <p className="text-xs text-ink-soft" dir="auto">
            {buildVariantLabel(defaultVariant)}
          </p>
        )}

        {/* سعر التخفيض والسعر الأصلي إن وجد */}
        {hasDiscount && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-danger/10 px-2 py-0.5 font-semibold text-danger">
              وفر {formatCurrency(savings)}
            </span>
            <span className="font-mono text-ink-soft line-through" dir="ltr">
              {formatCurrency(originalPrice)}
            </span>
          </div>
        )}

        {/* السعر الحالي */}
        <div className="flex items-baseline justify-between gap-3 pt-1 mt-auto">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">السعر الحالي</p>
            <p className="font-mono text-lg font-bold tabular-nums text-ink" dir="ltr">
              {formatCurrency(price)}
            </p>
          </div>
        </div>

        {/* 🛒 أزرار الإجراءات */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              justAdded ? 'bg-success text-white' : 'bg-graphite-900 text-white hover:bg-graphite-800'
            }`}
          >
            {justAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
            {justAdded ? 'تمت الإضافة' : 'أضف إلى السلة'}
          </button>

          <Link
            to={`/products/${product.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas hover:border-amber/60"
          >
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </div>
  )
}