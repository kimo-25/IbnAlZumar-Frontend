// File: src/pages/CustomerProfilePage.jsx

import { printInvoice } from '../../utils/printInvoice';
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Clock,
  AlertCircle,
  Loader2,
  User,
  Package,
  CheckCircle2,
  Phone,
  MapPin,
  Building2,
  Star,
  Check,
  XCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  RotateCcw,
  Ban,
  Lock,
  Mail
} from 'lucide-react'
import Card from '../../components/ui/Card'
import axiosInstance from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/catalog'
import { useAuth } from '../../context/AuthContext'

// ==========================================
// Constants & Helper Functions
// ==========================================
const TRACKING_STEPS = [
  { step: 1, label: 'قيد المراجعة' },
  { step: 2, label: 'تم التأكيد' },
  { step: 3, label: 'جاري التجهيز' },
  { step: 4, label: 'في الطريق إليك' },
  { step: 5, label: 'تم التوصيل' }
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
    if (status === -1 || status === 5) return -1
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
    return {
      label: 'تم إلغاء الطلب',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle
    }
  }
  if (step === 5) {
    return {
      label: 'تم التوصيل بنجاح',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    }
  }

  const label = TRACKING_STEPS[step - 1]?.label || 'قيد المراجعة'
  return {
    label,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Clock
  }
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('ar-EG')
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ==========================================
// Sub-Components
// ==========================================

