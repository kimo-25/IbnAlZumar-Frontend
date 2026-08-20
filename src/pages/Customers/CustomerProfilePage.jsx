import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Phone,
  MapPin,
  Building2,
  Star,
  XCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Lock,
  Mail,
} from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/catalog'
import { printInvoice } from '../../utils/printInvoice'

// ==========================================
// Constants & Helpers
// ==========================================
const TRACKING_STEPS = [
  { step: 1, label: 'قيد المراجعة' },
  { step: 2, label: 'تم التأكيد' },
  { step: 3, label: 'جاري التجهيز' },
  { step: 4, label: 'في الطريق إليك' },
  { step: 5, label: 'تم التوصيل' },
]

function calculateShippingCost(governorate) {
  if (!governorate) return 50
  const gov = governorate.trim().toLowerCase()
  if (gov.includes('إسكندرية') || gov.includes('alexandria')) return 40
  if (gov.includes('قاهرة') || gov.includes('cairo') || gov.includes('جيزة') || gov.includes('giza')) return 50
  return 70
}

function getStepNumber(status) {
  if (status === null || status === undefined) return 1
  if (typeof status === 'number') {
    if (status === -1) return -1
    if (status === 5) return 5
    if (status >= 0 && status <= 4) return status + 1
    return 1
  }
  const s = String(status).toLowerCase().trim()
  if (s.includes('cancel') || s.includes('ملغ') || s.includes('reject')) return -1
  if (s.includes('pending') || s.includes('مراجعة') || s.includes('انتظار')) return 1
  if (s.includes('confirm') || s.includes('تأكيد') || s.includes('مؤكد')) return 2
  if (s.includes('prep') || s.includes('process') || s.includes('تجهيز')) return 3
  if (s.includes('ship') || s.includes('way') || s.includes('طريق') || s.includes('شحن')) return 4
  if (s.includes('complet') || s.includes('deliver') || s.includes('تم') || s.includes('مكتمل') || s.includes('توصيل')) return 5
  return 1
}

