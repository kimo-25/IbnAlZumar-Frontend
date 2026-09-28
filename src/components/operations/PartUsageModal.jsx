// File: src/components/maintenance/PartUsageModal.jsx
import { useState } from 'react'
import { X, Search, Plus, Trash2, Loader2, Wrench, AlertCircle } from 'lucide-react'
import { searchPosProducts } from '../../api/posApi'
import { addMaintenancePartUsage, removeMaintenancePartUsage } from '../../api/maintenanceWorkflowApi'

// NOTE: no warehouses-list API module was available while building this, so the warehouse is a
// plain numeric input defaulting to 1 (Main Warehouse — the same default used throughout the
// Phase 1 POS/pricing endpoints). Swap this for a real <select> once a warehouses endpoint is
// wired up on the frontend.
const DEFAULT_WAREHOUSE_ID = 1

export default function PartUsageModal({ ticket, onClose, onUpdated }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [warehouseId, setWarehouseId] = useState(DEFAULT_WAREHOUSE_ID)
  const [unitCostOverride, setUnitCostOverride] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function runSearch(e) {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    setError(null)
    try {
      const data = await searchPosProducts({ query: search, pageSize: 10 })
      setResults(data.items || [])
    } catch (err) {
      setError(err?.message || 'تعذر البحث عن قطع الغيار.')
    } finally {
      setSearching(false)
    }
  }

  function pickProduct(product) {
    setSelectedProduct(product)
    setResults([])
    setSearch('')
  }

  async function handleAttach() {
    if (!selectedProduct) return
    setSaving(true)
    setError(null)
    try {
      const updated = await addMaintenancePartUsage(ticket.id, {
        productId: selectedProduct.id,
        warehouseId: Number(warehouseId),
        quantity: Number(quantity),
        unitCostPrice: unitCostOverride === '' ? null : Number(unitCostOverride),
      })
      onUpdated(updated)
      setSelectedProduct(null)
      setQuantity(1)
      setUnitCostOverride('')
    } catch (err) {
      setError(err?.message || 'تعذر إضافة قطعة الغيار — تحقق من الكمية المتاحة بالمخزن.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(partUsageId) {
    if (!window.confirm('إزالة قطعة الغيار هذه؟ سيتم إرجاع الكمية للمخزون.')) return
    setError(null)
    try {
      const updated = await removeMaintenancePartUsage(ticket.id, partUsageId)
      onUpdated(updated)
    } catch (err) {
      setError(err?.message || 'تعذر إزالة قطعة الغيار.')
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose} dir="rtl">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <Wrench size={16} className="text-emerald-600" />
            قطع الغيار المستخدمة
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-canvas cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Already-attached parts */}
        <div className="space-y-1.5">
          {(ticket.partUsages || []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-canvas p-4 text-center text-xs text-ink-soft">
              لا توجد قطع غيار مضافة بعد
            </p>
          ) : (
            ticket.partUsages.map((part) => (
              <div key={part.id} className="flex items-center justify-between rounded-xl border border-border bg-canvas p-2.5 text-xs">
                <div>
                  <div className="font-bold text-ink">{part.productName}</div>
                  <div className="text-ink-soft">
                    {part.quantity} × {part.unitCostPrice.toFixed(2)} ج.م = <span className="font-bold text-emerald-700">{part.lineTotal.toFixed(2)} ج.م</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(part.id)}
                  className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <hr className="border-border" />

        {/* Add a new part */}
        {!selectedProduct ? (
          <form onSubmit={runSearch} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم / SKU / الباركود..."
                className="w-full rounded-xl border border-border bg-canvas p-2.5 pr-9 text-sm outline-none focus:border-emerald-500"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="w-full rounded-xl bg-canvas border border-border py-2 text-xs font-bold text-ink-soft transition hover:bg-surface cursor-pointer disabled:opacity-50"
            >
              {searching ? <Loader2 size={14} className="mx-auto animate-spin" /> : 'بحث'}
            </button>

            {results.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => pickProduct(product)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-surface p-2 text-right text-xs transition hover:border-emerald-300 cursor-pointer"
                  >
                    <span className="font-bold text-ink">{product.nameAr || product.name}</span>
                    <span className="font-mono text-ink-soft">{product.sku}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink">{selectedProduct.nameAr || selectedProduct.name}</span>
              <button type="button" onClick={() => setSelectedProduct(null)} className="text-rose-600 hover:underline cursor-pointer">
                تغيير
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="text-[11px] font-bold text-ink-soft">
                الكمية
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-[11px] font-bold text-ink-soft">
                المخزن (رقم)
                <input
                  type="number"
                  min="1"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-[11px] font-bold text-ink-soft">
                سعر التكلفة (اختياري)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCostOverride}
                  onChange={(e) => setUnitCostOverride(e.target.value)}
                  placeholder="تلقائي"
                  className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAttach}
              disabled={saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              إضافة للطلب
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
