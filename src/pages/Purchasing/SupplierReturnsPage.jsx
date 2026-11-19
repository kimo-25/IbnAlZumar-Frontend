import { useEffect, useState } from 'react'
import { Check, Eye, Loader2, Plus, Search, X } from 'lucide-react'
import {
  acceptSupplierReturn,
  createSupplierReturn,
  getSupplierReturn,
  getSupplierReturns,
  getSuppliers,
  rejectSupplierReturn,
} from '../../api/purchasingApi'
import { formatCurrency } from '../../utils/catalog'
import { useAuth } from '../../context/AuthContext'

const emptyItem = { productId: '', productVariantId: '', quantity: 1, unitCost: 0 }

function unwrapList(data) {
  return Array.isArray(data) ? data : data?.items || data?.data || data?.Items || []
}

export default function SupplierReturnsPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('SupplierReturns.Create')
  const canResolve = hasPermission('SupplierReturns.Resolve')
  const [returns, setReturns] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [filters, setFilters] = useState({ pageNumber: 1, pageSize: 20, status: '', supplierId: '', reason: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ supplierId: '', warehouseId: '', purchaseOrderId: '', reason: '', notes: '', items: [{ ...emptyItem }] })
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await getSupplierReturns(filters)
      setReturns(unwrapList(data))
    } catch (error) {
      setMessage(error?.response?.data?.message || 'تعذر تحميل مرتجعات الموردين')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters.pageNumber, filters.status, filters.supplierId])
  useEffect(() => { getSuppliers().then(setSuppliers).catch(() => setSuppliers([])) }, [])

  function updateItem(index, patch) {
    setForm((prev) => ({ ...prev, items: prev.items.map((item, i) => i === index ? { ...item, ...patch } : item) }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setMessage('')
    try {
      await createSupplierReturn({
        ...form,
        supplierId: Number(form.supplierId),
        warehouseId: Number(form.warehouseId),
        purchaseOrderId: form.purchaseOrderId ? Number(form.purchaseOrderId) : null,
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          productVariantId: item.productVariantId ? Number(item.productVariantId) : null,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      })
      setFormOpen(false); setForm({ supplierId: '', warehouseId: '', purchaseOrderId: '', reason: '', notes: '', items: [{ ...emptyItem }] })
      await load()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'تعذر إنشاء المرتجع')
    } finally { setSaving(false) }
  }

  async function openDetail(id) {
    try { setDetail(await getSupplierReturn(id)) } catch (error) { setMessage(error?.response?.data?.message || 'تعذر تحميل التفاصيل') }
  }

  async function resolve(action) {
    if (!detail) return
    const notes = window.prompt('ملاحظات القرار (اختياري):', '') ?? ''
    try {
      await action(detail.id, notes)
      setDetail(await getSupplierReturn(detail.id))
      await load()
    } catch (error) { setMessage(error?.response?.data?.message || 'تعذر تنفيذ القرار') }
  }

  const total = (detail?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0), 0)

  return (
    <div className="space-y-5 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div><h1 className="text-2xl font-bold text-ink">مرتجعات الموردين</h1><p className="mt-1 text-xs text-ink-soft">إدارة المرتجعات تحت الفحص وقرارات القبول والرفض</p></div>
        {canCreate && <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white"><Plus size={14} /> مرتجع جديد</button>}
      </div>
      {message && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">{message}</div>}
      <div className="flex flex-wrap gap-2">
        <div className="relative"><Search size={14} className="absolute right-3 top-2.5 text-ink-soft" /><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, pageNumber: 1 })} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="بحث برقم المرتجع..." className="rounded-xl border border-border bg-surface py-2 pr-9 pl-3 text-xs" /></div>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, pageNumber: 1 })} className="rounded-xl border border-border bg-surface px-3 text-xs"><option value="">كل الحالات</option><option value="UnderInspection">تحت الفحص</option><option value="Accepted">مقبول</option><option value="Rejected">مرفوض</option></select>
        <select value={filters.supplierId} onChange={(e) => setFilters({ ...filters, supplierId: e.target.value, pageNumber: 1 })} className="rounded-xl border border-border bg-surface px-3 text-xs"><option value="">كل الموردين</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div> : (
          <table className="w-full text-xs"><thead className="bg-canvas text-ink-soft"><tr><th className="p-3 text-right">رقم المرتجع</th><th className="p-3 text-right">إذن الاستلام</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الإجمالي</th><th className="p-3"></th></tr></thead>
            <tbody>{returns.map((item) => <tr key={item.id} className="border-t border-border"><td className="p-3 font-mono font-bold">{item.returnNumber || item.id}</td><td className="p-3">{item.receiptPermitNumber || '—'}</td><td className="p-3">{item.status || 'UnderInspection'}</td><td className="p-3 font-mono">{formatCurrency(item.totalAmount ?? item.total ?? 0)}</td><td className="p-3 text-left"><button onClick={() => openDetail(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-bold"><Eye size={12} /> تفاصيل</button></td></tr>)}</tbody>
          </table>
        )}
      </div>
      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submit} className="w-full max-w-2xl space-y-4 rounded-2xl bg-surface p-6" dir="rtl"><div className="flex justify-between"><h2 className="font-bold">إنشاء مرتجع مورد</h2><button type="button" onClick={() => setFormOpen(false)}><X size={18} /></button></div><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">المورد<select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="mt-1 w-full rounded-lg border border-border p-2"><option value="">اختر المورد</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="text-xs font-bold">المستودع<input required type="number" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="mt-1 w-full rounded-lg border border-border p-2" /></label><label className="text-xs font-bold">أمر الشراء<input type="number" value={form.purchaseOrderId} onChange={(e) => setForm({ ...form, purchaseOrderId: e.target.value })} className="mt-1 w-full rounded-lg border border-border p-2" /></label><label className="text-xs font-bold">السبب<input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="mt-1 w-full rounded-lg border border-border p-2" /></label></div><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" className="w-full rounded-lg border border-border p-2 text-xs" /><div className="space-y-2"><p className="text-xs font-bold">الأصناف</p>{form.items.map((item, i) => <div key={i} className="grid grid-cols-4 gap-2"><input required type="number" placeholder="Product ID" value={item.productId} onChange={(e) => updateItem(i, { productId: e.target.value })} className="rounded-lg border border-border p-2 text-xs" /><input type="number" placeholder="Variant ID" value={item.productVariantId} onChange={(e) => updateItem(i, { productVariantId: e.target.value })} className="rounded-lg border border-border p-2 text-xs" /><input required min="1" type="number" placeholder="الكمية" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} className="rounded-lg border border-border p-2 text-xs" /><input required min="0" step="0.01" type="number" placeholder="تكلفة الوحدة" value={item.unitCost} onChange={(e) => updateItem(i, { unitCost: e.target.value })} className="rounded-lg border border-border p-2 text-xs" /></div>)}<button type="button" onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })} className="text-xs font-bold text-emerald-700">+ إضافة صنف</button></div><button disabled={saving} className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white">{saving ? 'جاري الحفظ...' : 'حفظ المرتجع'}</button></form></div>}
      {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6" dir="rtl"><div className="flex justify-between"><h2 className="font-bold">مرتجع {detail.returnNumber || detail.id}</h2><button onClick={() => setDetail(null)}><X size={18} /></button></div><p className="mt-2 text-xs text-ink-soft">إذن الاستلام: {detail.receiptPermitNumber || '—'} · الحالة: {detail.status}</p><div className="my-4 divide-y divide-border">{(detail.items || []).map((item, i) => <div key={i} className="flex justify-between py-2 text-xs"><span>منتج #{item.productId} · الكمية {item.quantity}</span><b>{formatCurrency(Number(item.quantity || 0) * Number(item.unitCost || 0))}</b></div>)}</div><p className="text-left text-sm font-bold">الإجمالي: {formatCurrency(detail.totalAmount ?? total)}</p>{canResolve && String(detail.status).toLowerCase() === 'underinspection' && <div className="mt-5 flex gap-2"><button onClick={() => resolve(acceptSupplierReturn)} className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white"><Check size={14} className="inline" /> قبول</button><button onClick={() => resolve(rejectSupplierReturn)} className="flex-1 rounded-xl bg-rose-600 py-2 text-xs font-bold text-white">رفض</button></div>}</div></div>}
    </div>
  )
}
