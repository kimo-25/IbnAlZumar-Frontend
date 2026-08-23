// File: src/pages/Purchasing/PurchasingPage.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Truck,
  Users,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  PackagePlus,
  Phone,
  Mail,
  Pencil,
  PackageCheck,
  FileText,
  Banknote
} from 'lucide-react'
import { getSuppliers, getPurchaseOrders, receivePurchaseOrder } from '../../api/purchasingApi'
import { formatCurrency } from '../../utils/catalog'
import StatusBadge from '../../components/Purchasing/StatusBadge'
import SupplierModal from '../../components/Purchasing/SupplierModal'
import SupplierDetailsModal from '../../components/Purchasing/SupplierDetailsModal'
import AddPaymentModal from '../../components/Purchasing/AddPaymentModal'
import PurchaseOrderModal from '../../components/Purchasing/PurchaseOrderModal'

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
  const [detailsSupplierId, setDetailsSupplierId] = useState(null)
  const [paymentSupplier, setPaymentSupplier] = useState(null)

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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsSupplierId(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-ink-soft hover:bg-canvas transition"
                        >
                          <FileText size={12} /> كشف حساب / التفاصيل
                        </button>
                        <button
                          onClick={() => setPaymentSupplier(s)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          <Banknote size={12} /> تسجيل دفعة
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-ink-soft hover:bg-canvas transition"
                        >
                          <Pencil size={12} /> تعديل
                        </button>
                      </div>
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

      {detailsSupplierId && (
        <SupplierDetailsModal
          supplierId={detailsSupplierId}
          onClose={() => setDetailsSupplierId(null)}
          onPaymentRecorded={load}
        />
      )}

      {paymentSupplier && (
        <AddPaymentModal
          supplierId={paymentSupplier.id}
          supplierName={paymentSupplier.name}
          onClose={() => setPaymentSupplier(null)}
          onSaved={() => { setPaymentSupplier(null); load() }}
        />
      )}
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