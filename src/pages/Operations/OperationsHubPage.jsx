// File: src/pages/Operations/OperationsHubPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Clock,
  Loader2,
  RefreshCw,
  Printer,
  Plus,
  Trash2,
  Package,
  Truck,
  HelpCircle,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  ChevronDown,
  Check,
  X as XIcon
} from 'lucide-react'
import Card from '../../components/ui/Card'
import { formatCurrency } from '../../utils/catalog'
import { getOnlineOrders, getLowStockProducts, adjustStock } from '../../api/adminApi'
import axiosInstance from '../../api/axiosInstance'
import { printInvoice } from '../../utils/printInvoice'

// ==========================================
// Constants & Options
// ==========================================
const ORDER_STATUS_OPTIONS = [
  { value: 1, label: 'قيد المراجعة', dotColor: 'bg-amber-500', icon: Clock },
  { value: 2, label: 'تم التأكيد', dotColor: 'bg-blue-500', icon: CheckCircle2 },
  { value: 3, label: 'جاري التجهيز', dotColor: 'bg-indigo-500', icon: Package },
  { value: 10, label: 'في الطريق إليك (تم الشحن)', dotColor: 'bg-sky-500', icon: Truck },
  { value: 6, label: 'تم التوصيل بنجاح', dotColor: 'bg-emerald-500', icon: ShieldCheck },
  { value: 8, label: 'إلغاء الطلب', dotColor: 'bg-rose-500', icon: XCircle }
]

function getStatusBadge(status) {
  const statusNum = Number(status)
  switch (statusNum) {
    case 1:
      return { label: 'قيد المراجعة', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock }
    case 2:
      return { label: 'تم التأكيد', className: 'bg-blue-50 text-blue-800 border-blue-200', icon: CheckCircle2 }
    case 3:
      return { label: 'جاري التجهيز', className: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Package }
    case 10:
      return { label: 'في الطريق إليك', className: 'bg-sky-50 text-sky-800 border-sky-200', icon: Truck }
    case 6:
      return { label: 'تم التوصيل بنجاح', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: ShieldCheck }
    case 8:
      return { label: 'ملغى', className: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle }
    default:
      return { label: `حالة (${status})`, className: 'bg-canvas text-ink-soft border-border', icon: Clock }
  }
}

