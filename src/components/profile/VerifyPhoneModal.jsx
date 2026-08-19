import {
  useEffect,
  useState
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck
} from 'lucide-react'

import axiosInstance from '../../api/axiosInstance'

export default function VerifyPhoneModal({
  isOpen,
  phone,
  onClose,
  onVerified
}) {
  const [code, setCode] = useState('')

  const [submitting, setSubmitting] =
    useState(false)

  const [resending, setResending] =
    useState(false)

  const [status, setStatus] = useState({
    success: null,
    error: null
  })

  useEffect(() => {
    if (isOpen) {
      setCode('')

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

    setSubmitting(true)

    setStatus({
      success: null,
      error: null
    })

    try {
      await axiosInstance.post(
        '/Auth/verify-phone',
        {
          phone,
          code
        }
      )

      setStatus({
        success:
          'تم تأكيد رقم الهاتف وتحديثه بنجاح!',
        error: null
      })

      setTimeout(() => {
        if (onVerified) {
          onVerified(phone)
        }
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

    setStatus({
      success: null,
      error: null
    })

    try {
      await axiosInstance.post(
        '/Auth/send-phone-otp',
        {
          phone
        }
      )

      setStatus({
        success:
          'تم إعادة إرسال الكود إلى رقم هاتفك.',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <h3 className="text-lg font-bold text-ink mb-1 flex items-center gap-2">
          <ShieldCheck
            size={20}
            className="text-amber"
          />
          تأكيد رقم الهاتف
        </h3>

        <p className="text-xs text-ink-soft mb-4">
          تم إرسال كود تحقق إلى:{' '}
          <span className="font-semibold text-ink">
            {phone}
          </span>
        </p>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                كود التحقق
              </label>

              <input
                type="text"
                inputMode="numeric"
                required
                disabled={submitting}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60 text-center tracking-[0.3em] font-mono"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite-800 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ShieldCheck size={16} />
              )}

              تأكيد الكود
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-amber hover:text-amber/80 transition disabled:opacity-60 cursor-pointer"
            >
              {resending ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
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