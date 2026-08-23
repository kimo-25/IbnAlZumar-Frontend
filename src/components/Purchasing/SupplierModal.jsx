// File: src/components/Purchasing/SupplierModal.jsx
import { useState } from 'react'
import { X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createSupplier, updateSupplier } from '../../api/purchasingApi'

export default function SupplierModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: supplier?.name || '',
    contactPerson: supplier?.contactPerson || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    taxId: supplier?.taxId || '',
    currentBalance: supplier?.currentBalance ?? 0
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('اسم المورد مطلوب')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (supplier) {
        await updateSupplier(supplier.id, form)
      } else {
        const { currentBalance, ...createPayload } = form
        await createSupplier(createPayload)
      }
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-bold text-ink">{supplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-ink-soft mb-1 block">اسم المورد *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">جهة الاتصال</label>
              <input value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">الهاتف</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">البريد الإلكتروني</label>
              <input value={form.email} onChange={(e) => set('email', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">الرقم الضريبي</label>
              <input value={form.taxId} onChange={(e) => set('taxId', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-ink-soft mb-1 block">العنوان</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          {supplier && (
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">الرصيد المستحق للمورد</label>
              <input type="number" step="0.01" value={form.currentBalance} onChange={(e) => set('currentBalance', Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-mono font-bold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}