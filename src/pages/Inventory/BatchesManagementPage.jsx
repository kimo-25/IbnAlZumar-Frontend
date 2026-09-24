// File: src/pages/admin/Inventory/BatchesManagementPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PackagePlus,
  Layers,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Search,
  Warehouse as WarehouseIcon,
  Clock,
  Ban,
  Send,
  X,
  ChevronDown,
} from 'lucide-react'
import {
  getWarehouses,
  getStockLevels,
  getBatches,
  getExpiringBatches,
  receiveBatch,
  consumeBatchFefo,
} from '../../api/inventoryApi'
import { useAuth } from '../../context/AuthContext'
const OPENING_BALANCE_SUPPLIER_ID = 999999

// ⚠ See the note at the top of this response — adjust this to match how your real AuthContext
// exposes granted permission codes (it defaults to "allowed" if it can't tell, so it fails open
// rather than silently hiding every action).
function useHasPermission(code) {
  const auth = useAuth() || {}
  if (typeof auth.hasPermission === 'function') return auth.hasPermission(code)
  if (Array.isArray(auth.permissions)) return auth.permissions.includes(code)
  return true
}

function getBatchStatus(batch) {
  if (batch.isExpired) {
    return { label: 'منتهي الصلاحية', className: 'bg-red-50 text-danger border-red-200', Icon: AlertTriangle }
  }
  if (batch.isDepleted) {
    return { label: 'نفذت الكمية', className: 'bg-gray-100 text-ink-soft border-border', Icon: Ban }
  }
  if (typeof batch.daysUntilExpiry === 'number' && batch.daysUntilExpiry <= 30) {
    return {
      label: `قريب من الانتهاء (${batch.daysUntilExpiry} يوم)`,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      Icon: Clock,
    }
  }
  return { label: 'نشط', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 }
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('ar-EG')
  } catch {
    return value
  }
}

// ------------------------------------------------------------------
// Shared product autocomplete (reuses the existing stock-levels search endpoint —
// no new backend endpoint needed just to pick a product).
// ------------------------------------------------------------------
function ProductAutocomplete({ value, onChange, disabled }) {
  const [query, setQuery] = useState(value?.productName || value?.sku || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleQueryChange(text) {
    setQuery(text)
    onChange(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!text.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const rows = await getStockLevels({ search: text.trim() })
      setResults(rows)
      setSearching(false)
      setOpen(true)
    }, 350)
  }

  function pick(product) {
    onChange(product)
    setQuery(`${product.productName}${product.sku ? ` — ${product.sku}` : ''}`)
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          disabled={disabled}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="ابحث بالاسم أو رقم الصنف (SKU)..."
          className="w-full rounded-xl border border-border bg-surface py-2.5 pr-9 pl-3 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
        />
        {searching && <Loader2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-ink-soft" />}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {results.map((p) => (
            <button
              type="button"
              key={p.productId}
              onClick={() => pick(p)}
              className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-right text-xs last:border-0 hover:bg-canvas"
            >
              <span className="font-bold text-ink">{p.productName}</span>
              <span className="font-mono text-[10px] text-ink-soft">{p.sku}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WarehouseSelect({ warehouses, value, onChange, disabled, placeholder = 'اختر المستودع...' }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
    >
      <option value="">{placeholder}</option>
      {warehouses.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} {w.tierName ? `(${w.tierName})` : ''}
        </option>
      ))}
    </select>
  )
}

