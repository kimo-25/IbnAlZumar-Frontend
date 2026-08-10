// File: src/pages/storefront/ProductDetailsPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, Loader2, Minus, Plus, ShoppingBag } from 'lucide-react'
import Card from '../../components/ui/Card'
import ProductImageGallery from '../../components/storefront/ProductImageGallery'
import ProductSpecTable from '../../components/storefront/ProductSpecTable'
import ProductVariantSwitcher from '../../components/storefront/ProductVariantSwitcher'
import { useCart } from '../../context/CartContext'
import { getProductById } from '../../api/storefrontApi'
import { buildVariantLabel, formatCurrency, normalizeProduct, resolveVariantByAttributes } from '../../utils/catalog'

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    getProductById(productId)
      .then((data) => {
        if (!active) return
        const normalized = normalizeProduct(data)
        setProduct(normalized)

        const initialVariant = resolveVariantByAttributes(normalized.variants, {})
        if (initialVariant) {
          setSelectedAttributes(initialVariant.attributes || {})
        } else {
          setSelectedAttributes({})
        }

        const mainImage =
          normalized.imageUrl ||
          initialVariant?.imageUrl ||
          normalized.gallery?.[0] ||
          normalized.variants?.find((variant) => variant.imageUrl)?.imageUrl ||
          ''

        setSelectedImage(mainImage)
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || 'تعذر تحميل تفاصيل المنتج.')
          setProduct(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [productId])

  const selectedVariant = useMemo(() => {
    if (!product) return null
    return resolveVariantByAttributes(product.variants, selectedAttributes)
  }, [product, selectedAttributes])

  const galleryImages = useMemo(() => {
    if (!product) return []
    
    const rawImages = [
      product.imageUrl,
      selectedImage,
      ...(product.gallery || []),
      ...(product.variants || []).map((variant) => variant?.imageUrl)
    ]

    const uniqueImages = Array.from(new Set(rawImages))
      .filter((img) => Boolean(img) && typeof img === 'string' && img.trim() !== '')

    return uniqueImages.length > 0 ? uniqueImages : [selectedImage]
  }, [product, selectedImage])

  const displayPrice = selectedVariant?.price ?? product?.price ?? product?.sellingPrice ?? 0
  const displaySpecs = selectedVariant?.specs?.length ? selectedVariant.specs : product?.specs || []
  const stockAvailable = selectedVariant
    ? (selectedVariant.stock ?? 1) > 0 && product?.isAvailableOnline !== false
    : product?.inStock !== false && product?.isAvailableOnline !== false
  const availableQuantity = selectedVariant?.stock || product?.stock || null
  const detailsSummary = [product?.brand, product?.material, product?.finish].filter(Boolean)

  const formattedDescriptionItems = useMemo(() => {
    if (!product?.description) return []
    const rawParts = product.description.split(/\||;/).map((p) => p.trim()).filter(Boolean)
    const hasStructuredSpecs = rawParts.length > 0 && rawParts.every((part) => part.includes(':'))
    return hasStructuredSpecs ? [] : rawParts
  }, [product?.description])

  useEffect(() => {
    if (availableQuantity) {
      setQuantity((current) => Math.min(current, availableQuantity))
    }
  }, [availableQuantity])

  function addCurrentSelection(targetQuantity = quantity) {
    if (!product) return
    const variant = selectedVariant || product
    const finalImage = selectedImage || product.imageUrl || variant.imageUrl || ''

    addItem(
      {
        id: variant.id || product.id,
        name: product.nameAr || product.name,
        sku: variant.sku || product.sku,
        price: displayPrice,
        imageUrl: finalImage,
        variantId: selectedVariant?.id || null,
        variantLabel: buildVariantLabel(selectedVariant),
        selectedOptions: selectedVariant?.attributes || {},
      },
      targetQuantity
    )
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  function handleAddToCart() {
    addCurrentSelection()
  }

  function handleBuyNow() {
    addCurrentSelection()
    navigate('/checkout')
  }

  function handleVariantChange(key, value) {
    setSelectedAttributes((current) => {
      const next = { ...current, [key]: value }
      const matchedVariant = resolveVariantByAttributes(product?.variants || [], next)
      if (matchedVariant?.imageUrl) setSelectedImage(matchedVariant.imageUrl)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-ink-soft">
        <Loader2 size={18} className="animate-spin" />
        جاري تحميل تفاصيل المنتج...
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
        <Card className="w-full">
          <div className="space-y-4 p-2 sm:p-6">
            <h1 className="font-display text-xl font-semibold text-ink">تعذر العثور على المنتج</h1>
            <p className="text-sm text-ink-soft">{error || 'المنتج المطلوب غير متاح حالياً.'}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-amber/60"
              >
                <ArrowRight size={16} />
                رجوع
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800"
              >
                العودة للمتجر
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-soft">
        <Link to="/" className="transition hover:text-ink">
          المنتجات
        </Link>
        <span>/</span>
        <span className="text-ink" dir="auto">
          {product.nameAr || product.name}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductImageGallery images={galleryImages} activeImage={selectedImage} onSelect={setSelectedImage} />

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              {product.brand && <span className="rounded-full bg-canvas px-3 py-1">{product.brand}</span>}
              {product.material && <span className="rounded-full bg-canvas px-3 py-1">{product.material}</span>}
              {product.finish && <span className="rounded-full bg-canvas px-3 py-1">{product.finish}</span>}
            </div>
            
            <h1 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl" dir="auto">
              {product.nameAr || product.name}
            </h1>

            {formattedDescriptionItems.length > 1 ? (
              <ul className="list-disc list-inside space-y-1 text-sm leading-7 text-ink-soft" dir="auto">
                {formattedDescriptionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="max-w-2xl text-sm leading-7 text-ink-soft" dir="auto">
                {product.description || 'تفاصيل المنتج ستظهر هنا من خلال الـ API.'}
              </p>
            )}
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">السعر الحالي</p>
                <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">{formatCurrency(displayPrice)}</p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  stockAvailable ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}
              >
                {stockAvailable ? 'متوفر' : 'غير متوفر'}
              </div>
            </div>

            {detailsSummary.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-soft">
                {detailsSummary.map((item) => (
                  <span key={item} className="rounded-full border border-border bg-surface px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-canvas px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-ink-soft">الكمية</p>
                  <p className="text-sm text-ink-soft">اختر العدد المطلوب قبل الإضافة</p>
                </div>

                <div className="flex items-center rounded-xl border border-border bg-surface shadow-subtle">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1}
                    className="inline-flex h-11 w-11 items-center justify-center text-ink-soft transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="إنقاص الكمية"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-12 px-3 text-center font-mono text-base font-semibold tabular-nums text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => (availableQuantity ? Math.min(availableQuantity, current + 1) : current + 1))}
                    disabled={availableQuantity ? quantity >= availableQuantity : false}
                    className="inline-flex h-11 w-11 items-center justify-center text-ink-soft transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="زيادة الكمية"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleAddToCart}
                  disabled={!stockAvailable}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {added ? <Check size={16} /> : <ShoppingBag size={16} />}
                  {added ? 'تمت الإضافة' : 'أضف إلى السلة'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={!stockAvailable}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-graphite-900 bg-graphite-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  اشتر الآن
                </button>
              </div>
            </div>
          </Card>

          <ProductVariantSwitcher
            variants={product.variants}
            selectedAttributes={selectedAttributes}
            onChange={handleVariantChange}
          />

          <ProductSpecTable specs={displaySpecs} />
        </div>
      </div>
    </div>
  )
}