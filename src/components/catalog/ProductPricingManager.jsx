// File: src/components/catalog/ProductPricingManager.jsx
import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, AlertCircle, Tag, Save, X as XIcon } from 'lucide-react'
import {
  getProductPricingTiers,
  saveProductPricingTier,
  deleteProductPricingTier,
  PRICING_TIER,
  PRICING_TIER_LABELS,
} from '../../api/posApi'

function emptyDraft(productId) {
  return {
    id: null,
    productId,
    productVariantId: null,
    tier: PRICING_TIER.WHOLESALE,
    price: '',
    minQuantity: 1,
    isActive: true,
  }
}

/**
 * Drop into a product edit form (below the base SellingPrice field) to manage price breaks per
 * pricing tier and, optionally, per variant. `variants` is optional — pass the product's
 * ProductVariant list (PosVariantDto/ProductVariant-shaped, needs at least `id` + display fields)
 * to let the admin scope a row to one specific variant instead of the whole product.
 */
export default function ProductPricingManager({ productId, variants = [] }) {
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function loadPrices() {
    setLoading(true)
    setError(null)
    try {
      const data = await getProductPricingTiers(productId)
      setPrices(data || [])
    } catch (err) {
      setError(err?.message || 'تعذر تحميل شرائح الأسعار.')
    } finally {
      setLoading(false)
    }
  }

  function startNewDraft() {
    setError(null)
    setDraft(emptyDraft(productId))
  }

  function startEditDraft(price) {
    setError(null)
    setDraft({ ...price })
  }

  async function handleSaveDraft() {
    if (draft.price === '' || Number(draft.price) < 0) {
      setError('السعر مطلوب ويجب أن يكون صفر أو أكبر.')
      return
    }
    if (!draft.minQuantity || Number(draft.minQuantity) < 1) {
      setError('الحد الأدنى للكمية يجب أن يكون 1 على الأقل.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await saveProductPricingTier({
        id: draft.id,
        productId: draft.productId,
        productVariantId: draft.productVariantId,
        tier: Number(draft.tier),
        price: Number(draft.price),
        minQuantity: Number(draft.minQuantity),
        isActive: draft.isActive,
      })
      setDraft(null)
      await loadPrices()
    } catch (err) {
      setError(err?.message || 'تعذر حفظ شريحة السعر — تأكد من عدم تكرار نفس الفئة والحد الأدنى لنفس المنتج/المتغيّر.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(priceId) {
    if (!window.confirm('حذف شريحة السعر هذه نهائياً؟')) return
    setError(null)
    try {
      await deleteProductPricingTier(priceId)
      await loadPrices()
    } catch (err) {
      setError(err?.message || 'تعذر حذف شريحة السعر.')
    }
  }

  function variantLabel(variantId) {
    if (!variantId) return 'كل المتغيّرات'
    const variant = variants.find((v) => v.id === variantId)
    if (!variant) return `متغيّر #${variantId}`
    return [variant.color, variant.size, variant.material, variant.finish].filter(Boolean).join(' / ') || variant.sku
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Tag size={15} className="text-emerald-600" />
          شرائح الأسعار (تجزئة / نص جملة / جملة)
        </h3>
        <button
          type="button"
          onClick={startNewDraft}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 cursor-pointer"
        >
          <Plus size={13} />
          إضافة شريحة سعر
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {prices.length === 0 && !draft ? (
        <div className="rounded-xl border border-dashed border-border bg-canvas p-6 text-center text-xs text-ink-soft">
          لا توجد شرائح أسعار مخصصة بعد — سيُستخدم السعر الأساسي للمنتج (أو للمتغيّر) دائماً.
        </div>
      ) : (
        prices.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-canvas font-semibold text-ink-soft">
                <tr>
                  <th className="p-2.5">الفئة</th>
                  <th className="p-2.5">المتغيّر</th>
                  <th className="p-2.5">الحد الأدنى للكمية</th>
                  <th className="p-2.5">السعر</th>
                  <th className="p-2.5">نشطة؟</th>
                  <th className="p-2.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {prices.map((price) => (
                  <tr key={price.id} className="transition hover:bg-canvas/50">
                    <td className="p-2.5 font-bold text-ink">{PRICING_TIER_LABELS[price.tier] || price.tier}</td>
                    <td className="p-2.5 text-ink-soft">{variantLabel(price.productVariantId)}</td>
                    <td className="p-2.5 font-mono text-ink-soft">{price.minQuantity}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-700">{Number(price.price).toFixed(2)} ج.م</td>
                    <td className="p-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${price.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-canvas text-ink-soft'}`}>
                        {price.isActive ? 'نشطة' : 'موقوفة'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditDraft(price)}
                          className="rounded-lg px-2 py-1 text-[10px] font-bold text-ink-soft transition hover:bg-canvas cursor-pointer"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(price.id)}
                          className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {draft && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="text-[11px] font-bold text-ink-soft">
              الفئة
              <select
                value={draft.tier}
                onChange={(e) => setDraft({ ...draft, tier: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs outline-none focus:border-emerald-500"
              >
                {Object.entries(PRICING_TIER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {variants.length > 0 && (
              <label className="text-[11px] font-bold text-ink-soft">
                المتغيّر
                <select
                  value={draft.productVariantId ?? ''}
                  onChange={(e) => setDraft({ ...draft, productVariantId: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="">كل المتغيّرات</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {[variant.color, variant.size, variant.material, variant.finish].filter(Boolean).join(' / ') || variant.sku}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="text-[11px] font-bold text-ink-soft">
              الحد الأدنى للكمية
              <input
                type="number"
                min="1"
                value={draft.minQuantity}
                onChange={(e) => setDraft({ ...draft, minQuantity: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
              />
            </label>

            <label className="text-[11px] font-bold text-ink-soft">
              السعر (ج.م)
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                placeholder="0.00"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-[11px] font-bold text-ink-soft">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-400"
            />
            شريحة نشطة
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-[11px] font-bold text-ink-soft transition hover:bg-canvas cursor-pointer"
            >
              <XIcon size={13} />
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
