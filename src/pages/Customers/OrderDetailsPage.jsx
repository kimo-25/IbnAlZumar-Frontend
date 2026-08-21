// File: src/pages/Customers/OrderDetailsPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Package,
  Clock,
  Check,
  MapPin,
  User,
  Phone,
  Printer,
  Loader2,
  AlertCircle,
  XCircle,
  RotateCcw,
  X
} from 'lucide-react'
import Card from '../../components/ui/Card'
import axiosInstance from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/catalog'
import { printInvoice } from '../../utils/printInvoice'
import { requestOrderCancellation } from '../../api/storefrontApi'

const TRACKING_STEPS = [
  { step: 1, label: 'قيد المراجعة', description: 'تم استلام طلبك وجاري مراجعته' },
  { step: 2, label: 'تم التأكيد', description: 'تم تأكيد طلبك وقبوله' },
  { step: 3, label: 'جاري التجهيز', description: 'يتم الآن تجهيز المنتجات للتغليف' },
  { step: 4, label: 'في الطريق إليك', description: 'الطلب مع مندوب الشحن حالياً' },
  { step: 5, label: 'تم التوصيل بنجاح', description: 'تم تسليم الشحنة بنجاح' }
]

function getStepNumber(status) {
  if (status === null || status === undefined) return 1

  if (typeof status === 'string') {
    const s = status.toLowerCase()
    if (s.includes('cancel') || s.includes('ملغ') || s.includes('رفض') || s.includes('reject')) return -1
    if (s.includes('pending') || s.includes('مراجعة')) return 1
    if (s.includes('confirm') || s.includes('تأكيد')) return 2
    if (s.includes('prep') || s.includes('process') || s.includes('تجهيز')) return 3
    if (s.includes('ship') || s.includes('way') || s.includes('طريق')) return 4
    if (s.includes('complet') || s.includes('deliver') || s.includes('تم')) return 5
  }

  if (typeof status === 'number') {
    if (status === -1 || status === 5) return -1
    if (status >= 0 && status <= 4) return status + 1
    if (status >= 1 && status <= 5) return status
  }

  return 1
}

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // حالات مودال طلب الإلغاء مع السبب
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  async function fetchOrderDetails() {
    try {
      setLoading(true)
      setError(null)
      try {
        const response = await axiosInstance.get(`/Orders/${orderId}`)
        setOrder(response.data)
        return
      } catch {
        const myOrdersRes = await axiosInstance.get('/Orders/my-orders')
        const list = myOrdersRes.data
        const ordersArray = Array.isArray(list) ? list : (list.$values || list.data || [])
        const found = ordersArray.find(
          (o) => String(o.id) === String(orderId) || o.orderNumber === orderId
        )
        if (found) {
          setOrder(found)
        } else {
          setError('لم نتمكن من العثور على تفاصيل هذا الطلب.')
        }
      }
    } catch (err) {
      console.error(err)
      setError('تعذر الاتصال بالخادم.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelSubmit() {
    if (!cancelReason.trim()) {
      alert('يرجى كتابة سبب الإلغاء.')
      return
    }
    try {
      setCanceling(true)
      await requestOrderCancellation(order.id || orderId, cancelReason)
      alert('تم إرسال طلب الإلغاء بنجاح للمراجعة.')
      setShowCancelModal(false)
      setCancelReason('')
      await fetchOrderDetails()
    } catch (err) {
      alert(err?.response?.data?.message || 'حدث خطأ أثناء إرسال طلب الإلغاء.')
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center" dir="rtl">
        <AlertCircle size={48} className="mx-auto mb-4 text-danger" />
        <h2 className="text-xl font-bold text-ink">خطأ في عرض الطلب</h2>
        <p className="mt-2 text-sm text-ink-soft">{error || 'الطلب غير موجود'}</p>
        <button
          onClick={() => navigate('/profile')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-graphite-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800"
        >
          <ArrowRight size={16} /> العودة إلى البروفايل
        </button>
      </div>
    )
  }

  const stepVal = getStepNumber(order.status)
  const isCancelled = stepVal === -1
  const currentStep = isCancelled ? 1 : Math.min(Math.max(stepVal, 1), 5)
  const items = order.items || order.orderItems || []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10" dir="rtl">
      {/* شريط الإجراءات العلوي */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-amber transition"
        >
          <ArrowRight size={18} /> العودة لسجل الطلبات
        </Link>
        <div className="flex items-center gap-2">
          {currentStep === 1 && !isCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              <RotateCcw size={15} />
              طلب إلغاء الطلب
            </button>
          )}
          <button
            onClick={() => printInvoice(order)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Printer size={16} />
            طباعة / حفظ الفاتورة (PDF)
          </button>
        </div>
      </div>

      {/* الترويسة الرئيسية */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs text-ink-soft">رقم الطلب</span>
            <h1 className="text-2xl font-bold font-mono text-emerald-600">
              {order.orderNumber || `ORD-2026-${order.id}`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                isCancelled
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber/15 text-amber-900'
              }`}
            >
              {isCancelled ? <XCircle size={14} /> : <Clock size={14} />}
              {order.statusText || order.status || (isCancelled ? 'ملغى' : 'قيد المراجعة')}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-ink-soft block">تاريخ الطلب</span>
            <span className="font-semibold text-ink">
              {new Date(order.createdAt || Date.now()).toLocaleDateString('ar-EG')}
            </span>
          </div>
          <div>
            <span className="text-ink-soft block">طريقة الدفع</span>
            <span className="font-semibold text-ink">الدفع عند الاستلام</span>
          </div>
          <div>
            <span className="text-ink-soft block">عدد المنتجات</span>
            <span className="font-semibold text-ink">{items.length} منتج</span>
          </div>
          <div>
            <span className="text-ink-soft block">المبلغ الإجمالي</span>
            <span className="font-bold text-ink font-mono text-sm">
              {formatCurrency(order.totalAmount || order.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* تنبيه حالة الإلغاء إن وجدت */}
      {isCancelled && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <XCircle size={24} className="shrink-0" />
          <div>
            <h3 className="text-sm font-bold">هذا الطلب ملغى</h3>
            <p className="text-xs text-rose-600">تم إلغاء هذا الطلب ولا يمكن متابعة شحنه.</p>
          </div>
        </div>
      )}

      {/* مخطط التتبع التفاعلي (Stepper) */}
      {!isCancelled && (
        <Card title="مخطط تتبع حالة الشحنة" className="mb-8">
          <div className="py-4">
            <div className="relative flex items-center justify-between px-4">
              <div className="absolute left-8 right-8 top-4 h-1 bg-border -z-0" />
              <div
                className="absolute right-8 top-4 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />

              {TRACKING_STEPS.map((s) => {
                const isDone = s.step < currentStep
                const isCurrent = s.step === currentStep

                return (
                  <div key={s.step} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                          : 'bg-canvas text-ink-soft border border-border'
                      }`}
                    >
                      {isDone ? <Check size={16} /> : s.step}
                    </div>
                    <span
                      className={`mt-3 text-xs font-bold text-center ${
                        isCurrent || isDone ? 'text-ink' : 'text-ink-soft'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="mt-1 hidden text-[10px] text-ink-soft text-center sm:block max-w-[90px]">
                      {s.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* تفاصيل المنتجات والمشتريات */}
        <div className="lg:col-span-2">
          <Card title="محتويات الشحنة والمنتجات">
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center border border-border shrink-0">
                      <Package size={18} className="text-ink-soft" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{item.productName || item.name || 'منتج'}</p>
                      <p className="text-xs text-ink-soft font-mono">الكمية: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-left font-mono font-bold text-sm text-ink shrink-0">
                    {formatCurrency((item.unitPrice || item.price || 0) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* معلومات التوصيل والعنوان */}
        <div className="lg:col-span-1">
          <Card title="بيانات التوصيل والعميل">
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-2.5">
                <User size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-soft block font-medium">اسم المستلم</span>
                  <span className="font-bold text-ink text-sm">{order.customerName || order.fullName || 'العميل'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-soft block font-medium">رقم الهاتف</span>
                  <span className="font-semibold text-ink font-mono">{order.phone || order.customerPhone || 'غير محدد'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-soft block font-medium">عنوان التوصيل</span>
                  <span className="font-medium text-ink leading-relaxed">
                    {order.shippingAddress || order.address || order.location || order.shippingLocation || order.user?.address || order.customer?.address || '-'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal طلب الإلغاء مع السبب */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCancelModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
          >
            <button onClick={() => setShowCancelModal(false)} className="absolute top-4 left-4 text-ink-soft hover:text-ink cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-ink mb-1">طلب إلغاء الطلب</h3>
            <p className="text-xs text-ink-soft mb-4">يرجى توضيح سبب إلغاء الطلب ليتم مراجعته من قِبل الإدارة.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink mb-1 block">سبب الإلغاء *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={canceling}
                  placeholder="اكتب سبب الإلغاء هنا..."
                  className="w-full rounded-xl border border-border bg-canvas p-3 text-sm text-ink outline-none focus:border-amber resize-none transition disabled:opacity-60"
                />
              </div>

              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={canceling}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition disabled:opacity-60 cursor-pointer"
              >
                {canceling && <Loader2 size={16} className="animate-spin" />}
                إرسال طلب الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}