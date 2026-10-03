// File: src/components/operations/OrderEditModal.jsx
// تعديل طلب كامل من مركز العمليات: الأصناف (كمية/سعر/حذف/إضافة)، الحالة، طريقة الدفع، الخصم، الشحن، والمدفوع.
import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Loader2, Plus, Trash2, Search, Printer, Save, Ban, AlertTriangle } from 'lucide-react'
import { fetchOrderById, updateOrder } from '../../api/ordersAdminApi'
import { searchPosProducts, PRICING_TIER } from '../../api/posApi'
import { printInvoice } from '../../utils/printInvoice'
import {
  normalizeOrder,
  fmtMoney,
  round2,
  isCancelledStatus,
  toPrintableInvoice,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../utils/orders/normalizeOrder'

let lineSeq = 0
const newKey = () => `n${++lineSeq}`

function withCurrent(options, current) {
  if (current === undefined || current === null || current === '') return options
  return options.some((o) => String(o.value) === String(current))
    ? options
    : [{ value: current, label: String(current) }, ...options]
}

export default function OrderEditModal({ orderId, summary, onClose, onSaved, onToast }) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [order, setOrder] = useState(null)
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paid, setPaid] = useState('')
  const [discount, setDiscount] = useState('0')
  const [shipping, setShipping] = useState('0')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [productQuery, setProductQuery] = useState('')
  const [productResults, setProductResults] = useState([])
  const [searching, setSearching] = useState(false)
  const reqRef = useRef(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    fetchOrderById(orderId)
      .then((data) => {
        if (!active) return
        const o = normalizeOrder(data)
        setOrder(o)
        setLines(o.items.map((i) => ({ ...i })))
        setStatus(o.status ?? '')
        setPaymentMethod(o.paymentMethod ?? '')
        setPaid(o.paid === null ? '' : String(o.paid))
        setDiscount(String(o.discount || 0))
        setShipping(String(o.shipping || 0))
      })
      .catch((err) => {
        if (active) setLoadError(err?.response?.data?.message || err?.message || 'تعذر تحميل تفاصيل الطلب')
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [orderId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  // بحث منتج للإضافة
  useEffect(() => {
    const term = productQuery.trim()
    if (!term) {
      setProductResults([])
      return undefined
    }
    const id = ++reqRef.current
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await searchPosProducts({ query: term, tier: PRICING_TIER.RETAIL, pageNumber: 1, pageSize: 8 })
        if (id === reqRef.current) setProductResults(data.items || [])
      } catch {
        if (id === reqRef.current) setProductResults([])
      } finally {
        if (id === reqRef.current) setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productQuery])

  const hadItems = (order?.items?.length || 0) > 0
  const hasLines = lines.length > 0

  // نسبة الضريبة المحفوظة على الطلب الأصلي تتحافظ عند تعديل الأصناف
  const taxRate = useMemo(() => {
    if (!order) return 0
    const base = order.subtotal - order.discount
    return order.tax > 0 && base > 0 ? order.tax / base : 0
  }, [order])

  const subtotal = round2(lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0))
  const discountNum = Math.max(Number(discount) || 0, 0)
  const shippingNum = Math.max(Number(shipping) || 0, 0)
  const tax = round2(Math.max(subtotal - discountNum, 0) * taxRate)
  const total = hasLines ? round2(Math.max(subtotal - discountNum, 0) + tax + shippingNum) : order?.total ?? 0
  const paidNum = Number(paid) || 0
  const remaining = round2(total - paidNum)

  function setLine(key, patch) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function addProduct(p) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id && !l.productVariantId)
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, quantity: Number(l.quantity) + 1 } : l))
      }
      return [
        ...prev,
        { key: newKey(), productId: p.id, productVariantId: null, name: p.nameAr || p.name, quantity: 1, unitPrice: Number(p.sellingPrice) || 0 },
      ]
    })
    setProductQuery('')
    setProductResults([])
  }

  function handlePrint() {
    if (!order) return
    const { invoice, customer } = toPrintableInvoice({
      ...order,
      items: lines,
      subtotal,
      discount: discountNum,
      tax,
      shipping: shippingNum,
      total,
    })
    try {
      printInvoice(invoice, customer, false)
    } catch {
      onToast?.('error', 'تعذرت الطباعة')
    }
  }

  function markCancelled() {
    const opt = ORDER_STATUS_OPTIONS.find((o) => isCancelledStatus(o.value))
    if (opt) setStatus(opt.value)
  }

  async function handleSave() {
    setSaveError('')
    if (hadItems && !hasLines) {
      setSaveError('الطلب بدون أصناف. لإلغاء الطلب غيّر الحالة إلى "ملغي" بدل حذف كل الأصناف.')
      return
    }
    if (lines.some((l) => !(Number(l.quantity) > 0))) {
      setSaveError('الكمية لازم تكون أكبر من صفر في كل الأصناف.')
      return
    }
    if (lines.some((l) => Number(l.unitPrice) < 0) || paidNum < 0) {
      setSaveError('الأسعار والمبلغ المدفوع لا يمكن أن تكون سالبة.')
      return
    }
    const payload = {
      status,
      paymentMethod,
      paidAmount: paidNum,
      discountAmount: discountNum,
      shippingCost: shippingNum,
      ...(hasLines
        ? {
            items: lines.map((l) => ({
              productId: l.productId,
              productVariantId: l.productVariantId || null,
              quantity: Number(l.quantity),
              unitPrice: Number(l.unitPrice),
            })),
          }
        : {}),
    }
    setSaving(true)
    try {
      await updateOrder(orderId, payload)
      onToast?.('ok', 'تم حفظ تعديلات الطلب')
      onSaved?.()
      onClose()
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || 'تعذر حفظ التعديلات')
    } finally {
      setSaving(false)
    }
  }

  const statusOptions = withCurrent(ORDER_STATUS_OPTIONS, order?.status)
  const paymentOptions = withCurrent(PAYMENT_METHOD_OPTIONS, order?.paymentMethod)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-sm sm:p-4" onClick={() => !saving && onClose()}>
      <div
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface shadow-lg sm:max-h-[94vh]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="text-sm font-bold text-ink">
              تعديل الطلب <span className="font-mono" dir="ltr">#{order?.orderNumber ?? summary?.orderNumber ?? orderId}</span>
            </h3>
            {order && (
              <p className="text-[11px] text-ink-soft">
                {order.isPos ? 'طلب محل داخلي' : 'طلب أونلاين'} · {order.customerName || 'عميل نقدي'}
                {order.customerPhone ? ` · ${order.customerPhone}` : ''}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-canvas">
            <X size={15} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> جاري تحميل الطلب...
          </div>
        ) : loadError ? (
          <div className="p-6 text-center text-sm font-bold text-rose-600">{loadError}</div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* الحالة والدفع */}
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-bold text-ink">
                  حالة الطلب
                  <select value={String(status ?? '')} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-canvas p-2 text-sm outline-none focus:border-emerald-500">
                    {statusOptions.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-ink">
                  طريقة الدفع
                  <select value={String(paymentMethod ?? '')} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-canvas p-2 text-sm outline-none focus:border-emerald-500">
                    {paymentOptions.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-ink">
                  المبلغ المدفوع (ج.م)
                  <input type="number" min="0" step="0.01" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded-xl border border-border bg-canvas p-2 text-sm font-mono outline-none focus:border-emerald-500" />
                </label>
              </div>

              {/* الأصناف */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink">أصناف الطلب</h4>
                  <span className="text-[11px] text-ink-soft">{lines.length} صنف</span>
                </div>

                <div className="relative mb-2">
                  <input
                    type="text"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="أضف منتجًا: ابحث بالاسم / SKU / الباركود..."
                    className="w-full rounded-xl border border-border bg-canvas p-2 pr-9 text-sm outline-none focus:border-emerald-500"
                  />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  {(searching || productResults.length > 0) && (
                    <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                      {searching && productResults.length === 0 ? (
                        <div className="flex items-center gap-2 p-3 text-xs text-ink-soft"><Loader2 size={12} className="animate-spin" /> بحث...</div>
                      ) : (
                        productResults.map((p) => (
                          <button key={p.id} type="button" onClick={() => addProduct(p)} className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-right text-xs hover:bg-canvas">
                            <span className="truncate font-bold text-ink">{p.nameAr || p.name}</span>
                            <span className="flex shrink-0 items-center gap-2 font-mono text-ink-soft">
                              {Number(p.sellingPrice || 0).toFixed(2)} <Plus size={12} className="text-emerald-600" />
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {lines.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-ink-soft">
                    {hadItems ? 'تم حذف كل الأصناف.' : 'السيرفر لم يُرجع أصناف هذا الطلب — يمكنك إضافة أصناف أو تعديل الحالة والمدفوع فقط.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-canvas text-ink-soft">
                        <tr>
                          <th className="p-2 font-medium">الصنف</th>
                          <th className="w-24 p-2 font-medium">الكمية</th>
                          <th className="w-28 p-2 font-medium">سعر الوحدة</th>
                          <th className="w-28 p-2 font-medium">الإجمالي</th>
                          <th className="w-10 p-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lines.map((l) => (
                          <tr key={l.key}>
                            <td className="p-2 font-bold text-ink">{l.name}</td>
                            <td className="p-2">
                              <input type="number" min="0" step="any" value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} className="w-full rounded-lg border border-border bg-canvas p-1.5 text-center font-mono outline-none focus:border-emerald-500" />
                            </td>
                            <td className="p-2">
                              <input type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => setLine(l.key, { unitPrice: e.target.value })} className="w-full rounded-lg border border-border bg-canvas p-1.5 text-center font-mono outline-none focus:border-emerald-500" />
                            </td>
                            <td className="p-2 font-mono font-semibold text-ink" dir="ltr">{fmtMoney((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}</td>
                            <td className="p-2">
                              <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600" title="حذف الصنف">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* المبالغ */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-bold text-ink">
                    الخصم (ج.م)
                    <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-canvas p-2 text-sm font-mono outline-none focus:border-emerald-500" />
                  </label>
                  <label className="text-xs font-bold text-ink">
                    الشحن (ج.م)
                    <input type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-canvas p-2 text-sm font-mono outline-none focus:border-emerald-500" />
                  </label>
                </div>
                <div className="space-y-1 rounded-xl border border-border bg-canvas p-3 text-xs">
                  <Row label="المبلغ الجزئي" value={hasLines ? subtotal : order?.subtotal} />
                  {discountNum > 0 && <Row label="الخصم" value={-discountNum} tone="text-rose-600" />}
                  <Row label="الضريبة" value={hasLines ? tax : order?.tax} />
                  {shippingNum > 0 && <Row label="الشحن" value={shippingNum} />}
                  <div className="border-t border-border pt-1"><Row label="الإجمالي" value={total} bold /></div>
                  <Row label="المدفوع" value={paidNum} />
                  <Row label={remaining < 0 ? 'زيادة مدفوعة' : 'المتبقي'} value={Math.abs(remaining)} bold tone={remaining > 0 ? 'text-rose-600' : 'text-emerald-700'} />
                </div>
              </div>

              <p className="flex items-start gap-1.5 text-[11px] text-ink-soft">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-600" />
                الإجمالي هنا تقديري — السيرفر هو من يحسب الإجمالي النهائي ويعدّل رصيد العميل عند الحفظ.
              </p>

              {saveError && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{saveError}</div>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-canvas px-5 py-3">
              <div className="flex gap-2">
                <button type="button" onClick={handlePrint} className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-ink hover:bg-canvas">
                  <Printer size={14} /> طباعة
                </button>
                {!isCancelledStatus(status) && (
                  <button type="button" onClick={markCancelled} className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
                    <Ban size={14} /> إلغاء الطلب
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} disabled={saving} className="cursor-pointer rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-ink hover:bg-canvas">
                  إغلاق
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold, tone = 'text-ink' }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-sm' : ''} ${tone}`}>
      <span className={bold ? '' : 'text-ink-soft'}>{label}</span>
      <span className="font-mono" dir="ltr">{fmtMoney(value)}</span>
    </div>
  )
}