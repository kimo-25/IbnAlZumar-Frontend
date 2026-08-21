// File: src/pages/Inventory/InventoryAdjustPage.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  SlidersHorizontal,
  Search,
  Plus,
  Minus,
  PackageSearch,
  History,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Warehouse as WarehouseIcon,
  ChevronDown
} from 'lucide-react'
import { getWarehouses, getStockLevels, getTransactionHistory, adjustStock } from '../../api/inventoryApi'

const REASONS = [
  { value: 'Damaged', label: 'تالف' },
  { value: 'Spoiled', label: 'هالك' },
  { value: 'StockCount', label: 'جرد سنوي' },
  { value: 'DataEntryError', label: 'خطأ إدخال' },
  { value: 'Other', label: 'أخرى' }
]

const TX_TYPE_LABELS = {
  Adjustment: { label: 'تعديل يدوي', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Purchase: { label: 'استلام توريد', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TransferIn: { label: 'تحويل وارد', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  TransferOut: { label: 'تحويل صادر', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  Sale: { label: 'بيع', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  Return: { label: 'مرتجع', className: 'bg-purple-50 text-purple-700 border-purple-200' }
}

function TxBadge({ type }) {
  const meta = TX_TYPE_LABELS[type] || { label: type, className: 'bg-surface text-ink-soft border-border' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  )
}

export default function InventoryAdjustPage() {
  const [warehouses, setWarehouses] = useState([])
  const [warehouseId, setWarehouseId] = useState('')

  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [direction, setDirection] = useState('in') // 'in' | 'out'
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState(REASONS[0].value)
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState(null) // { type: 'success' | 'error', message }

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    getWarehouses().then((data) => {
      setWarehouses(data)
      if (data.length > 0) setWarehouseId(String(data[0].id))
    })
  }, [])

  useEffect(() => {
    refreshHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId])

  useEffect(() => {
    if (!warehouseId) return
    setProductsLoading(true)
    const timeout = setTimeout(() => {
      getStockLevels({ warehouseId, search }).then((data) => {
        setProducts(data)
        setProductsLoading(false)
      })
    }, 250)
    return () => clearTimeout(timeout)
  }, [warehouseId, search])

  async function refreshHistory() {
    setHistoryLoading(true)
    const data = await getTransactionHistory({ warehouseId: warehouseId || undefined, take: 60 })
    setHistory(data)
    setHistoryLoading(false)
  }

  function selectProduct(product) {
    setSelectedProduct(product)
    setSearch(`${product.productName}${product.productNameAr ? ' — ' + product.productNameAr : ''}`)
    setShowDropdown(false)
  }

  const parsedQuantity = useMemo(() => {
    const n = parseInt(quantity, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [quantity])

  const resultingStock = useMemo(() => {
    if (!selectedProduct || !parsedQuantity) return null
    const delta = direction === 'in' ? parsedQuantity : -parsedQuantity
    return selectedProduct.quantityOnHand + delta
  }, [selectedProduct, parsedQuantity, direction])

  async function handleSubmit(e) {
    e.preventDefault()
    setBanner(null)

    if (!selectedProduct) {
      setBanner({ type: 'error', message: 'يرجى اختيار منتج أولاً من نتائج البحث' })
      return
    }
    if (!parsedQuantity) {
      setBanner({ type: 'error', message: 'يرجى إدخال كمية صحيحة أكبر من صفر' })
      return
    }

    setSubmitting(true)
    try {
      const quantityChange = direction === 'in' ? parsedQuantity : -parsedQuantity
      const result = await adjustStock({
        productId: selectedProduct.productId,
        warehouseId: Number(warehouseId),
        quantityChange,
        reason,
        notes: notes || undefined
      })
      setBanner({
        type: 'success',
        message: `تم تسجيل التعديل بنجاح. الرصيد الجديد لـ "${result.productName}": ${result.resultingQuantityOnHand} وحدة.`
      })
      setQuantity('')
      setNotes('')
      setSelectedProduct(null)
      setSearch('')
      getStockLevels({ warehouseId, search: '' }).then(setProducts)
      refreshHistory()
    } catch (err) {
      const message = err?.response?.data?.message || 'حدث خطأ أثناء تسجيل التعديل، حاول مرة أخرى'
      setBanner({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <SlidersHorizontal className="text-emerald-600" size={24} />
          تسوية المخزون
        </h1>
        <p className="text-xs text-ink-soft mt-1">
          تعديل يدوي لكمية صنف معين داخل مستودع محدد، مع تسجيل كل عملية في سجل الحركة للمراجعة لاحقاً
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* نموذج التعديل */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-5 h-fit">
          <div>
            <label className="text-xs font-bold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <WarehouseIcon size={13} /> المستودع
            </label>
            <div className="relative">
              <select
                value={warehouseId}
                onChange={(e) => { setWarehouseId(e.target.value); setSelectedProduct(null); setSearch('') }}
                className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}{w.isMainWarehouse ? ' (رئيسي)' : ''}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <PackageSearch size={13} /> المنتج
            </label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedProduct(null); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                placeholder="ابحث بالاسم أو SKU..."
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            {showDropdown && search && !selectedProduct && (
              <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                {productsLoading ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-xs text-ink-soft">
                    <Loader2 size={14} className="animate-spin" /> جاري البحث...
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-4 text-center text-xs text-ink-soft">لا توجد نتائج مطابقة</div>
                ) : (
                  products.map((p) => (
                    <button
                      type="button"
                      key={p.productId}
                      onClick={() => selectProduct(p)}
                      className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-right text-xs last:border-0 hover:bg-canvas transition"
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

          {selectedProduct && (
            <div className="rounded-xl bg-canvas border border-border p-3 text-xs flex items-center justify-between">
              <span className="text-ink-soft">الرصيد الحالي</span>
              <span className="font-mono font-bold text-ink">{selectedProduct.quantityOnHand} وحدة</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-ink-soft mb-1.5 block">نوع الحركة</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('in')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                  direction === 'in' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-border bg-canvas text-ink-soft'
                }`}
              >
                <Plus size={14} /> إضافة كمية
              </button>
              <button
                type="button"
                onClick={() => setDirection('out')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                  direction === 'out' ? 'border-danger bg-red-50 text-danger' : 'border-border bg-canvas text-ink-soft'
                }`}
              >
                <Minus size={14} /> خصم كمية
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-soft mb-1.5 block">الكمية</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-sm font-mono font-bold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {resultingStock !== null && (
              <p className={`mt-1.5 text-[11px] font-semibold ${resultingStock < 0 ? 'text-danger' : 'text-ink-soft'}`}>
                الرصيد بعد التعديل: <span className="font-mono">{resultingStock}</span> وحدة
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-ink-soft mb-1.5 block">السبب</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-soft mb-1.5 block">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="تفاصيل إضافية عن سبب التعديل..."
              className="w-full resize-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {banner && (
            <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
              banner.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-danger'
            }`}>
              {banner.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
              <span>{banner.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            تأكيد تسوية المخزون
          </button>
        </form>

        {/* سجل الحركة */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <h3 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
            <History size={16} className="text-emerald-600" /> سجل حركات المخزون الأخيرة
          </h3>

          {historyLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink-soft">
              <Loader2 size={16} className="animate-spin" /> جاري تحميل السجل...
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-soft">لا توجد حركات مسجلة بعد</div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-ink-soft border-b border-border">
                    <th className="px-2 py-2 text-right font-bold">المنتج</th>
                    <th className="px-2 py-2 text-right font-bold">المستودع</th>
                    <th className="px-2 py-2 text-right font-bold">النوع</th>
                    <th className="px-2 py-2 text-right font-bold">الكمية</th>
                    <th className="px-2 py-2 text-right font-bold">ملاحظات</th>
                    <th className="px-2 py-2 text-right font-bold">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-canvas/50 transition">
                      <td className="px-2 py-2.5">
                        <div className="font-bold text-ink">{t.productNameAr || t.productName}</div>
                        <div className="text-[10px] text-ink-soft font-mono">{t.sku}</div>
                      </td>
                      <td className="px-2 py-2.5 text-ink-soft">{t.warehouseName}</td>
                      <td className="px-2 py-2.5"><TxBadge type={t.transactionType} /></td>
                      <td className={`px-2 py-2.5 font-mono font-bold ${t.quantityChange >= 0 ? 'text-emerald-600' : 'text-danger'}`}>
                        {t.quantityChange >= 0 ? '+' : ''}{t.quantityChange}
                      </td>
                      <td className="px-2 py-2.5 text-ink-soft max-w-[180px] truncate">{t.notes || '—'}</td>
                      <td className="px-2 py-2.5 text-ink-soft whitespace-nowrap">
                        {new Date(t.transactionDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
