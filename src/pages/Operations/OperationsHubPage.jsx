// File: src/pages/Operations/OperationsHubPage.jsx
import { useState, useEffect } from 'react'
import { 
  Clock, 
  Loader2, 
  RefreshCw,
  Printer,
  Plus,
  Trash2
} from 'lucide-react'
import Card from '../../components/ui/Card'
import { formatCurrency } from '../../utils/catalog'
import { getOnlineOrders } from '../../api/adminApi'
import axiosInstance from '../../api/axiosInstance'

// خيارات الحالات المطابقة لأرقام OrderStatus Enum في الباك إند
const ORDER_STATUS_OPTIONS = [
  { value: 1, label: '1. قيد المراجعة' },
  { value: 2, label: '2. تم التأكيد' },
  { value: 3, label: '3. جاري التجهيز' },
  { value: 10, label: '4. في الطريق إليك (تم الشحن)' },
  { value: 6, label: '5. تم التوصيل بنجاح' },
  { value: 8, label: '❌ إلغاء الطلب' },
]

export default function OperationsHubPage() {
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'inquiries' | 'shipping' | 'products'
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  // حالات خاصة بإدارة مناطق الشحن
  const [shippingZones, setShippingZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [newZone, setNewZone] = useState({ name: '', price: '', estimatedDays: '' })
  const [addingZone, setAddingZone] = useState(false)

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    } else if (activeTab === 'shipping') {
      fetchShippingZones()
    }
  }, [activeTab])

  async function fetchOrders() {
    try {
      setLoading(true)
      setError(null)
      const data = await getOnlineOrders()
      const ordersList = Array.isArray(data) ? data : (data.$values || data.data || [])
      setOrders(ordersList)
    } catch (err) {
      console.error(err)
      setError('فشل تحميل قائمة الطلبات والعمليات.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchShippingZones() {
    try {
      setLoadingZones(true)
      const res = await axiosInstance.get('/ShippingZones')
      const data = res.data
      setShippingZones(Array.isArray(data) ? data : (data.$values || data.data || []))
    } catch (err) {
      console.error('فشل جلب مناطق الشحن', err)
    } finally {
      setLoadingZones(false)
    }
  }

  async function handleAddZone(e) {
    e.preventDefault()
    if (!newZone.name || !newZone.price) {
      alert('يرجى إدخال اسم المنطقة وسعر الشحن على الأقل.')
      return
    }
    try {
      setAddingZone(true)
      
      const costValue = parseFloat(newZone.price) || 0;
      
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
      console.error('فشل إضافة منطقة الشحن', err)
      alert('حدث خطأ أثناء إضافة المنطقة.')
    } finally {
      setAddingZone(false)
    }
  }

  async function handleDeleteZone(id) {
    if (!confirm('هل أنت متأكد من حذف منطقة الشحن هذه؟')) return
    try {
      await axiosInstance.delete(`/ShippingZones/${id}`)
      await fetchShippingZones()
    } catch (err) {
      console.error('فشل حذف منطقة الشحن', err)
      alert('حدث خطأ أثناء الحذف.')
    }
  }

  // دالة تغيير الحالة المباشرة بيمرر رقم الـ Enum للباك إند
  async function handleUpdateStatus(orderId, newStatusValue) {
    if (!newStatusValue) return
    try {
      setProcessingId(orderId)
      const statusInt = parseInt(newStatusValue)
      
      try {
        // المحاولة الأولى: استخدام الـ Endpoint المباشر المحدد
        await axiosInstance.put(`/Orders/${orderId}/status?status=${statusInt}`)
      } catch (directErr) {
        // محاولة احتياطية: إرسال Body
        await axiosInstance.put(`/Orders/${orderId}/status`, { status: statusInt })
      }

      await fetchOrders()
    } catch (err) {
      console.error('خطأ أثناء تغيير الحالة:', err)
      alert('حدث خطأ أثناء تحديث حالة الطلب.')
    } finally {
      setProcessingId(null)
    }
  }

  // دالة طباعة الفاتورة الرسمية للطلب
  function handlePrintInvoice(order) {
    const rawItems = order.items || order.orderDetails || order.orderItems || []
    const items = Array.isArray(rawItems) ? rawItems : (rawItems.$values || [])

    const printWindow = window.open('', '_blank', 'width=850,height=900')
    if (!printWindow) return

    const itemsRows = items.map((item, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">
          ${item.productName || item.name || item.product?.name || 'صنف عالي الجودة'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-family: monospace;">
          ${formatCurrency(item.unitPrice || item.price || 0)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-family: monospace; font-weight: bold;">
          ${formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 1))}
        </td>
      </tr>
    `).join('')

    const invoiceHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة طلب ${order.orderNumber || `ORD-${order.id}`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; margin: 0; padding: 24px; color: #1f2937; background: #fff; }
          .invoice-card { max-width: 800px; margin: auto; border: 1px solid #e5e7eb; padding: 28px; border-radius: 16px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
          .brand-title { font-size: 24px; font-weight: 800; color: #059669; margin: 0; }
          .brand-subtitle { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 24px; font-size: 13px; border: 1px solid #f3f4f6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #f3f4f6; padding: 12px 10px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 700; }
          .summary-box { margin-right: auto; max-width: 320px; font-size: 13px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .summary-row.total { font-size: 16px; font-weight: 800; border-bottom: 2px solid #059669; color: #059669; padding-top: 12px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #6b7280; }
          @media print {
            body { padding: 0; }
            .invoice-card { border: none; padding: 0; }
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
            <div style="text-align: left;">
              <h2 style="margin: 0; font-size: 18px; color: #111827;">فاتورة مبيعات أونلاين</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #059669; font-family: monospace; font-weight: bold;">
                #${order.orderNumber || `ORD-${order.id}`}
              </p>
            </div>
          </div>

          <div class="grid-details">
            <div>
              <strong style="color: #111827;">بيانات العميل والشحن:</strong><br>
              <strong>الاسم:</strong> ${order.customerName || order.customer?.fullName || 'عميل كاش'}<br>
              <strong>الهاتف:</strong> ${order.phone || order.customer?.phoneNumber || '-'}<br>
              <strong>العنوان:</strong> ${order.shippingAddress || order.address || 'استلام من المعرض'}
            </div>
            <div>
              <strong style="color: #111827;">معلومات الطلب:</strong><br>
              <strong>التاريخ:</strong> ${new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString('ar-EG')}<br>
              <strong>حالة الطلب:</strong> ${order.statusText || order.status || 'معتمد'}<br>
              <strong>طريقة الدفع:</strong> ${order.paymentMethod || 'الدفع عند الاستلام'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>الصنف / البيان</th>
                <th style="text-align: center; width: 60px;">الكمية</th>
                <th style="text-align: left; width: 110px;">سعر الوحدة</th>
                <th style="text-align: left; width: 110px;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows.length > 0 ? itemsRows : '<tr><td colSpan="5" style="text-align:center; padding: 20px; color: #6b7280;">تم تسجيل الطلب وإرفاق الأصناف بنجاح.</td></tr>'}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-row">
              <span>إجمالي المنتجات:</span>
              <span style="font-family: monospace;">${formatCurrency(order.subtotal || order.totalAmount || order.total || 0)}</span>
            </div>
            ${order.shippingCost ? `
            <div class="summary-row">
              <span>مصاريف الشحن:</span>
              <span style="font-family: monospace;">${formatCurrency(order.shippingCost)}</span>
            </div>
            ` : ''}
            <div class="summary-row total">
              <span>المبلغ الإجمالي المستحق:</span>
              <span style="font-family: monospace;">${formatCurrency(order.totalAmount || order.total || 0)}</span>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0; font-weight: bold;">شكراً لتسوقكم من متجر ابن الزمر — نسعد بخدمتكم دائماً</p>
            <p style="margin: 4px 0 0; font-size: 10px; color: #9ca3af;">تمت الطباعة بتاريخ: ${new Date().toLocaleString('ar-EG')}</p>
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

    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* ترويسة مركز العمليات */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">مركز عمليات متجر ابن الزمر</h1>
          <p className="text-xs text-ink-soft mt-1">إدارة الطلبات، استفسارات الورشة، ومناطق الشحن والمنتجات</p>
        </div>
        <button 
          onClick={activeTab === 'orders' ? fetchOrders : fetchShippingZones}
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
        >
          <RefreshCw size={14} /> تحديث البيانات
        </button>
      </div>

      {/* التبويبات الداخلية للعمليات */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('orders')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          الطلبات والأونلاين
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'inquiries' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          استفسارات الورشة
        </button>
        <button
          onClick={() => setActiveTab('shipping')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'shipping' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          إدارة مناطق الشحن
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeTab === 'products' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          ظهور المنتجات
        </button>
      </div>

      {/* محتوى التبويب النشط */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-emerald-600" /></div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-red-700 text-sm border border-red-200">{error}</div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
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
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" className="py-12 text-center text-ink-soft">لا توجد طلبات أونلاين مسجلة حالياً.</td></tr>
                  ) : (
                    orders.map(order => {
                      const currentStatus = order.status ?? order.statusValue ?? 1
                      
                      return (
                        <tr key={order.id} className="hover:bg-canvas/50 transition">
                          <td className="p-4 font-mono font-bold text-emerald-600">{order.orderNumber || `ORD-${order.id}`}</td>
                          <td className="p-4">
                            <div className="font-bold text-ink">{order.customerName || 'عميل'}</div>
                            <div className="font-mono text-[11px] text-ink-soft">{order.phone || '-'}</div>
                          </td>
                          <td className="p-4 max-w-xs truncate text-ink-soft">{order.shippingAddress || '-'}</td>
                          <td className="p-4 font-mono font-bold text-ink">{formatCurrency(order.totalAmount || order.total || 0)}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900 border border-amber-200">
                              <Clock size={12} /> {order.statusText || `حالة (${currentStatus})`}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* زر طباعة الفاتورة */}
                              <button
                                onClick={() => handlePrintInvoice(order)}
                                className="inline-flex items-center gap-1 rounded-lg bg-surface border border-border px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
                                title="طباعة الفاتورة"
                              >
                                <Printer size={12} className="text-emerald-600" />
                                فاتورة
                              </button>

                              {/* قائمة اختيار حالة الطلب المباشرة */}
                              <div className="relative inline-block">
                                {processingId === order.id ? (
                                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                    <Loader2 size={12} className="animate-spin text-emerald-600" />
                                    جاري التحديث...
                                  </div>
                                ) : (
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                    className="rounded-lg bg-emerald-600 text-white font-semibold text-[11px] px-3 py-1.5 outline-none cursor-pointer hover:bg-emerald-700 transition border-none shadow-xs text-center appearance-none pl-6 relative"
                                    style={{ backgroundImage: 'none' }}
                                  >
                                    <option value="" disabled className="bg-white text-gray-400">اختر حالة الطلب...</option>
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inquiries' && (
        <Card title="استفسارات الورشة وطلبات المعدات الخاصة">
          <p className="text-xs text-ink-soft py-6 text-center">لا توجد استفسارات ورشة جديدة معلقة في الوقت الحالي.</p>
        </Card>
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-6">
          <Card title="إضافة منطقة شحن جديدة">
            <form onSubmit={handleAddZone} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">اسم المحافظة / المنطقة</label>
                <input 
                  type="text" 
                  value={newZone.name} 
                  onChange={e => setNewZone({...newZone, name: e.target.value})}
                  placeholder="مثال: الإسكندرية"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">تكلفة الشحن (ج.م)</label>
                <input 
                  type="number" 
                  value={newZone.price} 
                  onChange={e => setNewZone({...newZone, price: e.target.value})}
                  placeholder="50"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">مدة التوصيل (أيام)</label>
                <input 
                  type="number" 
                  value={newZone.estimatedDays} 
                  onChange={e => setNewZone({...newZone, estimatedDays: e.target.value})}
                  placeholder="2"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600"
                />
              </div>
              <button 
                type="submit" 
                disabled={addingZone}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                {addingZone ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                إضافة المنطقة
              </button>
            </form>
          </Card>

          <Card title="قائمة مناطق الشحن الحالية في قاعدة البيانات">
            {loadingZones ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-emerald-600" /></div>
            ) : (
              <table className="w-full text-right text-xs mt-2">
                <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                  <tr>
                    <th className="p-3">المنطقة / المحافظة</th>
                    <th className="p-3">تكلفة الشحن</th>
                    <th className="p-3">مدة التوصيل التقريبية</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shippingZones.length === 0 ? (
                    <tr><td colSpan="4" className="py-8 text-center text-ink-soft">لا توجد مناطق شحن مضافة حتى الآن.</td></tr>
                  ) : (
                    shippingZones.map(zone => (
                      <tr key={zone.id} className="hover:bg-canvas/50">
                        <td className="p-3 font-bold text-ink">{zone.name || zone.governorate}</td>
                        <td className="p-3 font-mono">{formatCurrency(zone.shippingCost ?? zone.shippingFee ?? zone.price ?? 0)}</td>
                        <td className="p-3">{zone.estimatedDays ? `${zone.estimatedDays} أيام` : 'غير محدد'}</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleDeleteZone(zone.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="حذف المنطقة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'products' && (
        <Card title="التحكم في ظهور ونشر المنتجات">
          <p className="text-xs text-ink-soft py-6 text-center">إدارة حالة توافر ونشر معدات الورش والعدد.</p>
        </Card>
      )}
    </div>
  )
}