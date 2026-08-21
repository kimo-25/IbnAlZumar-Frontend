// File: src/pages/Purchasing/PurchasingPage.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Truck,
  Users,
  Plus,
  X,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  PackagePlus,
  ChevronDown,
  Phone,
  Mail,
  Pencil,
  PackageCheck
} from 'lucide-react'
import { getSuppliers, createSupplier, updateSupplier, getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder } from '../../api/purchasingApi'
import { getWarehouses, getStockLevels } from '../../api/inventoryApi'
import { getAllProducts } from '../../api/adminApi'
import { formatCurrency } from '../../utils/catalog'

const STATUS_META = {
  Draft: { label: 'مسودة', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Received: { label: 'تم الاستلام', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: 'bg-surface text-ink-soft border-border' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  )
}

export default function PurchasingPage() {
  const [tab, setTab] = useState('suppliers') // 'suppliers' | 'orders'

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Truck className="text-emerald-600" size={24} />
            المشتريات وإدارة الموردين
          </h1>
          <p className="text-xs text-ink-soft mt-1">إدارة بيانات الموردين وإنشاء أوامر الشراء ومتابعة استلام التوريدات</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setTab('suppliers')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'suppliers' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Users size={14} /> الموردين
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
            tab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <PackagePlus size={14} /> أوامر الشراء والتوريد
        </button>
      </div>

      {tab === 'suppliers' ? <SuppliersTab /> : <PurchaseOrdersTab />}
    </div>
  )
}

