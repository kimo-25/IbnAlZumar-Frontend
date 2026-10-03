// File: src/components/customers/CustomerOrderPanel.jsx
// لوحة تفاصيل طلب العميل: المنتجات، المبالغ، المدفوع، المتبقي — مع تعديل المبلغ المدفوع وحفظه عبر الـ API.
import { useEffect, useState } from 'react'
import { X, Loader2, Save, Receipt } from 'lucide-react'
import { fetchOrderById, updateOrderPayment } from '../../api/ordersAdminApi'
import { normalizeOrder, fmtMoney, round2, cairoDay, cairoTime } from '../../utils/orders/normalizeOrder'

export default function CustomerOrderPanel({ order: summaryRaw, onClose, onPaymentSaved }) {
  const summary = normalizeOrder(summaryRaw)
  const [order, setOrder] = useState(summary)
  const [loading, setLoading] = useState(true)
  const [detailError, setDetailError] = useState('')
  const [paid, setPaid] = useState(summary.paid === null ? '' : String(summary.paid))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setDetailError('')
    fetchOrderById(summary.id)
      .then((data) => {
        if (!active) return
        const o = normalizeOrder(data)
        // لو التفاصيل ما فيهاش مدفوع/أصناف نحتفظ بما جاء من القائمة
        const merged = {
          ...summary,
          ...o,
          paid: o.paid ?? summary.paid,
          items: o.items.length ? o.items : summary.items,
          customerName: o.customerName || summary.customerName,
        }
        merged.remaining = merged.paid !== null ? round2(merged.total - merged.paid) : null
        setOrder(merged)
        setPaid(merged.paid === null ? '' : String(merged.paid))
      })
      .catch(() => active && setDetailError('تعذر تحميل أصناف الطلب — المبالغ المعروضة من سجل الطلبات.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const oldPaid = order.paid ?? 0
  const newPaid = Number(paid)
  const validPaid = paid !== '' && Number.isFinite(newPaid) && newPaid >= 0
  const previewRemaining = validPaid ? round2(order.total - newPaid) : order.remaining
  const delta = validPaid ? round2(newPaid - oldPaid) : 0
  const changed = validPaid && delta !== 0

  async function handleSave() {
    if (!validPaid) {
      setError('أدخل مبلغًا مدفوعًا صحيحًا (صفر أو أكثر).')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateOrderPayment(order.id, newPaid)
      const remaining = round2(order.total - newPaid)
      setOrder((o) => ({ ...o, paid: newPaid, remaining }))
      await onPaymentSaved?.({ orderId: order.id, paid: newPaid, remaining, delta })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر حفظ المبلغ المدفوع')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-ink/40 backdrop-blur-sm" onClick={() => !saving && onClose()}>
      <aside
        className="flex h-full w-full max-w-md flex-col overflow-hidden bg-surface shadow-lg"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Receipt size={15} className="text-emerald-600" />
              تفاصيل الطلب <span className="font-mono" dir="ltr">#{order.orderNumber}</span>
            </h3>
            <p className="text-[11px] text-ink-soft">
              {order.createdAt ? `${cairoDay(order.createdAt)} · ${cairoTime(order.createdAt)}` : '—'}
              {order.paymentLabel ? ` · ${order.paymentLabel}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft hover:bg-canvas">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-ink-soft"><Loader2 size={14} className="animate-spin" /> جاري تحميل الأصناف...</div>
          ) : detailError ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">{detailError}</div>
          ) : null}

          <div>
            <h4 className="mb-2 text-xs font-bold text-ink">المنتجات</h4>
            {order.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-ink-soft">لا توجد أصناف متاحة لهذا الطلب</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-right text-xs">
                  <thead className="bg-canvas text-ink-soft">
                    <tr>
                      <th className="p-2 font-medium">الصنف</th>
                      <th className="p-2 font-medium">الكمية</th>
                      <th className="p-2 font-medium">السعر</th>
                      <th className="p-2 font-medium">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((it) => (
                      <tr key={it.key}>
                        <td className="p-2 font-bold text-ink">{it.name}</td>
                        <td className="p-2 font-mono">{it.quantity}</td>
                        <td className="p-2 font-mono" dir="ltr">{it.unitPrice.toFixed(2)}</td>
                        <td className="p-2 font-mono font-semibold" dir="ltr">{(it.quantity * it.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-1 rounded-xl border border-border bg-canvas p-3 text-xs">
            <Line label="المبلغ الجزئي" value={order.subtotal} />
            {order.discount > 0 && <Line label="الخصم" value={-order.discount} tone="text-rose-600" />}
            {order.tax > 0 && <Line label="الضريبة" value={order.tax} />}
            {order.shipping > 0 && <Line label="الشحن" value={order.shipping} />}
            <div className="border-t border-border pt-1"><Line label="إجمالي الطلب" value={order.total} bold /></div>
            <Line label="المدفوع" value={validPaid ? newPaid : order.paid ?? 0} />
            <Line
              label={previewRemaining !== null && previewRemaining < 0 ? 'زيادة مدفوعة' : 'الباقي (مديونية الطلب)'}
              value={previewRemaining === null ? 0 : Math.abs(previewRemaining)}
              bold
              tone={previewRemaining > 0 ? 'text-rose-600' : 'text-emerald-700'}
            />
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
            <label className="block text-xs font-bold text-ink">
              تعديل المبلغ المدفوع (ج.م)
              <input
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && changed && !saving && handleSave()}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-border bg-surface p-2.5 text-center font-mono text-lg font-bold outline-none focus:border-emerald-500"
              />
            </label>
            {changed && (
              <p className="mt-2 text-[11px] font-bold text-ink-soft">
                الفرق {delta > 0 ? '+' : ''}{fmtMoney(delta)} — {delta > 0 ? 'المديونية على العميل هتقل' : 'المديونية على العميل هتزيد'} بنفس المبلغ.
              </p>
            )}
            {error && <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</div>}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !changed}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'جاري الحفظ...' : 'حفظ المبلغ المدفوع'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Line({ label, value, bold, tone = 'text-ink' }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-sm font-bold' : ''} ${tone}`}>
      <span className={bold ? '' : 'text-ink-soft'}>{label}</span>
      <span className="font-mono" dir="ltr">{fmtMoney(value)}</span>
    </div>
  )
}