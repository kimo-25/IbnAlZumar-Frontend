import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return setError('يرجى إدخال البريد الإلكتروني.')

    setIsSubmitting(true)
    setError(null)

    try {
      await axiosInstance.post('/Auth/forgot-password', { email })

      // حفظ الإيميل في localStorage لضمان عدم ضياعه عند عمل F5
      localStorage.setItem('resetPasswordEmail', email)

      // التوجيه لصفحة إعادة التعين وتمرير البريد في الـ state
      navigate('/reset-password', {
        state: { email }
      })
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إرسال كود استعادة كلمة المرور.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-xl border border-border">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">استعادة كلمة المرور</h1>
          <p className="mt-2 text-sm text-ink-soft">
            أدخل بريدك الإلكتروني وسنرسل لك كود لإعادة ضبط كلمة المرور.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">البريد الإلكتروني *</label>
            <div className="relative">
              <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            إرسال الكود
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-amber transition">
            <ArrowRight size={16} />
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}