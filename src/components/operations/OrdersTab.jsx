// File: src/components/operations/OrdersTab.jsx
import { useState, useEffect, useRef } from 'react'
import { Clock, Loader2, Printer, Package, Truck, CheckCircle2, XCircle, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react'
import { formatCurrency } from '../../utils/catalog'

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
    case 1: return { label: 'قيد المراجعة', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock }
    case 2: return { label: 'تم التأكيد', className: 'bg-blue-50 text-blue-800 border-blue-200', icon: CheckCircle2 }
    case 3: return { label: 'جاري التجهيز', className: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Package }
    case 10: return { label: 'في الطريق إليك', className: 'bg-sky-50 text-sky-800 border-sky-200', icon: Truck }
    case 6: return { label: 'تم التوصيل بنجاح', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: ShieldCheck }
    case 8: return { label: 'ملغى', className: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle }
    default: return { label: `حالة (${status})`, className: 'bg-canvas text-ink-soft border-border', icon: Clock }
  }
}

function StatusChangeDropdown({ currentStatus, onSelect }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
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
        <div className="absolute left-0 z-20 mt-1 w-56 overflow-hidden rounded-lg bg-white shadow-lg shadow-black/10 ring-1 ring-black/5">
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

export default function OrdersTab({ orders, loading, error, processingId, onUpdateStatus, onPrintInvoice }) {
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