// File: src/components/operations/OrdersByDayTab.jsx
// تبويب طلبات يوم محدد: kind="pos" (طلبات المحل الداخلي) أو kind="online" (أونلاين وتوصيل).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, ChevronRight, ChevronLeft, CalendarDays, Inbox } from 'lucide-react'
import { extractList, fetchOrders } from '../../api/ordersAdminApi'
import OrderEditModal from './OrderEditModal'
import { normalizeOrder, fmtMoney, cairoDay, cairoTime, isCancelledStatus } from '../../utils/orders/normalizeOrder'

function shiftDay(day, delta) {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + delta)
  return d.toLocaleDateString('en-CA')
}

const ROWS_PER_PAGE = 50

export default function OrdersByDayTab({ kind, refreshKey = 0, onToast }) {
  const isPos = kind === 'pos'
  const [day, setDay] = useState(() => cairoDay())
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // normalized order summary
  const [reload, setReload] = useState(0)
  const [page, setPage] = useState(1)

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      // Fetch the live order collection; date and order-source filtering stay local because
      // the endpoint contract does not expose a consistent from/to filter across deployments.
      const res = await fetchOrders({}, { signal })
      setAll(extractList(res).map(normalizeOrder))
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED' && err?.name !== 'CanceledError') {
        setError(err?.response?.data?.message || err?.message || 'تعذر تحميل الطلبات')
      }
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load, refreshKey, reload])

  const rows = useMemo(
    () =>
      all
        .filter((o) => o.isPos === isPos && cairoDay(o.createdAt) === day)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [all, isPos, day]
  )

  const stats = useMemo(() => {
    const live = rows.filter((o) => !isCancelledStatus(o.status))
    return {
      sales: live.reduce((sum, o) => sum + o.total, 0),
      collected: live.reduce((sum, o) => sum + (o.paid ?? 0), 0),
      hasPaidData: live.some((o) => o.paid !== null)
    }
  }, [rows])

  const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))
  const visibleRows = useMemo(
    () => rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE),
    [rows, page]
  )

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3">
        <CalendarDays size={16} className="text-emerald-600" />
        <span className="text-xs font-bold text-ink">اليوم:</span>
        <button type="button" onClick={() => setDay((d) => shiftDay(d, -1))} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border hover:bg-canvas" title="اليوم السابق">
          <ChevronRight size={15} />
        </button>
        <input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm font-mono outline-none focus:border-emerald-500" />
        <button type="button" onClick={() => setDay((d) => shiftDay(d, 1))} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border hover:bg-canvas" title="اليوم التالي">
          <ChevronLeft size={15} />
        </button>
        <button type="button" onClick={() => setDay(cairoDay())} className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
          اليوم
        </button>

        <div className="ms-auto flex flex-wrap gap-4 text-xs">
          <Stat label="عدد الطلبات" value={String(rows.length)} />
          <Stat label="إجمالي المبيعات" value={fmtMoney(stats.sales)} />
          {stats.hasPaidData && <Stat label="المحصّل" value={fmtMoney(stats.collected)} />}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-soft"><Loader2 size={16} className="animate-spin" /> جاري تحميل الطلبات...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm font-bold text-rose-700">
          {error}
          <button type="button" onClick={() => setReload((n) => n + 1)} className="ms-3 cursor-pointer underline">إعادة المحاولة</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-14 text-sm text-ink-soft">
          <Inbox size={26} className="text-border" />
          لا توجد {isPos ? 'طلبات محل' : 'طلبات أونلاين'} في هذا اليوم
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-right text-xs">
            <thead className="bg-canvas text-ink-soft">
              <tr>
                <th className="p-3 font-medium">رقم الطلب</th>
                <th className="p-3 font-medium">الوقت</th>
                <th className="p-3 font-medium">العميل</th>
                <th className="p-3 font-medium">الدفع</th>
                <th className="p-3 font-medium">الحالة</th>
                <th className="p-3 font-medium">الإجمالي</th>
                <th className="p-3 font-medium">المدفوع</th>
                <th className="p-3 font-medium">المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map((o) => (
                <tr key={o.id ?? o.orderNumber} onClick={() => setEditing(o)} className="cursor-pointer transition hover:bg-emerald-50/50" title="اضغط لعرض وتعديل الطلب">
                  <td className="p-3 font-mono font-bold text-emerald-700" dir="ltr">#{o.orderNumber}</td>
                  <td className="p-3 text-ink-soft">{cairoTime(o.createdAt)}</td>
                  <td className="p-3 font-bold text-ink">{o.customerName || 'عميل نقدي'}</td>
                  <td className="p-3 text-ink-soft">{o.paymentLabel ?? '—'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isCancelledStatus(o.status) ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {o.statusLabel ?? '—'}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-ink" dir="ltr">{fmtMoney(o.total)}</td>
                  <td className="p-3 font-mono text-ink-soft" dir="ltr">{o.paid === null ? '—' : fmtMoney(o.paid)}</td>
                  <td className={`p-3 font-mono font-semibold ${o.remaining > 0 ? 'text-rose-600' : 'text-ink-soft'}`} dir="ltr">
                    {o.remaining === null ? '—' : fmtMoney(o.remaining)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">السابق</button>
          <span className="font-mono text-ink-soft">{page} / {pageCount}</span>
          <button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">التالي</button>
        </div>
      )}

      {editing && (
        <OrderEditModal
          orderId={editing.id}
          summary={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setReload((n) => n + 1)}
          onToast={onToast}
        />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] text-ink-soft">{label}</div>
      <div className="font-mono text-sm font-bold text-ink" dir="ltr">{value}</div>
    </div>
  )
}