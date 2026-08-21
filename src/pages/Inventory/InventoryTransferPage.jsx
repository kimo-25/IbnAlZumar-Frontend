// File: src/pages/Inventory/InventoryTransferPage.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Search,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  ChevronDown,
  PackagePlus
} from 'lucide-react'
import { getWarehouses, getStockLevels, transferStock } from '../../api/inventoryApi'

export default function InventoryTransferPage() {
  const [warehouses, setWarehouses] = useState([])
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [notes, setNotes] = useState('')

  const [sourceStock, setSourceStock] = useState([])
  const [stockLoading, setStockLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [lines, setLines] = useState([]) // { productId, sku, name, available, quantity }

  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    getWarehouses().then((data) => {
      setWarehouses(data)
      if (data.length > 0) setFromWarehouseId(String(data[0].id))
      if (data.length > 1) setToWarehouseId(String(data[1].id))
    })
  }, [])

  useEffect(() => {
    if (!fromWarehouseId) return
    setStockLoading(true)
    const timeout = setTimeout(() => {
      getStockLevels({ warehouseId: fromWarehouseId, search }).then((data) => {
        setSourceStock(data.filter((s) => s.quantityOnHand > 0))
        setStockLoading(false)
      })
    }, 250)
    return () => clearTimeout(timeout)
  }, [fromWarehouseId, search])

  useEffect(() => {
    setLines([])
    setBanner(null)
  }, [fromWarehouseId, toWarehouseId])

  const sameWarehouse = fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId

  function addLine(product) {
    setShowDropdown(false)
    setSearch('')
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.productId)) return prev
      return [...prev, {
        productId: product.productId,
        sku: product.sku,
        name: product.productNameAr || product.productName,
        available: product.quantityOnHand,
        quantity: 1
      }]
    })
  }

  function updateLineQuantity(productId, value) {
    setLines((prev) => prev.map((l) => l.productId === productId ? { ...l, quantity: value } : l))
  }

  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const hasInvalidLine = useMemo(() => {
    return lines.some((l) => {
      const q = parseInt(l.quantity, 10)
      return !Number.isFinite(q) || q <= 0 || q > l.available
    })
  }, [lines])

  async function handleSubmit(e) {
    e.preventDefault()
    setBanner(null)
    setLastResult(null)

    if (sameWarehouse) {
      setBanner({ type: 'error', message: 'يجب اختيار مستودعين مختلفين للمصدر والوجهة' })
      return
    }
    if (lines.length === 0) {
      setBanner({ type: 'error', message: 'أضف صنفاً واحداً على الأقل للتحويل' })
      return
    }
    if (hasInvalidLine) {
      setBanner({ type: 'error', message: 'تحقق من الكميات المدخلة، يجب ألا تتجاوز الكمية المتاحة في المصدر' })
      return
    }

    setSubmitting(true)
    try {
      const result = await transferStock({
        fromWarehouseId: Number(fromWarehouseId),
        toWarehouseId: Number(toWarehouseId),
        notes: notes || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: parseInt(l.quantity, 10) }))
      })
      setLastResult(result)
      setBanner({ type: 'success', message: `تم تنفيذ التحويل رقم #${result.stockTransferId} بنجاح وتحديث أرصدة المستودعين.` })
      setLines([])
      setNotes('')
      getStockLevels({ warehouseId: fromWarehouseId, search: '' }).then((data) => setSourceStock(data.filter((s) => s.quantityOnHand > 0)))
    } catch (err) {
      const message = err?.response?.data?.message || 'حدث خطأ أثناء تنفيذ عملية التحويل'
      setBanner({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <ArrowLeftRight className="text-emerald-600" size={24} />
          نقل المخزون بين المستودعات
        </h1>
        <p className="text-xs text-ink-soft mt-1">
          تحويل كميات صنف أو أكثر من مستودع مصدر إلى مستودع مستقبل، مع تحديث الأرصدة فوراً وتسجيل الحركة
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* اختيار المستودعات */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <WarehouseIcon size={13} /> من مستودع (المصدر)
                </label>
                <div className="relative">
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <WarehouseIcon size={13} /> إلى مستودع (الوجهة)
                </label>
                <div className="relative">
                  <select
                    value={toWarehouseId}
                    onChange={(e) => setToWarehouseId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
                </div>
              </div>
            </div>
            {sameWarehouse && (
              <p className="mt-3 text-[11px] font-semibold text-danger flex items-center gap-1.5">
                <AlertTriangle size={13} /> يجب اختيار مستودعين مختلفين
              </p>
            )}
          </div>

          {/* إضافة أصناف */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <PackagePlus size={16} className="text-emerald-600" /> إضافة أصناف للتحويل
            </h3>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                placeholder="ابحث عن منتج متاح في المستودع المصدر..."
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              {showDropdown && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                  {stockLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 text-xs text-ink-soft">
                      <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                    </div>
                  ) : sourceStock.length === 0 ? (
                    <div className="p-4 text-center text-xs text-ink-soft">لا توجد أصناف متاحة بهذا المستودع</div>
                  ) : (
                    sourceStock.map((p) => (
                      <button
                        type="button"
                        key={p.productId}
                        onClick={() => addLine(p)}
                        disabled={lines.some((l) => l.productId === p.productId)}
                        className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-right text-xs last:border-0 hover:bg-canvas transition disabled:opacity-40"
                      >
                        <div>
                          <div className="font-bold text-ink">{p.productNameAr || p.productName}</div>
                          <div className="text-[10px] text-ink-soft font-mono">{p.sku}</div>
                        </div>
                        <span className="font-mono font-bold text-ink-soft">{p.quantityOnHand} وحدة</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-ink-soft">
                  لم يتم إضافة أي أصناف بعد
                </div>
              ) : (
                lines.map((l) => {
                  const q = parseInt(l.quantity, 10)
                  const invalid = !Number.isFinite(q) || q <= 0 || q > l.available
                  return (
                    <div key={l.productId} className="flex items-center gap-3 rounded-xl border border-border bg-canvas p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-ink truncate">{l.name}</div>
                        <div className="text-[10px] text-ink-soft font-mono">{l.sku} · متاح: {l.available}</div>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={l.available}
                        value={l.quantity}
                        onChange={(e) => updateLineQuantity(l.productId, e.target.value)}
                        className={`w-20 rounded-lg border px-2 py-1.5 text-xs font-mono font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                          invalid ? 'border-danger text-danger' : 'border-border text-ink'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(l.productId)}
                        className="rounded-lg p-1.5 text-ink-soft hover:bg-red-50 hover:text-danger transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <label className="text-xs font-bold text-ink-soft mb-1.5 block">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="سبب التحويل أو أي تفاصيل إضافية..."
              className="w-full resize-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {/* ملخص وتأكيد */}
        <div className="space-y-4 h-fit">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-emerald-600" /> ملخص التحويل
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">عدد الأصناف</span>
                <span className="font-mono font-bold text-ink">{lines.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">إجمالي الوحدات</span>
                <span className="font-mono font-bold text-ink">
                  {lines.reduce((sum, l) => sum + (parseInt(l.quantity, 10) || 0), 0)}
                </span>
              </div>
            </div>

            {banner && (
              <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
                banner.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-danger'
              }`}>
                {banner.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
                <span>{banner.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || lines.length === 0}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              تأكيد النقل
            </button>
          </div>

          {lastResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h4 className="text-xs font-bold text-emerald-800 mb-2">آخر عملية تحويل ناجحة</h4>
              <p className="text-[11px] text-emerald-700 mb-2">
                من {lastResult.sourceWarehouseName} إلى {lastResult.destinationWarehouseName}
              </p>
              <ul className="space-y-1">
                {lastResult.items.map((it) => (
                  <li key={it.productId} className="flex items-center justify-between text-[11px] text-emerald-800">
                    <span>{it.productName}</span>
                    <span className="font-mono font-bold">{it.quantity} وحدة</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
