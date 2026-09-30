// File: src/pages/Debt/DebtDashboardPage.jsx
import { useEffect, useState } from 'react'
import { Wallet, Send, Loader2, AlertCircle, RefreshCw, Phone, Mail } from 'lucide-react'
import { getDebtDashboard, sendDebtReminderNow } from '../../api/debtApi'

function daysUntil(dateString) {
  if (!dateString) return null
  const diffMs = new Date(dateString).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export default function DebtDashboardPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    try {
      const data = await getDebtDashboard({ pageNumber: page, pageSize: 30 })
      setCustomers(data.items || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err?.message || 'تعذر تحميل لوحة المديونيات.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendNow(customerId) {
    setSendingId(customerId)
    setError(null)
    try {
      const updated = await sendDebtReminderNow(customerId)
      setCustomers((prev) => prev.map((c) => (c.customerId === customerId ? { ...c, ...updated } : c)))
    } catch (err) {
      setError(err?.message || 'تعذر إرسال التنبيه.')
    } finally {
      setSendingId(null)
    }
  }

  const totalOutstanding = customers.reduce((sum, c) => sum + c.currentBalance, 0)

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6" dir="rtl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-black text-ink text-lg">
          <Wallet size={20} className="text-rose-600" />
          متابعة المديونيات
        </h1>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
            إجمالي المستحق (الصفحة الحالية): <span className="font-mono">{totalOutstanding.toFixed(2)} ج.م</span>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-xl border border-border bg-surface p-2 text-ink-soft transition hover:bg-canvas cursor-pointer"
            title="تحديث"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-canvas font-semibold text-ink-soft">
                <tr>
                  <th className="p-3">العميل</th>
                  <th className="p-3">التواصل</th>
                  <th className="p-3">الرصيد المستحق</th>
                  <th className="p-3">حد الائتمان</th>
                  <th className="p-3">آخر دفعة</th>
                  <th className="p-3">التذكير القادم</th>
                  <th className="p-3">عدد التذكيرات</th>
                  <th className="p-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-ink-soft">
                      لا توجد مديونيات مستحقة حالياً 🎉
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const remaining = daysUntil(customer.nextReminderDueAt)
                    const isOverdue = remaining !== null && remaining < 0
                    return (
                      <tr key={customer.customerId} className="transition hover:bg-canvas/50">
                        <td className="p-3 font-bold text-ink">{customer.customerName}</td>
                        <td className="p-3 text-ink-soft">
                          <div className="flex flex-col gap-0.5">
                            {customer.customerPhone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} /> {customer.customerPhone}
                              </span>
                            )}
                            {customer.customerEmail && (
                              <span className="flex items-center gap-1">
                                <Mail size={11} /> {customer.customerEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-rose-600">{customer.currentBalance.toFixed(2)} ج.م</td>
                        <td className="p-3 font-mono text-ink-soft">{customer.creditLimit.toFixed(2)} ج.م</td>
                        <td className="p-3 text-ink-soft">
                          {customer.lastPaymentDate ? new Date(customer.lastPaymentDate).toLocaleDateString('ar-EG') : 'لا يوجد'}
                        </td>
                        <td className="p-3">
                          {customer.nextReminderDueAt ? (
                            <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-ink-soft'}`}>
                              {isOverdue ? 'متأخر' : `بعد ${remaining} يوم`}
                            </span>
                          ) : (
                            <span className="text-ink-soft">غير مجدول</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-ink-soft">{customer.reminderCount}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSendNow(customer.customerId)}
                            disabled={sendingId === customer.customerId}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                          >
                            {sendingId === customer.customerId ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            إرسال تنبيه الآن
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-40 hover:bg-canvas transition cursor-pointer"
          >
            السابق
          </button>
          <span className="text-xs font-bold text-ink-soft">صفحة {page} من {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-40 hover:bg-canvas transition cursor-pointer"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}
