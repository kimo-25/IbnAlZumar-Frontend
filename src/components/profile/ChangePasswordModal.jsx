import {
  useEffect,
  useState
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock
} from 'lucide-react'

import axiosInstance from '../../api/axiosInstance'

export default function ChangePasswordModal({
  isOpen,
  onClose
}) {
  const [formData, setFormData] =
    useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
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
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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

    if (
      formData.newPassword !==
      formData.confirmPassword
    ) {
      setStatus({
        success: null,
        error:
          'كلمة المرور الجديدة وتأكيدها غير متطابقين.'
      })

      return
    }

    setSubmitting(true)

    setStatus({
      success: null,
      error: null
    })

    try {
      await axiosInstance.post(
        '/Auth/change-password',
        {
          currentPassword:
            formData.currentPassword,
          newPassword:
            formData.newPassword,
          confirmPassword:
            formData.confirmPassword
        }
      )

      setStatus({
        success:
          'تم تغيير كلمة المرور بنجاح!',
        error: null
      })

      setTimeout(onClose, 1800)
    } catch (err) {
      setStatus({
        success: null,
        error:
          err.response?.data?.message ||
          err.message ||
          'حدث خطأ أثناء تغيير كلمة المرور.'
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
        <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <Lock
            size={20}
            className="text-amber"
          />
          تغيير كلمة المرور
        </h3>

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
                كلمة المرور الحالية
              </label>

              <input
                type="password"
                required
                disabled={submitting}
                value={
                  formData.currentPassword
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentPassword:
                      e.target.value
                  })
                }
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                كلمة المرور الجديدة
              </label>

              <input
                type="password"
                required
                disabled={submitting}
                value={
                  formData.newPassword
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    newPassword:
                      e.target.value
                  })
                }
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                تأكيد كلمة المرور الجديدة
              </label>

              <input
                type="password"
                required
                disabled={submitting}
                value={
                  formData.confirmPassword
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmPassword:
                      e.target.value
                  })
                }
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
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
                <Lock size={16} />
              )}

              تحديث كلمة المرور
            </button>
          </form>
        )}
      </div>
    </div>
  )
}