// ==========================================
// Custom Status Dropdown (Modern UI)
// ==========================================
function StatusChangeDropdown({ currentStatus, onSelect }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(value) {
    setOpen(false)
    onSelect(value)
  }

  return (
    <div ref={containerRef} className="relative inline-block text-right" dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-[11px] px-3.5 py-2 rounded-xl shadow-xs cursor-pointer hover:from-emerald-700 hover:to-emerald-800 transition"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        <span>تغيير الحالة</span>
        <ChevronDown size={13} className={`opacity-80 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 z-20 mt-1 w-56 overflow-hidden rounded-lg bg-white shadow-lg shadow-black/10 ring-1 ring-black/5"
        >
          <ul className="py-1">
            {ORDER_STATUS_OPTIONS.map((st) => {
              const StatusIcon = st.icon
              const isSelected = Number(currentStatus) === st.value
              return (
                <li key={st.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(st.value)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-right text-xs font-semibold text-gray-700 transition-colors duration-150 hover:bg-[#f3f4f6] ${
                      isSelected ? 'bg-[#f9fafb] text-emerald-700' : ''
                    }`}
                  >
                    <StatusIcon size={14} className="shrink-0 text-gray-400" />
                    <span className="flex-1">{st.label}</span>
                    {isSelected && <span className={`h-1.5 w-1.5 rounded-full ${st.dotColor}`}></span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Sub-Components
// ==========================================

// 1. جدول الطلبات والأونلاين
function OrdersTab({ orders, loading, error, processingId, onUpdateStatus, onPrintInvoice }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
        <AlertCircle size={18} className="shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center text-xs text-ink-soft">
        <Package size={40} className="mx-auto mb-3 text-border" />
        <p className="font-bold text-sm text-ink">لا توجد طلبات أونلاين مسجلة حالياً</p>
        <p className="mt-1">ستظهر الطلبات الجديدة هنا لمتابعة حالاتها وطباعة الفواتير.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
            <tr>
              <th className="p-4">رقم الطلب</th>
              <th className="p-4">العميل ورقم الهاتف</th>
              <th className="p-4">العنوان</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">الحالة الحالية</th>
              <th className="p-4 text-center">الإجراءات وتغيير الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => {
              const currentStatus = order.status ?? order.statusValue ?? 1
              const badge = getStatusBadge(currentStatus)
              const StatusIcon = badge.icon

              return (
                <tr key={order.id} className="hover:bg-canvas/50 transition">
                  <td className="p-4 font-mono font-bold text-emerald-600">
                    {order.orderNumber || `ORD-${order.id}`}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-ink">
                      {order.customerName || order.fullName || order.customer?.fullName || 'عميل المتجر'}
                    </div>
                    <div className="font-mono text-[11px] text-ink-soft mt-0.5">
                      {order.phone || order.customerPhone || 'غير محدد'}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs truncate text-ink-soft" title={order.shippingAddress || order.address || ''}>
                    {order.shippingAddress || order.address || '-'}
                  </td>
                  <td className="p-4 font-mono font-bold text-ink">
                    {formatCurrency(order.totalAmount || order.total || 0)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${badge.className}`}>
                      <StatusIcon size={13} /> {order.statusText || badge.label}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPrintInvoice(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3.5 py-2 text-[11px] font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
                        title="طباعة الفاتورة الرسمية"
                      >
                        <Printer size={13} className="text-emerald-600" />
                        <span>فاتورة</span>
                      </button>

                      {processingId === order.id ? (
                        <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <Loader2 size={13} className="animate-spin text-emerald-600" />
                          <span>تحديث...</span>
                        </div>
                      ) : (
                        <StatusChangeDropdown
                          currentStatus={currentStatus}
                          onSelect={(value) => onUpdateStatus(order.id, value)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 2. إدارة مناطق الشحن
function ShippingTab({ zones, loading, adding, newZone, setNewZone, onAddZone, onDeleteZone }) {
  return (
    <div className="space-y-6">
      <Card title="إضافة منطقة شحن جديدة">
        <form onSubmit={onAddZone} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">اسم المحافظة / المنطقة</label>
            <input
              type="text"
              required
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              placeholder="مثال: الإسكندرية"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">تكلفة الشحن (ج.م)</label>
            <input
              type="number"
              required
              min="0"
              value={newZone.price}
              onChange={(e) => setNewZone({ ...newZone, price: e.target.value })}
              placeholder="50"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">مدة التوصيل المتوقعة (أيام)</label>
            <input
              type="number"
              min="1"
              value={newZone.estimatedDays}
              onChange={(e) => setNewZone({ ...newZone, estimatedDays: e.target.value })}
              placeholder="2"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            إضافة المنطقة
          </button>
        </form>
      </Card>

      <Card title="قائمة مناطق الشحن المعتمدة في النظام">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-right text-xs">
              <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                <tr>
                  <th className="p-3">المنطقة / المحافظة</th>
                  <th className="p-3">تكلفة الشحن</th>
                  <th className="p-3">مدة التوصيل التقريبية</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-ink-soft">
                      لا توجد مناطق شحن مضافة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-canvas/50 transition">
                      <td className="p-3 font-bold text-ink">{zone.name || zone.governorate}</td>
                      <td className="p-3 font-mono font-semibold text-emerald-700">
                        {formatCurrency(zone.shippingCost ?? zone.shippingFee ?? zone.price ?? 0)}
                      </td>
                      <td className="p-3">{zone.estimatedDays ? `${zone.estimatedDays} أيام` : 'غير محدد'}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteZone(zone.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="حذف المنطقة"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// 3. ظهور ونشر المنتجات (Products Visibility & Status Tab)
function ProductsVisibilityTab({ products, loading, searchTerm, setSearchTerm, onToggleVisibility }) {
  const filteredProducts = products.filter(p =>
    (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border p-4 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المعدة أو التصنيف..."
            className="w-full rounded-xl border border-border bg-canvas pr-10 pl-4 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
          />
        </div>
        <div className="text-xs font-semibold text-ink-soft">
          إجمالي المعدات المعروضة: <span className="font-mono font-bold text-emerald-600">{filteredProducts.length}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
              <tr>
                <th className="p-4">الصنف / المعدة</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4">السعر</th>
                <th className="p-4">الحالة بالمخزن</th>
                <th className="p-4">حالة الظهور للعملاء</th>
                <th className="p-4 text-center">التحكم في النشر والظهور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-ink-soft">
                    <Package size={36} className="mx-auto mb-2 text-border" />
                    <p className="font-bold text-sm text-ink">لا توجد منتجات مطابقة للبحث</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isVisible = product.isPublished ?? product.isActive ?? product.isVisible ?? true
                  return (
                    <tr key={product.id} className="hover:bg-canvas/50 transition">
                      <td className="p-4 font-bold text-ink flex items-center gap-3">
                        {product.imageUrl || product.image ? (
                          <img src={product.imageUrl || product.image} alt="" className="w-9 h-9 rounded-xl object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-canvas border border-border flex items-center justify-center text-ink-soft shrink-0">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-ink">{product.name || product.title}</div>
                          <div className="font-mono text-[10px] text-ink-soft">SKU: {product.sku || `PRD-${product.id}`}</div>
                        </div>
                      </td>
                      <td className="p-4 text-ink-soft">{product.categoryName || product.category?.name || 'مستلزمات ورش'}</td>
                      <td className="p-4 font-mono font-bold text-ink">{formatCurrency(product.price || product.unitPrice || 0)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${(product.stock ?? product.quantity ?? 10) > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                          {(product.stock ?? product.quantity ?? 10) > 0 ? 'متوفر بالمخزن' : 'نفذت الكمية'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${isVisible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                          {isVisible ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} className="text-gray-500" />}
                          {isVisible ? 'منشور للعملاء' : 'مخفي'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleVisibility(product.id, !isVisible)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold transition cursor-pointer shadow-xs ${isVisible
                              ? 'bg-surface border border-border text-rose-600 hover:bg-rose-50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                          {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{isVisible ? 'إخفاء من المتجر' : 'نشر بالمتجر'}</span>
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
    </div>
  )
}

// 4. تنبيهات النواقص وطلبات التموين (Low Stock / Restock Tab)
function RestockTab({ products, loading, error, onRefresh, onQuickRestock, restockingId }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  function startEdit(product) {
    setEditingId(product.id)
    setEditValue('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function confirmEdit(product) {
    const qty = parseInt(editValue, 10)
    if (!qty || qty <= 0) {
      alert('من فضلك أدخل كمية صحيحة أكبر من صفر.')
      return
    }
    await onQuickRestock(product.id, qty)
    setEditingId(null)
    setEditValue('')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-rose-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
        <AlertCircle size={18} className="shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <AlertTriangle size={16} className="text-rose-600" />
          <span>
            إجمالي المنتجات الناقصة: <span className="font-mono font-bold text-rose-600">{products.length}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3.5 py-2 text-[11px] font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
        >
          <RefreshCw size={13} />
          تحديث القائمة
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-12 text-center">
          <ShieldCheck size={40} className="mx-auto mb-3 text-emerald-500" />
          <p className="font-bold text-sm text-emerald-800">لا توجد أي منتجات ناقصة حالياً</p>
          <p className="mt-1 text-xs text-emerald-700/80">كل المخزون فوق الحد الأدنى المحدد.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                <tr>
                  <th className="p-4">الصنف / المعدة</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">الكمية الحالية</th>
                  <th className="p-4">الحد الأدنى</th>
                  <th className="p-4">سعر الوحدة</th>
                  <th className="p-4 text-center">إعادة التموين</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const stock = product.currentStock ?? product.stock ?? 0
                  const isOut = stock <= 0
                  const isEditing = editingId === product.id
                  const isBusy = restockingId === product.id

                  return (
                    <tr key={product.id} className="hover:bg-canvas/50 transition">
                      <td className="p-4 font-bold text-ink">
                        <div>{product.name || product.nameAr}</div>
                        <div className="font-mono text-[10px] text-ink-soft mt-0.5">SKU: {product.sku}</div>
                      </td>
                      <td className="p-4 text-ink-soft">{product.categoryName || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            isOut ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isOut ? <PackageX size={12} /> : <AlertTriangle size={12} />}
                          {stock}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-ink-soft">{product.minStockThreshold}</td>
                      <td className="p-4 font-mono font-bold text-ink">{formatCurrency(product.unitPrice || 0)}</td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="الكمية"
                              className="w-20 rounded-lg border border-border bg-canvas px-2 py-1.5 text-xs text-ink outline-none focus:border-emerald-600 transition"
                            />
                            <button
                              type="button"
                              onClick={() => confirmEdit(product)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
                              title="تأكيد الإضافة"
                            >
                              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-surface border border-border text-ink-soft hover:bg-canvas transition cursor-pointer"
                              title="إلغاء"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                          >
                            <Plus size={13} />
                            تحديث الكمية
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Main Component: OperationsHubPage
// ==========================================
export default function OperationsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'restock' ? 'restock' : 'orders'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  const [shippingZones, setShippingZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [newZone, setNewZone] = useState({ name: '', price: '', estimatedDays: '' })
  const [addingZone, setAddingZone] = useState(false)

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loadingLowStock, setLoadingLowStock] = useState(false)
  const [lowStockError, setLowStockError] = useState(null)
  const [restockingId, setRestockingId] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      setOrdersError(null)
      const data = await getOnlineOrders()
      const ordersList = Array.isArray(data) ? data : (data.$values || data.data || [])
      setOrders(ordersList)
    } catch (err) {
      console.error('فشل جلب الطلبات:', err)
      setOrdersError('حدث خطأ أثناء جلب قائمة الطلبات والعمليات.')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const fetchShippingZones = useCallback(async () => {
    try {
      setLoadingZones(true)
      const res = await axiosInstance.get('/ShippingZones')
      const data = res.data
      setShippingZones(Array.isArray(data) ? data : (data.$values || data.data || []))
    } catch (err) {
      console.error('فشل جلب مناطق الشحن:', err)
    } finally {
      setLoadingZones(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      const res = await axiosInstance.get('/Products')
      const data = res.data
      setProducts(Array.isArray(data) ? data : (data.$values || data.data || []))
    } catch (err) {
      console.error('فشل جلب المنتجات:', err)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  const fetchLowStock = useCallback(async () => {
    try {
      setLoadingLowStock(true)
      setLowStockError(null)
      const data = await getLowStockProducts()
      const list = Array.isArray(data) ? data : (data?.$values || data?.data || [])
      setLowStockProducts(list)
    } catch (err) {
      console.error('فشل جلب تنبيهات نقص المخزون:', err)
      setLowStockError('حدث خطأ أثناء جلب قائمة المنتجات الناقصة.')
    } finally {
      setLoadingLowStock(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    } else if (activeTab === 'shipping') {
      fetchShippingZones()
    } else if (activeTab === 'products') {
      fetchProducts()
    } else if (activeTab === 'restock') {
      fetchLowStock()
    }
  }, [activeTab, fetchOrders, fetchShippingZones, fetchProducts, fetchLowStock])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setSearchParams(tab === 'restock' ? { tab: 'restock' } : {}, { replace: true })
  }

  async function handleAddZone(e) {
    e.preventDefault()
    if (!newZone.name || !newZone.price) {
      alert('يرجى إدخال اسم المنطقة وسعر الشحن على الأقل.')
      return
    }
    try {
      setAddingZone(true)
      const costValue = parseFloat(newZone.price) || 0
      await axiosInstance.post('/ShippingZones', {
        name: newZone.name,
        governorate: newZone.name,
        shippingCost: costValue,
        shippingFee: costValue,
        estimatedDays: parseInt(newZone.estimatedDays || 1),
        isActive: true
      })
      setNewZone({ name: '', price: '', estimatedDays: '' })
      await fetchShippingZones()
    } catch (err) {
      console.error('فشل إضافة منطقة الشحن:', err)
      alert('حدث خطأ أثناء إضافة المنطقة.')
    } finally {
      setAddingZone(false)
    }
  }

  async function handleDeleteZone(id) {
    if (!window.confirm('هل أنت متأكد من حذف منطقة الشحن هذه؟')) return
    try {
      await axiosInstance.delete(`/ShippingZones/${id}`)
      await fetchShippingZones()
    } catch (err) {
      console.error('فشل حذف منطقة الشحن:', err)
      alert('حدث خطأ أثناء الحذف.')
    }
  }

  async function handleUpdateStatus(orderId, newStatusValue) {
    if (!newStatusValue) return
    try {
      setProcessingId(orderId)
      const statusInt = parseInt(newStatusValue)

      try {
        await axiosInstance.put(`/Orders/${orderId}/status?status=${statusInt}`)
      } catch {
        await axiosInstance.put(`/Orders/${orderId}/status`, { status: statusInt })
      }

      await fetchOrders()
    } catch (err) {
      console.error('خطأ أثناء تغيير حالة الطلب:', err)
      alert('حدث خطأ أثناء تعديل حالة الطلب، يرجى إعادة المحاولة.')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleToggleProductVisibility(productId, newVisibility) {
    try {
      try {
        await axiosInstance.put(`/Products/${productId}/visibility`, { isPublished: newVisibility })
      } catch {
        await axiosInstance.patch(`/Products/${productId}`, { isPublished: newVisibility })
      }
      await fetchProducts()
    } catch (err) {
      console.error('فشل تعديل حالة ظهور المنتج:', err)
      alert('حدث خطأ أثناء تعديل حالة ظهور المنتج.')
    }
  }

  async function handleQuickRestock(productId, addedQuantity) {
    try {
      setRestockingId(productId)
      await adjustStock({
        productId,
        quantity: addedQuantity,
        reason: 'إعادة تموين سريع من مركز العمليات'
      })
      await fetchLowStock()
    } catch (err) {
      console.error('فشل تحديث كمية المخزون:', err)
      alert('حدث خطأ أثناء تحديث الكمية، يرجى إعادة المحاولة.')
    } finally {
      setRestockingId(null)
    }
  }

  function handlePrintInvoice(order) {
    if (!order) return

    const customerObj = order.customer || order.user || {
      fullName: order.customerName || order.fullName,
      phone: order.phone || order.customerPhone,
      email: order.customerEmail || order.email
    }
    printInvoice(order, customerObj, true)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">مركز عمليات متجر ابن الزمر</h1>
          <p className="text-xs text-ink-soft mt-1">
            إدارة الطلبات المباشرة، استفسارات الورش، ومناطق الشحن والظهور
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (activeTab === 'orders') fetchOrders()
            else if (activeTab === 'shipping') fetchShippingZones()
            else if (activeTab === 'products') fetchProducts()
            else if (activeTab === 'restock') fetchLowStock()
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => handleTabChange('orders')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
        >
          <Package size={15} />
          <span>الطلبات والأونلاين</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('inquiries')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === 'inquiries' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
        >
          <HelpCircle size={15} />
          <span>استفسارات الورشة</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('shipping')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === 'shipping' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
        >
          <Truck size={15} />
          <span>إدارة مناطق الشحن</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('products')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === 'products' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
        >
          <Eye size={15} />
          <span>ظهور المنتجات</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('restock')}
          className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${activeTab === 'restock' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
            }`}
        >
          <AlertTriangle size={15} />
          <span>تنبيهات النواقص والتموين</span>
          {lowStockProducts.length > 0 && (
            <span
              className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                activeTab === 'restock' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {lowStockProducts.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          loading={loadingOrders}
          error={ordersError}
          processingId={processingId}
          onUpdateStatus={handleUpdateStatus}
          onPrintInvoice={handlePrintInvoice}
        />
      )}

      {activeTab === 'inquiries' && (
        <Card title="استفسارات الورشة وطلبات المعدات الخاصة">
          <p className="text-xs text-ink-soft py-10 text-center">
            لا توجد استفسارات ورشة جديدة معلقة في الوقت الحالي.
          </p>
        </Card>
      )}

      {activeTab === 'shipping' && (
        <ShippingTab
          zones={shippingZones}
          loading={loadingZones}
          adding={addingZone}
          newZone={newZone}
          setNewZone={setNewZone}
          onAddZone={handleAddZone}
          onDeleteZone={handleDeleteZone}
        />
      )}

      {activeTab === 'products' && (
        <ProductsVisibilityTab
          products={products}
          loading={loadingProducts}
          searchTerm={productSearch}
          setSearchTerm={setProductSearch}
          onToggleVisibility={handleToggleProductVisibility}
        />
      )}

      {activeTab === 'restock' && (
        <RestockTab
          products={lowStockProducts}
          loading={loadingLowStock}
          error={lowStockError}
          onRefresh={fetchLowStock}
          onQuickRestock={handleQuickRestock}
          restockingId={restockingId}
        />
      )}
    </div>
  )
}