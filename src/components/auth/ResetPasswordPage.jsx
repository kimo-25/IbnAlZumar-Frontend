import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Lock, Mail, ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // قراءة الإيميل من الـ state أو من localStorage في حالة حدوث Refresh
  const [email, setEmail] = useState(
    location.state?.email ||
    localStorage.getItem('resetPasswordEmail') ||
    ''
  )
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !code || !newPassword) {
      return setError('يرجى ملء جميع الحقول المطلوبة.')
    }
    if (newPassword !== confirmPassword) {
      return setError('كلمتا المرور غير متطابقتين.')
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await axiosInstance.post('/Auth/reset-password', {
        email,
        code,
        newPassword
      })

      // حذف الإيميل من localStorage بعد التغيير بنجاح
      localStorage.removeItem('resetPasswordEmail')

      alert('تم إعادة تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول.')
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-xl border border-border">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">تعيين كلمة مرور جديدة</h1>
          <p className="mt-1 text-sm text-ink-soft">أدخل الكود المرسل لبريدك الإلكتروني وكلمة المرور الجديدة.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* البريد الإلكتروني */}
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

          {/* كود التحقق OTP */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">كود التحقق (OTP) *</label>
            <div className="relative">
              <ShieldCheck size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm tracking-widest text-ink outline-none focus:border-amber"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
          </div>

          {/* كلمة المرور الجديدة */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">كلمة المرور الجديدة *</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-10 text-sm text-ink outline-none focus:border-amber"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* تأكيد كلمة المرور الجديدة */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">تأكيد كلمة المرور الجديدة *</label>
            <div className="relative">
              <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber"
                placeholder="••••••••"
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
            تغيير كلمة المرور
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-soft">
          تذكرت كلمة المرور؟{' '}
          <Link to="/login" className="font-medium text-amber hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}