// ================================================================
// Near-expiry alert widget
// ================================================================
function ExpiringBatchesWidget({ onViewAll }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const rows = await getExpiringBatches(30)
    setItems(Array.isArray(rows) ? rows : [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-xs text-ink-soft shadow-xs">
        <Loader2 size={14} className="animate-spin" /> جاري فحص الدفعات القريبة من الانتهاء...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 shadow-xs">
        <CheckCircle2 size={15} /> لا توجد دفعات قريبة من الانتهاء خلال الـ 30 يوم القادمة
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-bold text-amber-800">
          <AlertTriangle size={15} />
          {items.length} دفعة قريبة من انتهاء الصلاحية (خلال 30 يوم)
        </h3>
        <button
          onClick={onViewAll}
          className="text-[11px] font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900"
        >
          عرض الكل في قائمة الدفعات
        </button>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 5).map((b) => (
          <div
            key={b.productBatchId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-surface px-3 py-2 text-[11px]"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">{b.productName}</span>
              <span className="font-mono text-ink-soft">دفعة #{b.batchNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-ink-soft">
              <span className="flex items-center gap-1">
                <WarehouseIcon size={11} /> {b.warehouseName}
              </span>
              <span className={`font-bold ${b.isExpired ? 'text-danger' : 'text-amber-700'}`}>
                {b.isExpired ? 'منتهية الصلاحية' : `متبقي ${b.daysUntilExpiry} يوم`}
              </span>
              <span className="font-mono">الكمية: {b.remainingQuantity}</span>
            </div>
          </div>
        ))}
        {items.length > 5 && (
          <p className="pt-1 text-[10px] text-amber-700">و{items.length - 5} دفعة أخرى...</p>
        )}
      </div>
    </div>
  )
}