// ================================================================
// Suppliers Tab
// ================================================================

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await getSuppliers()
    setSuppliers(data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers
    const term = search.trim().toLowerCase()
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      (s.phone || '').includes(term) ||
      (s.email || '').toLowerCase().includes(term)
    )
  }, [suppliers, search])

  function openCreate() {
    setEditingSupplier(null)
    setModalOpen(true)
  }

  function openEdit(supplier) {
    setEditingSupplier(supplier)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم المورد أو الهاتف أو البريد..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pr-9 pl-3 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <Plus size={14} /> إضافة مورد جديد
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> جاري تحميل الموردين...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-soft">لا يوجد موردون مطابقون</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-canvas text-[10px] text-ink-soft border-b border-border">
                  <th className="px-4 py-3 text-right font-bold">اسم المورد</th>
                  <th className="px-4 py-3 text-right font-bold">جهة الاتصال</th>
                  <th className="px-4 py-3 text-right font-bold">أوامر الشراء</th>
                  <th className="px-4 py-3 text-right font-bold">الرصيد المستحق</th>
                  <th className="px-4 py-3 text-right font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-canvas/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-ink">{s.name}</div>
                      {s.taxId && <div className="text-[10px] text-ink-soft font-mono">ر.ض: {s.taxId}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink-soft">{s.contactPerson || '—'}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-soft">
                        {s.phone && <span className="flex items-center gap-1"><Phone size={11} />{s.phone}</span>}
                        {s.email && <span className="flex items-center gap-1"><Mail size={11} />{s.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-ink">{s.totalPurchaseOrders}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{formatCurrency(s.currentBalance)}</td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-ink-soft hover:bg-canvas transition"
                      >
                        <Pencil size={12} /> تعديل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </div>
  )
}

function SupplierModal({ supplier, onClose, onSaved }) {
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

// ================================================================
// Purchase Orders Tab
// ================================================================

function PurchaseOrdersTab() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [receivingId, setReceivingId] = useState(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await getPurchaseOrders()
    setOrders(data)
    setLoading(false)
  }

  async function handleReceive(order) {
    if (!window.confirm(`هل تريد تأكيد استلام أمر الشراء رقم ${order.purchaseOrderNumber}؟ سيتم رفع رصيد المخزون تلقائياً.`)) return
    setReceivingId(order.id)
    setBanner(null)
    try {
      await receivePurchaseOrder(order.id)
      setBanner({ type: 'success', message: `تم استلام أمر الشراء ${order.purchaseOrderNumber} وتحديث المخزون بنجاح` })
      load()
    } catch (err) {
      setBanner({ type: 'error', message: err?.response?.data?.message || 'حدث خطأ أثناء تأكيد الاستلام' })
    } finally {
      setReceivingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">أوامر الشراء</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
        >
          <Plus size={14} /> أمر شراء جديد
        </button>
      </div>

      {banner && (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
          banner.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-danger'
        }`}>
          {banner.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
          <span>{banner.message}</span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> جاري تحميل أوامر الشراء...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-soft">لا توجد أوامر شراء مسجلة بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-canvas text-[10px] text-ink-soft border-b border-border">
                  <th className="px-4 py-3 text-right font-bold">رقم الأمر</th>
                  <th className="px-4 py-3 text-right font-bold">المورد</th>
                  <th className="px-4 py-3 text-right font-bold">المستودع</th>
                  <th className="px-4 py-3 text-right font-bold">تاريخ الطلب</th>
                  <th className="px-4 py-3 text-right font-bold">الإجمالي</th>
                  <th className="px-4 py-3 text-right font-bold">الحالة</th>
                  <th className="px-4 py-3 text-right font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-canvas/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-ink">{o.purchaseOrderNumber}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.supplierName}</td>
                    <td className="px-4 py-3 text-ink-soft">{o.warehouseName}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{new Date(o.orderDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 font-mono font-bold text-ink">{formatCurrency(o.totalCost)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-left">
                      {o.status === 'Draft' ? (
                        <button
                          onClick={() => handleReceive(o)}
                          disabled={receivingId === o.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          {receivingId === o.id ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                          تأكيد الاستلام
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink-soft">
                          {o.receivedDate && new Date(o.receivedDate).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <PurchaseOrderModal
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load() }}
        />
      )}
    </div>
  )
}

function PurchaseOrderModal({ onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts] = useState([])

  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState(`PO-${Date.now().toString().slice(-8)}`)
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')

  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [lines, setLines] = useState([]) // { productId, sku, name, quantity, cost }

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSuppliers().then((data) => { setSuppliers(data); if (data.length) setSupplierId(String(data[0].id)) })
    getWarehouses().then((data) => { setWarehouses(data); if (data.length) setWarehouseId(String(data[0].id)) })
    getAllProducts().then((data) => setProducts(Array.isArray(data) ? data : data?.items || []))
  }, [])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 20)
    const term = search.trim().toLowerCase()
    return products.filter((p) =>
      (p.name || '').toLowerCase().includes(term) ||
      (p.nameAr || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term)
    ).slice(0, 20)
  }, [products, search])

  function addLine(product) {
    setShowDropdown(false)
    setSearch('')
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.id)) return prev
      return [...prev, {
        productId: product.id,
        sku: product.sku,
        name: product.nameAr || product.name,
        quantity: 1,
        cost: product.currentCostPrice || 0
      }]
    })
  }

  function updateLine(productId, field, value) {
    setLines((prev) => prev.map((l) => l.productId === productId ? { ...l, [field]: value } : l))
  }

  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const total = useMemo(() => lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.cost) || 0), 0), [lines])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!supplierId || !warehouseId) {
      setError('يرجى اختيار المورد والمستودع')
      return
    }
    if (lines.length === 0) {
      setError('أضف صنفاً واحداً على الأقل')
      return
    }
    const invalid = lines.some((l) => !Number(l.quantity) || Number(l.quantity) <= 0 || !Number(l.cost) || Number(l.cost) <= 0)
    if (invalid) {
      setError('تأكد من إدخال كمية وسعر تكلفة صحيحين لكل صنف')
      return
    }

    setSaving(true)
    try {
      await createPurchaseOrder({
        purchaseOrderNumber,
        supplierId: Number(supplierId),
        warehouseId: Number(warehouseId),
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes || undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          quantityOrdered: Number(l.quantity),
          unitCostPrice: Number(l.cost)
        }))
      })
      onSaved()
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إنشاء أمر الشراء')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface p-4 z-10">
          <h3 className="text-sm font-bold text-ink">إنشاء أمر شراء جديد</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">رقم أمر الشراء</label>
              <input value={purchaseOrderNumber} onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-mono font-bold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">تاريخ التسليم المتوقع</label>
              <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">المورد</label>
              <div className="relative">
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40">
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-ink-soft mb-1 block">المستودع المستلم</label>
              <div className="relative">
                <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40">
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-ink-soft mb-1 block">إضافة أصناف</label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                placeholder="ابحث بالاسم أو SKU..."
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            {showDropdown && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-ink-soft">لا توجد نتائج</div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      type="button" key={p.id}
                      onClick={() => addLine(p)}
                      disabled={lines.some((l) => l.productId === p.id)}
                      className="flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5 text-right text-xs last:border-0 hover:bg-canvas transition disabled:opacity-40"
                    >
                      <div>
                        <div className="font-bold text-ink">{p.nameAr || p.name}</div>
                        <div className="text-[10px] text-ink-soft font-mono">{p.sku}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-ink-soft">لم يتم إضافة أصناف بعد</div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-canvas text-[10px] text-ink-soft">
                      <th className="px-3 py-2 text-right font-bold">الصنف</th>
                      <th className="px-3 py-2 text-right font-bold w-20">الكمية</th>
                      <th className="px-3 py-2 text-right font-bold w-24">سعر التكلفة</th>
                      <th className="px-3 py-2 text-right font-bold w-24">الإجمالي</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.productId} className="border-t border-border">
                        <td className="px-3 py-2 font-semibold text-ink">{l.name}</td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={l.quantity}
                            onChange={(e) => updateLine(l.productId, 'quantity', e.target.value)}
                            className="w-16 rounded-lg border border-border px-1.5 py-1 text-center font-mono outline-none focus:ring-2 focus:ring-emerald-500/40" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0.01" step="0.01" value={l.cost}
                            onChange={(e) => updateLine(l.productId, 'cost', e.target.value)}
                            className="w-20 rounded-lg border border-border px-1.5 py-1 text-center font-mono outline-none focus:ring-2 focus:ring-emerald-500/40" />
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-ink">
                          {formatCurrency((Number(l.quantity) || 0) * (Number(l.cost) || 0))}
                        </td>
                        <td className="px-3 py-2 text-left">
                          <button type="button" onClick={() => removeLine(l.productId)} className="text-ink-soft hover:text-danger transition">
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

          <div>
            <label className="text-xs font-bold text-ink-soft mb-1 block">ملاحظات (اختياري)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full resize-none rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs text-ink outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-canvas border border-border p-3">
            <span className="text-xs font-bold text-ink-soft">إجمالي أمر الشراء</span>
            <span className="text-sm font-mono font-bold text-ink">{formatCurrency(total)}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-1 pb-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas transition">إلغاء</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} حفظ كمسودة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