function getStatusBadge(status) {
  const step = getStepNumber(status)
  if (step === -1) {
    return { label: 'تم إلغاء الطلب', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle }
  }
  if (step === 5) {
    return { label: 'تم التوصيل بنجاح', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle }
  }
  const label = TRACKING_STEPS[step - 1]?.label || 'قيد المراجعة'
  return { label, className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ==========================================
// Tracking Progress
// ==========================================
function TrackingProgress({ currentStep, onCancel, isCanceling }) {
  if (currentStep === -1) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 mb-4">
        <XCircle className="h-4 w-4 shrink-0" />
        تم إلغاء هذا الطلب. إذا كان لديك أي استفسار يرجى التواصل مع الدعم الفني.
      </div>
    )
  }

  const progressPercentage = Math.max(
    0,
    Math.min(100, ((currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100)
  )

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-ink">تتبع مراحل الشحنة</h4>
        {currentStep === 1 && (
          <button
            onClick={onCancel}
            disabled={isCanceling}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
          >
            {isCanceling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            إلغاء الطلب
          </button>
        )}
      </div>

      <div className="relative h-1.5 rounded-full bg-border mb-4">
        <div
          className="absolute inset-y-0 right-0 rounded-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-1">
        {TRACKING_STEPS.map((s) => {
          const isCompleted = currentStep >= s.step
          const isCurrent = currentStep === s.step
          return (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-surface text-ink-soft border border-border'
                } ${isCurrent ? 'ring-4 ring-emerald-100 border-emerald-600 scale-105' : ''}`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : s.step}
              </div>
              <span
                className={`mt-2 text-[10px] sm:text-[11px] leading-tight ${
                  isCompleted ? 'text-emerald-700 font-bold' : 'text-ink-soft'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==========================================
// Order Card
// ==========================================
function OrderCard({ order, isExpanded, onToggle, onCancel, cancelingOrderId, onOpenReview, userInfo, onPrintInvoice }) {
  const orderId = order.id ?? order.orderNumber
  const currentStep = getStepNumber(order.status)
  const items = order.items || order.orderItems || []
  const badge = getStatusBadge(order.statusText || order.status)
  const StatusIcon = badge.icon
  const shippingCost = order.shippingCost ?? calculateShippingCost(order.governorate || userInfo.governorate)

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex flex-wrap items-center justify-between gap-3 p-4 text-right cursor-pointer hover:bg-canvas/60 transition"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[11px] text-ink-soft">رقم الطلب</p>
            <p className="text-sm font-bold text-ink">{order.orderNumber || `#${orderId}`}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-soft">التاريخ</p>
            <p className="text-sm font-semibold text-ink">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-soft">الإجمالي الكلي</p>
            <p className="text-sm font-bold text-ink">{formatCurrency(order.totalAmount || order.total || 0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge.className}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {badge.label}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-ink-soft" /> : <ChevronDown className="h-4 w-4 text-ink-soft" />}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border p-4">
          <TrackingProgress
            currentStep={currentStep}
            onCancel={() => onCancel(orderId)}
            isCanceling={cancelingOrderId === orderId}
          />

          <button
            onClick={() => {
              const fullOrderData = { ...order, items, shippingCost }
              const fullUserData = { ...userInfo, email: userInfo.email || order.email }
              onPrintInvoice(fullOrderData, fullUserData)
            }}
            className="mb-4 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
          >
            عرض الفاتورة
          </button>

          {items.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-sm font-bold text-ink">منتجات الطلب ({items.length})</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-canvas border border-border p-3">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-4 w-4 text-ink-soft shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.productName || item.name || 'منتج'}</p>
                      <p className="text-xs text-ink-soft">
                        الكمية: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}
                      </p>
                    </div>
                  </div>
                  {currentStep === 5 && (
                    <button
                      onClick={() => onOpenReview({ ...item, orderId })}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shrink-0 cursor-pointer"
                    >
                      <Star className="h-3.5 w-3.5" />
                      أضف تقييماً
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-canvas border border-border p-3">
              <p className="text-ink-soft mb-1">عنوان التوصيل:</p>
              <p className="text-ink font-semibold">{order.shippingAddress || userInfo.address || 'العنوان المسجل بالحساب'}</p>
            </div>
            <div className="rounded-xl bg-canvas border border-border p-3">
              <p className="text-ink-soft mb-1">تكلفة الشحن:</p>
              <p className="text-ink font-semibold">{formatCurrency(shippingCost)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// Review Modal
// ==========================================
function ReviewModal({ isOpen, item, onClose, onSubmit }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ success: null, error: null })

  useEffect(() => {
    if (isOpen) {
      setRating(5)
      setComment('')
      setStatus({ success: null, error: null })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus({ success: null, error: null })
    try {
      await onSubmit({
        orderId: item?.orderId,
        productId: item?.productId || item?.id,
        rating,
        comment,
      })
      setStatus({ success: 'تم إرسال تقييمك بنجاح! شكراً لمشاركتك.', error: null })
      setTimeout(onClose, 1500)
    } catch (err) {
      setStatus({ success: null, error: err.response?.data?.message || err.message || 'تعذر إرسال التقييم حالياً.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button onClick={onClose} className="absolute top-4 left-4 text-ink-soft hover:text-ink cursor-pointer">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-ink mb-1">إضافة تقييم للمنتج</h3>
        <p className="text-xs text-ink-soft mb-4">المنتج: {item?.productName || item?.name}</p>

        {status.success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3">
            {status.success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {status.error}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-ink mb-2">تقييمك بالنجوم:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="p-1 hover:scale-110 transition cursor-pointer">
                    <Star className={`h-6 w-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-border'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink mb-2">تعليقك / رأيك بالمنتج:</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                disabled={submitting}
                className="w-full rounded-xl border border-border bg-canvas p-3 text-sm text-ink outline-none focus:border-amber transition resize-none disabled:opacity-60"
                placeholder="اكتب انطباعك عن جودة المنتج والتوصيل…"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              إرسال التقييم
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ==========================================
// Change Password Modal
// ==========================================
function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ success: null, error: null })

  useEffect(() => {
    if (isOpen) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setStatus({ success: null, error: null })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ success: null, error: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' })
      return
    }
    setSubmitting(true)
    setStatus({ success: null, error: null })
    try {
      await axiosInstance.post('/Auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      })
      setStatus({ success: 'تم تغيير كلمة المرور بنجاح!', error: null })
      setTimeout(onClose, 1500)
    } catch (err) {
      setStatus({ success: null, error: err.response?.data?.message || err.message || 'حدث خطأ أثناء تغيير كلمة المرور.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button onClick={onClose} className="absolute top-4 left-4 text-ink-soft hover:text-ink cursor-pointer">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-ink mb-4">تغيير كلمة المرور</h3>

        {status.success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3">
            {status.success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {status.error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {status.error}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">كلمة المرور الحالية</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              تحديث كلمة المرور
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ==========================================
// Change Email Modal
// ==========================================
function ChangeEmailModal({ isOpen, onClose, currentEmail, onSuccess }) {
  const [formData, setFormData] = useState({ newEmail: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ success: null, error: null })

  useEffect(() => {
    if (isOpen) {
      setFormData({ newEmail: '', password: '' })
      setStatus({ success: null, error: null })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus({ success: null, error: null })
    try {
      await axiosInstance.post('/Auth/change-email', {
        newEmail: formData.newEmail,
        password: formData.password,
      })
      setStatus({ success: 'تم إرسال كود تحقق إلى البريد الإلكتروني الجديد.', error: null })
      if (onSuccess) onSuccess(formData.newEmail)
      setTimeout(onClose, 1500)
    } catch (err) {
      setStatus({ success: null, error: err.response?.data?.message || err.message || 'حدث خطأ أثناء تغيير البريد الإلكتروني.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button onClick={onClose} className="absolute top-4 left-4 text-ink-soft hover:text-ink cursor-pointer">
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-ink mb-1">تغيير البريد الإلكتروني</h3>
        <p className="text-xs text-ink-soft mb-4">البريد الحالي: {currentEmail}</p>

        {status.success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3">
            {status.success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {status.error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {status.error}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">البريد الإلكتروني الجديد</label>
              <input
                type="email"
                required
                disabled={submitting}
                value={formData.newEmail}
                onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="example@domain.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">كلمة المرور الحالية (للتأكيد)</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer mt-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              إرسال كود التحقق
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ==========================================
// Main Component
// ==========================================
export default function CustomerProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'profile' ? 'profile' : 'orders'
  const handleTabChange = (tab) => setSearchParams({ tab })

  const { user: authUser, updateUser: updateAuthUser } = useAuth()
  const [user, setUser] = useState({ fullName: '', email: '', phone: '', governorate: '', address: '' })

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [cancelingOrderId, setCancelingOrderId] = useState(null)

  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState(null)
  const messageTimerRef = useRef(null)

  const [reviewModalItem, setReviewModalItem] = useState(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const showMessage = (type, text) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    setMessage({ type, text })
    messageTimerRef.current = setTimeout(() => setMessage(null), 4000)
  }

  useEffect(() => () => messageTimerRef.current && clearTimeout(messageTimerRef.current), [])

  // جلب بيانات الحساب
  useEffect(() => {
    const controller = new AbortController()
    async function fetchProfile() {
      try {
        const response = await axiosInstance.get('/Auth/profile', { signal: controller.signal })
        if (response.data) {
          const fetched = response.data
          setUser({
            fullName: fetched.fullName || fetched.name || authUser?.fullName || '',
            email: fetched.email || authUser?.email || '',
            phone: fetched.phone || authUser?.phone || '',
            governorate: fetched.governorate || authUser?.governorate || '',
            address: fetched.address || authUser?.address || '',
          })
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && authUser) {
          setUser({
            fullName: authUser.fullName || authUser.name || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            governorate: authUser.governorate || '',
            address: authUser.address || '',
          })
        }
      }
    }
    fetchProfile()
    return () => controller.abort()
  }, [authUser])

  // جلب الطلبات
  const fetchCustomerOrders = useCallback(async () => {
    setLoadingOrders(true)
    setOrdersError(null)
    try {
      const response = await axiosInstance.get('/Orders/my-orders')
      const data = Array.isArray(response.data) ? response.data : []
      setOrders(data)
      if (data.length > 0) {
        const firstId = data[0].id ?? data[0].orderNumber
        setExpandedOrders({ [firstId]: true })
      }
    } catch (err) {
      setOrdersError('حدث خطأ أثناء تحميل سجل الطلبات. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomerOrders()
  }, [fetchCustomerOrders])

  const toggleOrderExpand = (id) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleCancelOrder(orderId) {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')) return
    setCancelingOrderId(orderId)
    try {
      await axiosInstance.put(`/Orders/${orderId}/cancel`)
      setOrders((prev) =>
        prev.map((o) => {
          const currentId = o.id ?? o.orderNumber
          return currentId === orderId ? { ...o, status: -1, statusText: 'تم إلغاء الطلب' } : o
        })
      )
      showMessage('success', 'تم إلغاء الطلب بنجاح')
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'تعذر إلغاء الطلب حالياً. يرجى التواصل مع الدعم.')
    } finally {
      setCancelingOrderId(null)
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setUpdating(true)
    try {
      const response = await axiosInstance.put('/Auth/update-profile', user)
      const updatedData = response.data?.user || response.data || {}
      const updatedUserObj = {
        ...user,
        fullName: updatedData.fullName || updatedData.name || user.fullName,
        phone: updatedData.phone || user.phone,
        governorate: updatedData.governorate || user.governorate,
        address: updatedData.address || user.address,
      }
      setUser(updatedUserObj)

      const currentStored = JSON.parse(localStorage.getItem('user') || '{}')
      const newStoredData = { ...currentStored, ...updatedUserObj }
      localStorage.setItem('user', JSON.stringify(newStoredData))
      if (typeof updateAuthUser === 'function') updateAuthUser(newStoredData)

      showMessage('success', 'تم تحديث البيانات وحفظها في الحساب بنجاح!')
    } catch (err) {
      showMessage('error', err.response?.data?.message || err.message || 'حدث خطأ أثناء التحديث.')
    } finally {
      setUpdating(false)
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    await axiosInstance.post('/Reviews', reviewData)
    setOrders((prev) =>
      prev.map((order) => {
        const items = order.items || order.orderItems || []
        const updatedItems = items.map((item) =>
          (item.productId || item.id) === reviewData.productId ? { ...item, hasReviewed: true } : item
        )
        return { ...order, items: updatedItems, orderItems: updatedItems }
      })
    )
  }

  const handleEmailUpdated = (newEmail) => {
    const updated = { ...user, email: newEmail }
    setUser(updated)
    const currentStored = JSON.parse(localStorage.getItem('user') || '{}')
    const newStoredData = { ...currentStored, email: newEmail }
    localStorage.setItem('user', JSON.stringify(newStoredData))
    if (typeof updateAuthUser === 'function') updateAuthUser(newStoredData)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">مرحباً، {user.fullName || 'عزيزنا العميل'} 👋</h1>
        <p className="text-sm text-ink-soft mt-1">يمكنك متابعة حالة طلباتك الحالية والسابقة أو تعديل بيانات حسابك الشخصي.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => handleTabChange('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'orders' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          طلباتي ومتابعة الشحنات
          {orders.length > 0 && (
            <span className="bg-canvas border border-border text-[10px] px-1.5 py-0.5 rounded-full">{orders.length}</span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'profile' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-ink-soft hover:text-ink'
          }`}
        >
          <User className="h-4 w-4" />
          بيانات الحساب
        </button>
      </div>

      {/* Flash message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div>
          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-ink-soft" />
            </div>
          ) : ordersError ? (
            <div className="text-center py-16">
              <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-ink-soft mb-3">{ordersError}</p>
              <button
                onClick={fetchCustomerOrders}
                className="text-sm font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-8 w-8 text-ink-soft mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink mb-1">لا توجد طلبات سابقة حتى الآن</p>
              <p className="text-xs text-ink-soft">عند قيامك بالشراء، ستظهر جميع الطلبات وحالاتها هنا لمتابعتها أولاً بأول.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, idx) => {
                const orderKey = order.id ?? order.orderNumber ?? idx
                return (
                  <OrderCard
                    key={orderKey}
                    order={order}
                    isExpanded={!!expandedOrders[orderKey]}
                    onToggle={() => toggleOrderExpand(orderKey)}
                    onCancel={handleCancelOrder}
                    cancelingOrderId={cancelingOrderId}
                    onOpenReview={(item) => setReviewModalItem(item)}
                    userInfo={user}
                    onPrintInvoice={printInvoice}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
              <input
                value={user.fullName}
                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
              <input
                value={user.email}
                disabled
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink-soft outline-none disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
              <input
                value={user.phone}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">المحافظة</label>
            <div className="relative">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
              <input
                value={user.governorate}
                onChange={(e) => setUser({ ...user, governorate: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="القاهرة، الإسكندرية…"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink mb-1 block">العنوان بالتفصيل</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-3 h-4 w-4 text-ink-soft" />
              <textarea
                value={user.address}
                onChange={(e) => setUser({ ...user, address: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber resize-none transition disabled:opacity-60"
                placeholder="تفاصيل العنوان…"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer"
          >
            {updating && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ التعديلات
          </button>

          {/* أمان الحساب */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-3 text-xs font-semibold text-ink hover:bg-surface hover:border-amber transition cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              تغيير كلمة المرور
            </button>
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-3 text-xs font-semibold text-ink hover:bg-surface hover:border-amber transition cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              تغيير البريد الإلكتروني
            </button>
          </div>
        </form>
      )}

      {/* Modals */}
      <ReviewModal
        isOpen={!!reviewModalItem}
        item={reviewModalItem}
        onClose={() => setReviewModalItem(null)}
        onSubmit={handleReviewSubmit}
      />
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <ChangeEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={user.email}
        onSuccess={handleEmailUpdated}
      />
    </div>
  )
}