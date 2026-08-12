// File: src/pages/Operations/OperationsHubPage.jsx
import { useState, useEffect } from 'react'
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MessageSquare, 
  MapPin, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Printer,
  Check,
  Plus,
  Trash2
} from 'lucide-react'
import Card from '../../components/ui/Card'
import { formatCurrency } from '../../utils/catalog'
import { getOnlineOrders, advanceOnlineOrderStatus } from '../../api/adminApi'
import axiosInstance from '../../api/axiosInstance'

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
      await axiosInstance.post('/ShippingZones', {
        name: newZone.name,
        price: parseFloat(newZone.price),
        estimatedDays: parseInt(newZone.estimatedDays || 1)
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

  async function handleAdvanceStatus(orderId) {
    try {
      setProcessingId(orderId)
      await advanceOnlineOrderStatus(orderId)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert('حدث خطأ أثناء تحديث حالة الطلب.')
    } finally {
      setProcessingId(null)
    }
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
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length === 0 ? (
                    <tr><td colSpan="6" className="py-12 text-center text-ink-soft">لا توجد طلبات أونلاين مسجلة حالياً.</td></tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-canvas/50 transition">
                        <td className="p-4 font-mono font-bold text-emerald-600">{order.orderNumber || `ORD-${order.id}`}</td>
                        <td className="p-4">
                          <div className="font-bold text-ink">{order.customerName || 'عميل'}</div>
                          <div className="font-mono text-[11px] text-ink-soft">{order.phone || '-'}</div>
                        </td>
                        <td className="p-4 max-w-xs truncate text-ink-soft">{order.shippingAddress || '-'}</td>
                        <td className="p-4 font-mono font-bold text-ink">{formatCurrency(order.totalAmount || order.total || 0)}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-[11px] font-bold text-amber-900">
                            <Clock size={12} /> {order.statusText || order.status || 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleAdvanceStatus(order.id)}
                            disabled={processingId === order.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                          >
                            {processingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            ترقية الحالة
                          </button>
                        </td>
                      </tr>
                    ))
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
                        <td className="p-3 font-bold text-ink">{zone.name}</td>
                        <td className="p-3 font-mono">{formatCurrency(zone.price || 0)}</td>
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