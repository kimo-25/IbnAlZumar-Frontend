import {
  useEffect,
  useState
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail
} from 'lucide-react'

import axiosInstance from '../../api/axiosInstance'

export default function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onOtpSent
}) {
  const [formData, setFormData] =
    useState({
      newEmail: '',
      password: ''
    })

  const [submitting, setSubmitting] =
    useState(false)

  const [status, setStatus] = useState({
    success: null,
    error: null
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        newEmail: '',
        password: ''
      })

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
        '/Auth/change-email',
        {
          newEmail: formData.newEmail,
          password: formData.password
        }
      )

      const newEmailVal =
        formData.newEmail

      setStatus({
        success:
          'تم إرسال كود تحقق إلى البريد الإلكتروني الجديد.',
        error: null
      })

      if (onOtpSent) {
        onOtpSent(newEmailVal)
      }

      setTimeout(onClose, 1200)
    } catch (err) {
      setStatus({
        success: null,
        error:
          err.response?.data?.message ||
          err.message ||
          'حدث خطأ أثناء تغيير البريد الإلكتروني.'
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
          <Mail
            size={20}
            className="text-amber"
          />
          تغيير البريد الإلكتروني
        </h3>

        <p className="text-xs text-ink-soft mb-4">
          البريد الحالي:{' '}
          <span className="font-semibold text-ink">
            {currentEmail}
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
                البريد الإلكتروني الجديد
              </label>

              <input
                type="email"
                required
                disabled={submitting}
                value={formData.newEmail}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newEmail:
                      e.target.value
                  })
                }
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="example@domain.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                كلمة المرور الحالية (للتأكيد)
              </label>

              <input
                type="password"
                required
                disabled={submitting}
                value={formData.password}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password:
                      e.target.value
                  })
                }
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                placeholder="••••••••"
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
                <Mail size={16} />
              )}

              إرسال كود التحقق
            </button>
          </form>
        )}
      </div>
    </div>
  )
}