// File: src/pages/Operations/OperationsHubPage.jsx
import { useState, useEffect, useCallback } from 'react'
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
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Phone,
  User,
  ShieldCheck
} from 'lucide-react'
import Card from '../../components/ui/Card'
import { formatCurrency } from '../../utils/catalog'
import { getOnlineOrders } from '../../api/adminApi'
import axiosInstance from '../../api/axiosInstance'

// ==========================================
// Constants & Options
// ==========================================
const ORDER_STATUS_OPTIONS = [
  { value: 1, label: '1. قيد المراجعة' },
  { value: 2, label: '2. تم التأكيد' },
  { value: 3, label: '3. جاري التجهيز' },
  { value: 10, label: '4. في الطريق إليك (تم الشحن)' },
  { value: 6, label: '5. تم التوصيل بنجاح' },
  { value: 8, label: '❌ إلغاء الطلب' }
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
// Helper: Print Invoice HTML Generator
// ==========================================
function generateInvoiceHTML(order) {
  const rawItems = order.items || order.orderDetails || order.orderItems || []
  const items = Array.isArray(rawItems) ? rawItems : (rawItems.$values || [])
  const orderNum = order.orderNumber || `ORD-${order.id}`
  const orderDate = new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const printDate = new Date().toLocaleString('ar-EG')

  const subtotal = order.subtotal || order.totalAmount || order.total || 0
  const shippingCost = order.shippingCost || order.shippingFee || 0
  const grandTotal = order.totalAmount || order.total || (subtotal + shippingCost)

  const itemsRows = items.map((item, idx) => {
    const itemName = item.productName || item.name || item.product?.name || 'معدة / أداة ورشة'
    const qty = item.quantity || 1
    const unitPrice = item.unitPrice || item.price || 0
    const totalItemPrice = unitPrice * qty

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;">
          ${itemName}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600; font-size: 13px;">${qty}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-family: monospace; font-size: 13px;">
          ${formatCurrency(unitPrice)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 13px;">
          ${formatCurrency(totalItemPrice)}
        </td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة رقم ${orderNum} - ابن الزمر</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; line-height: 1.5; }
        .invoice-card { max-width: 820px; margin: auto; border: 2px solid #e2e8f0; padding: 32px; border-radius: 20px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
        .brand-title { font-size: 26px; font-weight: 800; color: #059669; margin: 0; letter-spacing: -0.5px; }
        .brand-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600; }
        .invoice-meta { text-align: left; }
        .invoice-title { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
        .invoice-num { margin: 4px 0 0; font-size: 14px; color: #059669; font-family: monospace; font-weight: 700; }
        .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 18px 20px; border-radius: 14px; margin-bottom: 24px; border: 1px solid #f1f5f9; font-size: 13px; }
        .details-block h4 { margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        .details-row { margin-bottom: 4px; color: #334155; }
        .details-row strong { color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f1f5f9; padding: 12px; text-align: right; border-bottom: 2px solid #cbd5e1; color: #334155; font-weight: 800; font-size: 12px; }
        .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .summary-box { width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #475569; }
        .summary-row.total { font-size: 16px; font-weight: 800; border-bottom: none; border-top: 2px solid #059669; color: #059669; padding-top: 12px; margin-top: 4px; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; }
        @media print {
          body { padding: 0; background: #fff; }
          .invoice-card { border: none; padding: 0; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <h1 class="brand-title">ابن الزمر</h1>
            <div class="brand-subtitle">للعدد ومستلزمات الورش والمعدات الصناعية</div>
          </div>
          <div class="invoice-meta">
            <h2 class="invoice-title">فاتورة مبيعات أونلاين</h2>
            <p class="invoice-num">#${orderNum}</p>
          </div>
        </div>

        <div class="grid-details">
          <div class="details-block">
            <h4>بيانات العميل والتوصيل</h4>
            <div class="details-row"><strong>العميل:</strong> ${order.customerName || order.customer?.fullName || 'عميل كاش'}</div>
            <div class="details-row"><strong>رقم الهاتف:</strong> ${order.phone || order.customer?.phoneNumber || '-'}</div>
            <div class="details-row"><strong>عنوان الشحن:</strong> ${order.shippingAddress || order.address || 'استلام من مقر المعرض'}</div>
          </div>
          <div class="details-block">
            <h4>تفاصيل الفاتورة والطلب</h4>
            <div class="details-row"><strong>تاريخ الطلب:</strong> ${orderDate}</div>
            <div class="details-row"><strong>حالة الطلب:</strong> ${order.statusText || 'معتمد'}</div>
            <div class="details-row"><strong>طريقة الدفع:</strong> ${order.paymentMethod || 'الدفع عند الاستلام (COD)'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">#</th>
              <th>الصنف / بيان المعدة</th>
              <th style="text-align: center; width: 70px;">الكمية</th>
              <th style="text-align: left; width: 120px;">سعر الوحدة</th>
              <th style="text-align: left; width: 120px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows.length > 0 ? itemsRows : '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">تم تسجيل عناصر الطلب بنجاح.</td></tr>'}
          </tbody>
        </table>

        <div class="summary-wrapper">
          <div class="summary-box">
            <div class="summary-row">
              <span>إجمالي الأصناف:</span>
              <span style="font-family: monospace;">${formatCurrency(subtotal)}</span>
            </div>
            ${shippingCost > 0 ? `
            <div class="summary-row">
              <span>مصاريف الشحن والتوصيل:</span>
              <span style="font-family: monospace;">${formatCurrency(shippingCost)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>صافي المبلغ المستحق:</span>
              <span style="font-family: monospace;">${formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0; font-weight: 700; color: #1e293b;">نشكر اختياركم متجر ابن الزمر — ضمان وجودة في خدمتكم دائماً</p>
          <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">تاريخ الطباعة: ${printDate}</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `
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
                    <div className="font-bold text-ink">{order.customerName || 'عميل كاش'}</div>
                    <div className="font-mono text-[11px] text-ink-soft mt-0.5">{order.phone || '-'}</div>
                  </td>
                  <td className="p-4 max-w-xs truncate text-ink-soft" title={order.shippingAddress || ''}>
                    {order.shippingAddress || '-'}
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-1.5 text-[11px] font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
                        title="طباعة الفاتورة الرسمية"
                      >
                        <Printer size={13} className="text-emerald-600" />
                        <span>فاتورة</span>
                      </button>

                      <div className="relative inline-block">
                        {processingId === order.id ? (
                          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <Loader2 size={13} className="animate-spin text-emerald-600" />
                            <span>تحديث...</span>
                          </div>
                        ) : (
                          <select
                            value={currentStatus}
                            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                            className="rounded-xl bg-emerald-600 text-white font-semibold text-[11px] px-3 py-1.5 outline-none cursor-pointer hover:bg-emerald-700 transition border-none shadow-xs text-center appearance-none pr-3 pl-3"
                          >
                            <option value="" disabled className="bg-white text-gray-400">تغيير الحالة...</option>
                            {ORDER_STATUS_OPTIONS.map((st) => (
                              <option key={st.value} value={st.value} className="bg-white text-ink font-semibold py-1">
                                {st.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
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

// ==========================================
// Main Component: OperationsHubPage
// ==========================================
export default function OperationsHubPage() {
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'inquiries' | 'shipping' | 'products'
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  // حالة مناطق الشحن
  const [shippingZones, setShippingZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [newZone, setNewZone] = useState({ name: '', price: '', estimatedDays: '' })
  const [addingZone, setAddingZone] = useState(false)

  // جلب الطلبات
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

  // جلب مناطق الشحن
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

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    } else if (activeTab === 'shipping') {
      fetchShippingZones()
    }
  }, [activeTab, fetchOrders, fetchShippingZones])

  // إضافة منطقة شحن جديدة
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

  // حذف منطقة شحن
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

  // تحديث حالة الطلب
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
      alert('حدث خطأ أثناء تحديث حالة الطلب. يرجى إعادة المحاولة.')
    } finally {
      setProcessingId(null)
    }
  }

  // طباعة الفاتورة
  function handlePrintInvoice(order) {
    const printWindow = window.open('', '_blank', 'width=850,height=900')
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة (Popups) لتتمكن من طباعة الفاتورة.')
      return
    }

    const invoiceHtml = generateInvoiceHTML(order)
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">مركز عمليات متجر ابن الزمر</h1>
          <p className="text-xs text-ink-soft mt-1">
            إدارة الطلبات المباشرة، استفسارات الورش، ومناطق الشحن والظهور
          </p>
        </div>
        <button
          type="button"
          onClick={activeTab === 'orders' ? fetchOrders : fetchShippingZones}
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
        >
          <RefreshCw size={14} /> تحديث البيانات
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Package size={15} />
          الطلبات والأونلاين
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'inquiries' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <HelpCircle size={15} />
          استفسارات الورشة
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'shipping' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Truck size={15} />
          إدارة مناطق الشحن
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'products' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Eye size={15} />
          ظهور المنتجات
        </button>
      </div>

      {/* Active Tab Views */}
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
        <Card title="التحكم في ظهور ونشر المنتجات">
          <p className="text-xs text-ink-soft py-10 text-center">
            إدارة حالة توافر ونشر معدات الورش والعدد للمستخدمين.
          </p>
        </Card>
      )}
    </div>
  )
}