// File: src/components/Purchasing/AddPaymentModal.jsx
import { useState } from 'react'
import { X, ChevronDown, Loader2, CheckCircle2, AlertTriangle, Banknote } from 'lucide-react'
import { createSupplierPayment } from '../../api/purchasingApi'

export default function AddPaymentModal({ supplierId, supplierName, onClose, onSaved }) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!Number(amount) || Number(amount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح أكبر من صفر')
      return
    }

    setSaving(true)
    try {
      await createSupplierPayment(supplierId, {
        supplierId: Number(supplierId), // تم إضافة الـ supplierId هنا بوضوح لتطابق الـ Backend
        amount: Number(amount),
        paymentMethod,
        paymentDate: new Date(paymentDate).toISOString(),
        notes: notes || undefined
      })
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء تسجيل الدفعة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <Banknote size={16} className="text-emerald-600" />
            تسجيل دفعة{supplierName ? ` — ${supplierName}` : ''}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-ink-soft mb-1 block">المبلغ المسدد *</label>
            <input
              type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-mono font-bold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">طريقة الدفع</label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="Cash">كاش</option>
                  <option value="Transfer">تحويل بنكي</option>
                  <option value="Cheque">شيك</option>
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">تاريخ الدفع</label>
              <input
                type="date" value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-soft mb-1 block">ملاحظات (اختياري)</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full resize-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} حفظ الدفعة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}