function TrackingProgress({ currentStep, orderId, onCancel, isCanceling }) {
  if (currentStep === -1) {
    return (
      <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2 border border-rose-200">
        <XCircle size={18} className="shrink-0" />
        <span>تم إلغاء هذا الطلب. إذا كان لديك أي استفسار يرجى التواصل مع الدعم الفني.</span>
      </div>
    )
  }

  const progressPercentage = Math.max(
    0,
    Math.min(100, ((currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100)
  )

  return (
    <div className="rounded-2xl border border-border/80 bg-canvas/40 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-ink block">تتبع مراحل الشحنة</span>
        {currentStep === 1 && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isCanceling}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer disabled:opacity-50"
          >
            {isCanceling ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
            <span>إلغاء الطلب</span>
          </button>
        )}
      </div>

      <div className="relative py-2">
        <div className="absolute top-4 right-6 left-6 h-0.5 bg-border -z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-1 text-center relative z-10">
          {TRACKING_STEPS.map((s) => {
            const isCompleted = currentStep >= s.step
            const isCurrent = currentStep === s.step
            return (
              <div key={s.step} className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-surface text-ink-soft border border-border'
                  } ${isCurrent ? 'ring-4 ring-emerald-100 border-emerald-600 scale-105' : ''}`}
                >
                  {isCompleted ? <Check size={16} /> : s.step}
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
    </div>
  )
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
  onCancel,
  cancelingOrderId,
  onOpenReview,
  userInfo,
  onPrintInvoice
}) {
  const orderId = order.id ?? order.orderNumber
  const currentStep = getStepNumber(order.status)
  const items = order.items || order.orderItems || []
  const badge = getStatusBadge(order.statusText || order.status)
  const StatusIcon = badge.icon

  const shippingCost = order.shippingCost ?? calculateShippingCost(order.governorate || userInfo.governorate)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition hover:border-amber/40">
      <div
        onClick={onToggle}
        className="flex flex-wrap items-center justify-between gap-3 bg-canvas/80 p-4 border-b border-border text-xs cursor-pointer select-none"
      >
        <div className="flex items-center gap-4">
          <div>
            <span className="text-ink-soft block text-[11px]">رقم الطلب</span>
            <span className="font-mono font-bold text-emerald-600 text-sm">
              {order.orderNumber || `ORD-${order.id}`}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-ink-soft block text-[11px]">التاريخ</span>
            <span className="font-semibold text-ink">{formatDate(order.createdAt)}</span>
          </div>
          <div>
            <span className="text-ink-soft block text-[11px]">الإجمالي الكلي</span>
            <span className="font-mono font-bold text-ink text-sm">
              {formatCurrency(order.totalAmount || order.total || 0)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge.className}`}>
            <StatusIcon size={14} />
            {badge.label}
          </span>
          <button type="button" className="text-ink-soft hover:text-ink p-1">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          <TrackingProgress
            currentStep={currentStep}
            orderId={orderId}
            onCancel={() => onCancel(orderId)}
            isCanceling={cancelingOrderId === orderId}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const fullOrderData = {
                  ...order,
                  items: items,
                  shippingCost: shippingCost
                };
                const fullUserData = {
                  ...userInfo,
                  email: userInfo.email || order.email
                };
                onPrintInvoice(fullOrderData, fullUserData);
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
            >
              <Package size={16} />
              عرض الفاتورة
            </button>
          </div>

          {items.length > 0 && (
            <div>
              <span className="text-xs font-bold text-ink mb-3 block">منتجات الطلب ({items.length})</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item, idx) => (
                  <div key={item.id || item.productId || idx} className="flex items-center justify-between gap-3 rounded-xl bg-canvas p-3 border border-border/70">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center border border-border shrink-0">
                        <Package size={18} className="text-amber" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate">{item.productName || item.name || 'منتج'}</p>
                        <p className="text-[11px] text-ink-soft font-mono mt-0.5">
                          الكمية: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}
                        </p>
                      </div>
                    </div>

                    {currentStep === 5 && (
                      <button
                        type="button"
                        onClick={() => onOpenReview(item)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shrink-0 cursor-pointer"
                      >
                        <Star size={12} className="fill-emerald-600 text-emerald-600" />
                        أضف تقييماً
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-canvas p-3.5 flex items-center gap-2 text-xs text-ink border border-border/60">
              <MapPin size={16} className="text-emerald-600 shrink-0" />
              <span className="font-bold text-ink shrink-0">عنوان التوصيل:</span>
              <span className="truncate text-ink-soft">{order.shippingAddress || userInfo.address || 'العنوان المسجل بالحساب'}</span>
            </div>
            <div className="rounded-xl bg-canvas p-3.5 flex items-center justify-between text-xs text-ink border border-border/60">
              <span className="font-bold text-ink">تكلفة الشحن:</span>
              <span className="font-mono font-semibold text-emerald-600">{formatCurrency(shippingCost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
        productId: item?.productId || item?.id,
        rating,
        comment
      })
      setStatus({ success: 'تم إرسال تقييمك بنجاح! شكراً لمشاركتك.', error: null })
      setTimeout(onClose, 1800)
    } catch (err) {
      setStatus({ success: null, error: err.response?.data?.message || err.message || 'تعذر إرسال التقييم حالياً.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-ink-soft hover:text-ink cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-ink mb-1">إضافة تقييم للمنتج</h3>
        <p className="text-xs text-ink-soft mb-4">
          المنتج: <span className="font-semibold text-ink">{item?.productName || item?.name}</span>
        </p>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-2">تقييمك بالنجوم:</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      size={24}
                      className={star <= rating ? 'fill-amber text-amber' : 'text-border'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">تعليقك / رأيك بالمنتج:</label>
              <textarea
                rows={3}
                disabled={submitting}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas p-3 text-sm text-ink outline-none focus:border-amber transition resize-none disabled:opacity-60"
                placeholder="اكتب انطباعك عن جودة المنتج والتوصيل..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              إرسال التقييم
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Modal تغيير كلمة المرور
function ChangePasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
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
        confirmPassword: formData.confirmPassword
      })
      setStatus({ success: 'تم تغيير كلمة المرور بنجاح!', error: null })
      setTimeout(onClose, 1800)
    } catch (err) {
      setStatus({ success: null, error: err.response?.data?.message || err.message || 'حدث خطأ أثناء تغيير كلمة المرور.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-ink-soft hover:text-ink cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <Lock size={20} className="text-amber" />
          تغيير كلمة المرور
        </h3>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">كلمة المرور الحالية</label>
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
              <label className="block text-xs font-semibold text-ink mb-1">كلمة المرور الجديدة</label>
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
              <label className="block text-xs font-semibold text-ink mb-1">تأكيد كلمة المرور الجديدة</label>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              تحديث كلمة المرور
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Modal تغيير البريد الإلكتروني
function ChangeEmailModal({ isOpen, onClose, currentEmail, onSuccess }) {
  const [formData, setFormData] = useState({
    newEmail: '',
    password: ''
  })
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
        password: formData.password
      })
      
      const newEmailVal = formData.newEmail
      setStatus({ success: 'تم إرسال كود تحقق إلى البريد الإلكتروني الجديد.', error: null })
      
      // تمرير الإيميل الجديد وفتح مودل التحقق (أو الانتظار لإغلاق المودل الحالي)
      if (onSuccess) onSuccess(newEmailVal)
      
      setTimeout(onClose, 1800)
    } catch (err) {
      setStatus({ success: null, error: err.response?.data?.message || err.message || 'حدث خطأ أثناء تغيير البريد الإلكتروني.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-ink-soft hover:text-ink cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
          <Mail size={20} className="text-amber" />
          تغيير البريد الإلكتروني
        </h3>
        <p className="text-xs text-ink-soft mb-4">
          البريد الحالي: <span className="font-semibold text-ink">{currentEmail}</span>
        </p>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">البريد الإلكتروني الجديد</label>
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
              <label className="block text-xs font-semibold text-ink mb-1">كلمة المرور الحالية</label>
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              إرسال كود التحقق
            </button>
          </form>
        )}
      </div>
    </div>
  )
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 text-ink-soft hover:text-ink cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
          <Mail size={20} className="text-amber" />
          تغيير البريد الإلكتروني
        </h3>
        <p className="text-xs text-ink-soft mb-4">
          البريد الحالي: <span className="font-semibold text-ink">{currentEmail}</span>
        </p>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">البريد الإلكتروني الجديد</label>
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
              <label className="block text-xs font-semibold text-ink mb-1">كلمة المرور الحالية (للتأكيد)</label>
              <input
                type="password"
                required
                disabled={submitting}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              حفظ البريد الجديد
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

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
  }

  const { user: authUser, updateUser: updateAuthUser } = useAuth()
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    governorate: '',
    address: ''
  })

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)

  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState(null)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [cancelingOrderId, setCancelingOrderId] = useState(null)

  const [reviewModalItem, setReviewModalItem] = useState(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

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
            address: fetched.address || authUser?.address || ''
          })
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('فشل جلب بيانات الحساب من الخادم، يتم استخدام البيانات المحلية', err)
          if (authUser) {
            setUser({
              fullName: authUser.fullName || authUser.name || '',
              email: authUser.email || '',
              phone: authUser.phone || '',
              governorate: authUser.governorate || '',
              address: authUser.address || ''
            })
          }
        }
      }
    }

    fetchProfile()
    return () => controller.abort()
  }, [authUser])

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
      console.error('فشل جلب الطلبات', err)
      setOrdersError('حدث خطأ أثناء تحميل سجل الطلبات. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomerOrders()
  }, [fetchCustomerOrders])

  const toggleOrderExpand = (id) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  async function handleCancelOrder(orderId) {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')) return

    setCancelingOrderId(orderId)
    try {
      await axiosInstance.put(`/Orders/${orderId}/cancel`)
      setOrders((prev) =>
        prev.map((o) => {
          const currentId = o.id ?? o.orderNumber
          if (currentId === orderId) {
            return { ...o, status: -1, statusText: 'تم إلغاء الطلب' }
          }
          return o
        })
      )
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر إلغاء الطلب حالياً. يرجى التواصل مع الدعم.')
    } finally {
      setCancelingOrderId(null)
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    try {
      const response = await axiosInstance.put('/Auth/update-profile', user)
      const updatedData = response.data?.user || response.data || { ...user }

      const updatedUserObj = {
        ...user,
        fullName: updatedData.fullName || updatedData.name || user.fullName,
        phone: updatedData.phone || user.phone,
        governorate: updatedData.governorate || user.governorate,
        address: updatedData.address || user.address
      }

      setUser(updatedUserObj)

      const currentStored = JSON.parse(localStorage.getItem('user') || '{}')
      const newStoredData = { ...currentStored, ...updatedUserObj }
      localStorage.setItem('user', JSON.stringify(newStoredData))

      if (typeof updateAuthUser === 'function') {
        updateAuthUser(newStoredData)
      }

      setMessage({ type: 'success', text: 'تم تحديث البيانات وحفظها في الحساب بنجاح!' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'حدث خطأ أثناء التحديث.' })
    } finally {
      setUpdating(false)
    }
  }

  const handleReviewSubmit = async (reviewData) => {
    await axiosInstance.post('/Reviews', reviewData)
  }

  const handleEmailUpdated = (newEmail) => {
    const updated = { ...user, email: newEmail }
    setUser(updated)
    const currentStored = JSON.parse(localStorage.getItem('user') || '{}')
    const newStoredData = { ...currentStored, email: newEmail }
    localStorage.setItem('user', JSON.stringify(newStoredData))
    if (typeof updateAuthUser === 'function') {
      updateAuthUser(newStoredData)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10" dir="rtl">
      <div className="mb-6 border-b border-border pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            مرحباً، {user.fullName || 'عزيزنا العميل'} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            يمكنك متابعة حالة طلباتك الحالية والسابقة أو تعديل بيانات حسابك الشخصي.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-canvas p-1.5 rounded-2xl border border-border shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-graphite-900 text-white shadow-xs'
                : 'text-ink-soft hover:text-ink hover:bg-surface'
            }`}
          >
            <ShoppingBag size={15} />
            <span>طلباتي ومتابعة الشحنات</span>
            {orders.length > 0 && (
              <span className="bg-amber text-graphite-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {orders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-graphite-900 text-white shadow-xs'
                : 'text-ink-soft hover:text-ink hover:bg-surface'
            }`}
          >
            <User size={15} />
            <span>بيانات الحساب</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <Card title="سجل الطلبات وتتبع الحالة">
          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-amber" />
            </div>
          ) : ordersError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-rose-600 space-y-3">
              <AlertCircle size={36} />
              <p>{ordersError}</p>
              <button
                type="button"
                onClick={fetchCustomerOrders}
                className="inline-flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-canvas transition cursor-pointer"
              >
                <RotateCcw size={14} />
                إعادة المحاولة
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-ink-soft">
              <Package size={48} className="mb-3 text-border" />
              <p className="font-semibold text-base text-ink">لا توجد طلبات سابقة حتى الآن</p>
              <p className="mt-1 text-xs">عند قيامك بالشراء، ستظهر جميع الطلبات وحالاتها هنا لمتابعتها أولاً بأول.</p>
            </div>
          ) : (
            <div className="space-y-6">
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
        </Card>
      )}

      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card title="بيانات الحساب والملف الشخصي">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {message && (
                <div
                  className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">الاسم الكامل</label>
                <div className="relative">
                  <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    disabled={updating}
                    value={user.fullName}
                    onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-xl border border-border bg-surface py-2.5 pr-9 pl-3 text-sm text-ink-soft opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">رقم الهاتف</label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="tel"
                    disabled={updating}
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">المحافظة</label>
                <div className="relative">
                  <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    disabled={updating}
                    value={user.governorate}
                    onChange={(e) => setUser({ ...user, governorate: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                    placeholder="القاهرة، الإسكندرية..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">العنوان بالتفصيل</label>
                <div className="relative">
                  <MapPin size={16} className="absolute right-3 top-3 text-ink-soft" />
                  <textarea
                    rows={3}
                    disabled={updating}
                    value={user.address}
                    onChange={(e) => setUser({ ...user, address: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber resize-none transition disabled:opacity-60"
                    placeholder="تفاصيل العنوان..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-graphite-800 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {updating && <Loader2 size={16} className="animate-spin" />}
                حفظ التعديلات
              </button>
            </form>
          </Card>

          {/* قسم إعدادات الأمان والتسهيلات */}
          <Card title="الأمان وحساب المستخدم">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-3 text-xs font-semibold text-ink hover:bg-surface hover:border-amber transition cursor-pointer"
              >
                <Lock size={15} className="text-amber" />
                <span>تغيير كلمة المرور</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-3 text-xs font-semibold text-ink hover:bg-surface hover:border-amber transition cursor-pointer"
              >
                <Mail size={15} className="text-amber" />
                <span>تغيير البريد الإلكتروني</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal التقييم */}
      <ReviewModal
        isOpen={!!reviewModalItem}
        item={reviewModalItem}
        onClose={() => setReviewModalItem(null)}
        onSubmit={handleReviewSubmit}
      />

      {/* Modal كلمة المرور */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Modal البريد الإلكتروني */}
      <ChangeEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={user.email}
        onSuccess={handleEmailUpdated}
      />
    </div>
  )
}