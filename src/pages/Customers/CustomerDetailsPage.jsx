// File: src/pages/Customers/CustomerDetailsPage.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ArrowRight, ShoppingBag, Phone, Mail, MapPin, Wallet } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { getCustomers } from '../../api/adminApi'

export default function CustomerDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    // جلب قائمة العملاء كاملة ثم مطابقة العميل حسب الـ ID لتجنب أخطاء الـ 404
    getCustomers()
      .then((data) => {
        if (!active) return
        const items = Array.isArray(data) ? data : (data?.items || data?.Items || data?.data || data?.Data || [])
        const found = items.find(c => String(c.id ?? c.Id) === String(id))
        
        if (found) {
          setCustomer(found)
        } else {
          setError('لم يتم العثور على بيانات العميل المطلوبة')
        }
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'تعذر تحميل بيانات العميل')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-ink-soft">
        <Loader2 className="animate-spin" size={18} />
        جاري تحميل تفاصيل العميل...
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 py-12">
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error || 'لم يتم العثور على بيانات العميل'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl bg-graphite-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowRight size={16} /> رجوع
        </button>
      </div>
    )
  }

  const orders = customer.orders || customer.Orders || []
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0)
  const currentBalance = Number(customer.currentBalance ?? customer.CurrentBalance ?? 0)

  return (
    <div className="space-y-6">
      {/* رأس الصفحة وزر الرجوع */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
          >
            <ArrowRight size={16} />
            العودة للعملاء
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink" dir="auto">{customer.fullName || customer.FullName}</h1>
            <p className="text-sm text-ink-soft">سجل المعاملات والطلبات الخاصة بالعميل</p>
          </div>
        </div>
      </div>

      {/* كروت الملخص الإحصائي */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3 text-ink-soft mb-1">
            <ShoppingBag size={18} className="text-amber" />
            <span className="text-xs font-medium">إجمالي المشتريات</span>
          </div>
          <div className="text-2xl font-bold font-mono text-ink" dir="ltr">
            EGP {totalSpent.toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3 text-ink-soft mb-1">
            <Wallet size={18} className="text-danger" />
            <span className="text-xs font-medium">المديونية الحالية (الشكك)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-danger" dir="ltr">
            EGP {currentBalance.toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3 text-ink-soft mb-1">
            <ShoppingBag size={18} className="text-primary" />
            <span className="text-xs font-medium">عدد الطلبات الكلي</span>
          </div>
          <div className="text-2xl font-bold font-mono text-ink" dir="ltr">
            {orders.length} طلبات
          </div>
        </div>
      </div>

      {/* بيانات الاتصال والمعلومات */}
      <Card title="بيانات العميل">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <div className="flex items-center gap-2 text-ink-soft">
            <Phone size={16} />
            <span className="font-medium text-ink" dir="auto">{customer.phone || customer.Phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-ink-soft">
            <Mail size={16} />
            <span className="font-medium text-ink" dir="auto">{customer.email || customer.Email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-ink-soft">
            <MapPin size={16} />
            <span className="font-medium text-ink" dir="auto">{customer.address || customer.Address || '—'}</span>
          </div>
        </div>
      </Card>

      {/* جدول الطلبات السابقة */}
      <Card title="سجل الطلبات السابقة">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="لا توجد طلبات سابقة"
            description="لم يقم هذا العميل بإجراء أي طلبات شراء مسجلة حتى الآن."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-ink-soft">
                  <th className="pb-2 pl-4 font-medium">رقم الطلب</th>
                  <th className="pb-2 pl-4 font-medium">التاريخ</th>
                  <th className="pb-2 pl-4 font-medium">طريقة الدفع</th>
                  <th className="pb-2 pl-4 font-medium">قيمة الطلب</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord, idx) => (
                  <tr key={ord.id || idx} className="border-b border-border last:border-0">
                    <td className="py-3 pl-4 font-medium font-mono text-ink" dir="ltr">
                      #{ord.orderNumber || ord.id}
                    </td>
                    <td className="py-3 pl-4 text-ink-soft">
                      {ord.orderDate || ord.createdAt ? new Date(ord.orderDate || ord.createdAt).toLocaleDateString('ar-EG') : '—'}
                    </td>
                    <td className="py-3 pl-4 text-ink-soft" dir="auto">
                      {ord.paymentMethod || '—'}
                    </td>
                    <td className="py-3 pl-4 font-mono tabular-nums font-semibold text-ink" dir="ltr">
                      EGP {Number(ord.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}