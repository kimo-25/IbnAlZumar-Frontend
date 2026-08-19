import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Phone } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

export default function ChangePhoneModal({
  isOpen,
  onClose,
  currentPhone,
  onOtpSent
}) {
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({
    success: null,
    error: null
  })

  useEffect(() => {
    if (isOpen) {
      setPhone('')
      setStatus({
        success: null,
        error: null
      })
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedPhone = phone.trim()

    if (!normalizedPhone) {
      setStatus({
        success: null,
        error: 'من فضلك أدخل رقم الهاتف.'
      })
      return
    }

    // Validation للأرقام المصرية
    const egyptianPhoneRegex = /^01[0125]\d{8}$/
    if (!egyptianPhoneRegex.test(normalizedPhone)) {
      setStatus({
        success: null,
        error: 'يرجى إدخال رقم هاتف مصري صحيح يتكون من 11 رقمًا (مثال: 01012345678).'
      })
      return
    }

    setSubmitting(true)
    setStatus({
      success: null,
      error: null
    })

    try {
      await axiosInstance.post('/Auth/send-phone-otp', {
        phone: normalizedPhone
      })

      setStatus({
        success: 'تم إرسال كود تحقق إلى رقم الهاتف الجديد.',
        error: null
      })

      if (onOtpSent) {
        onOtpSent(normalizedPhone)
      }

      setTimeout(onClose, 1200)
    } catch (err) {
      setStatus({
        success: null,
        error:
          err.response?.data?.message ||
          err.message ||
          'حدث خطأ أثناء إرسال كود التحقق.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <h3 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
          <Phone size={20} className="text-amber" />
          تغيير رقم الهاتف
        </h3>

        <p className="text-xs text-ink-soft mb-4">
          رقم الهاتف الحالي:{' '}
          <span className="font-semibold text-ink">
            {currentPhone || 'غير مسجل'}
          </span>
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
              <label className="block text-xs font-semibold text-ink mb-1">
                رقم الهاتف الجديد
              </label>

              <input
                type="tel"
                inputMode="tel"
                required
                disabled={submitting}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="01xxxxxxxxx"
                autoComplete="tel"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Phone size={16} />
              )}
              إرسال كود التحقق
            </button>
          </form>
        )}
      </div>
    </div>
  )
}