// ================================================================
// Tab 1: Receive / Register Incoming Batch
// ================================================================
function ReceiveBatchTab({ warehouses, canManageBatches, onReceived }) {
  const emptyForm = {
    product: null,
    warehouseId: '',
    batchNumber: '',
    isOpeningBalance: false,
    supplierId: '',
    productionDate: '',
    expiryDate: '',
    quantity: '',
    costPrice: '',
    notes: '',
  }
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleOpeningBalance(checked) {
    setForm((prev) => ({
      ...prev,
      isOpeningBalance: checked,
      supplierId: checked ? String(OPENING_BALANCE_SUPPLIER_ID) : '',
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBanner(null)

    if (!form.product) {
      setBanner({ type: 'error', message: 'الرجاء اختيار المنتج أولاً' })
      return
    }
    if (!form.warehouseId) {
      setBanner({ type: 'error', message: 'الرجاء اختيار المستودع' })
      return
    }
    if (!form.batchNumber.trim()) {
      setBanner({ type: 'error', message: 'الرجاء إدخال رقم الدفعة' })
      return
    }
    if (!form.expiryDate) {
      setBanner({ type: 'error', message: 'الرجاء إدخال تاريخ انتهاء الصلاحية' })
      return
    }
    const quantity = Number(form.quantity)
    if (!quantity || quantity <= 0) {
      setBanner({ type: 'error', message: 'الكمية يجب أن تكون أكبر من صفر' })
      return
    }

    setSubmitting(true)
    try {
      const dto = {
        productId: form.product.productId,
        warehouseId: Number(form.warehouseId),
        batchNumber: form.batchNumber.trim(),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        productionDate: form.productionDate || null,
        expiryDate: form.expiryDate,
        quantity,
        costPrice: Number(form.costPrice) || 0,
        transactionType: form.isOpeningBalance ? 'Adjustment' : 'PurchaseReceived',
        referenceType: form.isOpeningBalance ? 'OpeningBalance' : null,
        notes: form.notes.trim() || (form.isOpeningBalance ? 'رصيد افتتاحي (مورد أول المدة)' : undefined),
      }

      const result = await receiveBatch(dto)
      setBanner({
        type: 'success',
        message: `تم تسجيل الدفعة #${result.batchNumber} بنجاح (${result.remainingQuantity} وحدة)`,
      })
      setForm(emptyForm)
      onReceived?.()
    } catch (err) {
      setBanner({ type: 'error', message: err?.message || 'حدث خطأ أثناء تسجيل الدفعة' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!canManageBatches) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-xs font-semibold text-ink-soft shadow-xs">
        <Ban size={15} /> لا تملك صلاحية تسجيل أو استقبال الدفعات (Inventory.ManageBatches)
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
      {banner && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-danger'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800">
        <input
          type="checkbox"
          checked={form.isOpeningBalance}
          onChange={(e) => toggleOpeningBalance(e.target.checked)}
          className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
        />
        قيد رصيد افتتاحي (مورد أول المدة) — تسجيل مخزون قديم بدون أمر شراء رسمي
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">المنتج *</label>
          <ProductAutocomplete value={form.product} onChange={(p) => update('product', p)} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">المستودع *</label>
          <WarehouseSelect warehouses={warehouses} value={form.warehouseId} onChange={(v) => update('warehouseId', v)} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">رقم الدفعة *</label>
          <input
            value={form.batchNumber}
            onChange={(e) => update('batchNumber', e.target.value)}
            placeholder="مثال: BN-2026-001"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">
            المورد {form.isOpeningBalance ? '(مورد أول المدة — ثابت)' : '(اختياري)'}
          </label>
          <input
            type="number"
            value={form.supplierId}
            disabled={form.isOpeningBalance}
            onChange={(e) => update('supplierId', e.target.value)}
            placeholder="معرف المورد"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:bg-canvas disabled:opacity-70"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">تاريخ الإنتاج (اختياري)</label>
          <input
            type="date"
            value={form.productionDate}
            onChange={(e) => update('productionDate', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">تاريخ انتهاء الصلاحية *</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => update('expiryDate', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">الكمية *</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => update('quantity', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">سعر التكلفة للوحدة</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.costPrice}
            onChange={(e) => update('costPrice', e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">ملاحظات</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <PackagePlus size={14} />}
          تسجيل الدفعة
        </button>
      </div>
    </form>
  )
}

// ================================================================
// Tab 2: View Stock Batches (FEFO order)
// ================================================================
function ViewBatchesTab({ warehouses }) {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [warehouseId, setWarehouseId] = useState('')
  const [includeDepleted, setIncludeDepleted] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, includeDepleted])

  async function load() {
    setLoading(true)
    const rows = await getBatches({
      warehouseId: warehouseId || undefined,
      includeDepleted,
    })
    setBatches(Array.isArray(rows) ? rows : [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return batches
    const term = search.trim().toLowerCase()
    return batches.filter(
      (b) =>
        (b.productName || '').toLowerCase().includes(term) ||
        (b.sku || '').toLowerCase().includes(term) ||
        (b.batchNumber || '').toLowerCase().includes(term)
    )
  }, [batches, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمنتج أو SKU أو رقم الدفعة..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pr-9 pl-3 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="w-full sm:w-56">
          <WarehouseSelect warehouses={warehouses} value={warehouseId} onChange={setWarehouseId} placeholder="كل المستودعات" />
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-ink-soft">
          <input
            type="checkbox"
            checked={includeDepleted}
            onChange={(e) => setIncludeDepleted(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-emerald-600 focus:ring-emerald-400"
          />
          عرض الدفعات المنتهية الكمية أيضاً
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> جاري تحميل الدفعات...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-soft">لا توجد دفعات مطابقة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-canvas text-[10px] text-ink-soft">
                  <th className="px-4 py-3 text-right font-bold">المنتج</th>
                  <th className="px-4 py-3 text-right font-bold">رقم الدفعة</th>
                  <th className="px-4 py-3 text-right font-bold">المستودع</th>
                  <th className="px-4 py-3 text-right font-bold">تاريخ الانتهاء</th>
                  <th className="px-4 py-3 text-right font-bold">المتبقي / الأصلي</th>
                  <th className="px-4 py-3 text-right font-bold">التكلفة</th>
                  <th className="px-4 py-3 text-right font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const status = getBatchStatus(b)
                  const StatusIcon = status.Icon
                  return (
                    <tr key={b.id} className="border-b border-border/60 transition last:border-0 hover:bg-canvas/50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-ink">{b.productName}</div>
                        <div className="font-mono text-[10px] text-ink-soft">{b.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-ink">{b.batchNumber}</td>
                      <td className="px-4 py-3 text-ink-soft">{b.warehouseName}</td>
                      <td className="px-4 py-3 text-ink-soft">{formatDate(b.expiryDate)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-ink">
                        {b.remainingQuantity} / {b.initialQuantity}
                      </td>
                      <td className="px-4 py-3 font-mono text-ink-soft">{b.costPrice}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>
                          <StatusIcon size={11} /> {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ================================================================
// Quick FEFO consume panel (exercises consumeBatchFefo)
// ================================================================
function FefoConsumePanel({ warehouses, onClose, onConsumed }) {
  const [product, setProduct] = useState(null)
  const [warehouseId, setWarehouseId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [transactionType, setTransactionType] = useState('AdjustmentDecrease')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState(null)
  const [results, setResults] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setBanner(null)
    setResults(null)

    if (!product || !warehouseId || !quantity || Number(quantity) <= 0) {
      setBanner({ type: 'error', message: 'الرجاء اختيار المنتج والمستودع وإدخال كمية صحيحة' })
      return
    }

    setSubmitting(true)
    try {
      const rows = await consumeBatchFefo({
        productId: product.productId,
        warehouseId: Number(warehouseId),
        quantity: Number(quantity),
        transactionType,
        notes: notes.trim() || undefined,
      })
      setResults(rows)
      setBanner({ type: 'success', message: `تم صرف الكمية من ${rows.length} دفعة/دفعات حسب الأقدم صلاحية` })
      onConsumed?.()
    } catch (err) {
      setBanner({ type: 'error', message: err?.message || 'تعذر صرف الكمية المطلوبة' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Send size={16} className="text-emerald-600" /> صرف كمية (FEFO)
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {banner && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
                banner.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-danger'
              }`}
            >
              {banner.type === 'success' ? (
                <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              )}
              <span>{banner.message}</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">المنتج *</label>
            <ProductAutocomplete value={product} onChange={setProduct} />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">المستودع *</label>
            <WarehouseSelect warehouses={warehouses} value={warehouseId} onChange={setWarehouseId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">الكمية *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">نوع الحركة</label>
              <div className="relative">
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="AdjustmentDecrease">تعديل (خصم يدوي)</option>
                  <option value="Sale">بيع</option>
                  <option value="SupplierReturn">مرتجع للمورد</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {results && (
            <div className="space-y-1.5 rounded-xl border border-border bg-canvas p-3">
              <p className="text-[11px] font-bold text-ink-soft">تفاصيل الصرف حسب الأقدم صلاحية:</p>
              {results.map((r) => (
                <div key={r.productBatchId} className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-ink">دفعة #{r.batchNumber}</span>
                  <span className="text-ink-soft">صُرف: {r.quantityConsumed}</span>
                  <span className="text-ink-soft">المتبقي: {r.remainingQuantity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas"
            >
              إغلاق
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              صرف الكمية
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ================================================================
// Page
// ================================================================
export default function BatchesManagementPage() {
  const [tab, setTab] = useState('receive') // 'receive' | 'view'
  const [warehouses, setWarehouses] = useState([])
  const [showFefoPanel, setShowFefoPanel] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const canManageBatches = useHasPermission('Inventory.ManageBatches')

  useEffect(() => {
    getWarehouses().then(setWarehouses)
  }, [])

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Layers className="text-emerald-600" size={24} />
            إدارة الدفعات وتواريخ الصلاحية
          </h1>
          <p className="mt-1 text-xs text-ink-soft">تسجيل الدفعات الواردة، متابعة الصرف حسب الأقدم صلاحية (FEFO)، وتنبيهات انتهاء الصلاحية</p>
        </div>

        {canManageBatches && (
          <button
            onClick={() => setShowFefoPanel(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Send size={14} /> صرف كمية (FEFO)
          </button>
        )}
      </div>

      <ExpiringBatchesWidget key={`widget-${refreshKey}`} onViewAll={() => setTab('view')} />

      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setTab('receive')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'receive' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <PackagePlus size={14} /> استقبال دفعة جديدة
        </button>
        <button
          onClick={() => setTab('view')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'view' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Layers size={14} /> عرض الدفعات الحالية
        </button>
      </div>

      {tab === 'receive' ? (
        <ReceiveBatchTab
          warehouses={warehouses}
          canManageBatches={canManageBatches}
          onReceived={() => setRefreshKey((k) => k + 1)}
        />
      ) : (
        <ViewBatchesTab key={`view-${refreshKey}`} warehouses={warehouses} />
      )}

      {showFefoPanel && (
        <FefoConsumePanel
          warehouses={warehouses}
          onClose={() => setShowFefoPanel(false)}
          onConsumed={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}