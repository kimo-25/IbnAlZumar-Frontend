import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, ShieldCheck, X } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'

export default function VerifyEmailModal({
  isOpen,
  newEmail,
  onClose,
  onVerified
}) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState({ success: null, error: null })
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCode('')
      setStatus({ success: null, error: null })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus({ success: null, error: null })

    try {
      const res = await axiosInstance.post('/Auth/verify-new-email', {
        newEmail,
        code
      })

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token)
      }

      setStatus({
        success: 'تم تأكيد البريد الإلكتروني الجديد بنجاح!',
        error: null
      })

      setTimeout(() => {
        onVerified(newEmail, res.data?.token)
      }, 1200)
    } catch (err) {
      setStatus({
        success: null,
        error:
          err.response?.data?.message ||
          err.message ||
          'كود التحقق غير صحيح أو منتهي الصلاحية.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setStatus({ success: null, error: null })

    try {
      await axiosInstance.post('/Auth/resend-new-email-code', {
        newEmail
      })

      setStatus({
        success: 'تم إعادة إرسال الكود إلى بريدك الجديد.',
        error: null
      })
    } catch (err) {
      setStatus({
        success: null,
        error:
          err.response?.data?.message ||
          err.message ||
          'تعذر إعادة إرسال الكود حالياً.'
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 dir-rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border border-gray-100 dark:border-gray-700 relative animate-in fade-in zoom-in duration-200"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <ShieldCheck size={20} className="text-amber-500" />
          تأكيد البريد الإلكتروني الجديد
        </h3>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          تم إرسال كود تحقق إلى:{' '}
          <span className="font-semibold text-gray-800 dark:text-gray-200">{newEmail}</span>
        </p>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                كود التحقق
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                disabled={submitting}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-amber-500 transition disabled:opacity-60 text-center tracking-[0.3em] font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              تأكيد الكود
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition disabled:opacity-60 cursor-pointer"
            >
              {resending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RotateCcw size={13} />
              )}
              إعادة إرسال الكود
            </button>
          </form>
        )}
      </div>
    </div>
  )
}