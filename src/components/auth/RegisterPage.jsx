// File: src/pages/Auth/RegisterPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  AlertCircle, 
  Loader2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Eye, 
  EyeOff 
} from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [form, setForm] = useState({ 
    fullName: '', 
    email: '', 
    password: '', 
    phone: '', 
    governorate: '', 
    address: '' 
  })
  
  // 👁️ State للتحكم في إظهار / إخفاء كلمة المرور
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // التسجيل اليدوي
  async function handleRegister(e) {
    e.preventDefault()
    setError(null)
    if (!form.fullName || !form.email || !form.password) {
      setError('يرجى ملء الحقول الأساسية (الاسم، البريد، وكلمة المرور).')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await axiosInstance.post('/Auth/register', form)
      const data = response.data

      // حفظ بيانات الجلسة
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      
      if (login) {
        try {
          await login(form.email, form.password)
        } catch {
          // في حال عدم توفر الدالة مباشرة
        }
      }

      navigate('/profile', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء التسجيل.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // التسجيل عبر جوجل
  async function handleGoogleSuccess(credentialResponse) {
    setError(null)
    try {
      const response = await axiosInstance.post('/Auth/google', {
        idToken: credentialResponse.credential,
      })
      const data = response.data

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))

      navigate('/profile', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء المصادقة مع جوجل.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-8 shadow-xl border border-border">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-ink-soft">أنشئ حسابك لتتبع طلباتك بكل سهولة.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* الاسم الكامل */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">الاسم الكامل *</label>
            <div className="relative">
              <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                value={form.fullName}
                onChange={e => updateField('fullName', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber"
                placeholder="أحمد محمد"
                required
              />
            </div>
          </div>

          {/* البريد الإلكتروني و كلمة المرور */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">البريد الإلكتروني *</label>
              <div className="relative">
                <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* 🔒 حقل كلمة المرور مع زر الإظهار والإخفاء */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">كلمة المرور *</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => updateField('password', e.target.value)}
                  className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-10 text-sm text-ink outline-none focus:border-amber"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft transition hover:text-ink focus:outline-none"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* رقم الهاتف و المحافظة */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">رقم الهاتف</label>
              <div className="relative">
                <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber"
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">المحافظة</label>
              <div className="relative">
                <Building2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={form.governorate}
                  onChange={e => updateField('governorate', e.target.value)}
                  className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber"
                  placeholder="القاهرة، الإسكندرية..."
                />
              </div>
            </div>
          </div>

          {/* العنوان التفصيلي */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">العنوان بالتفصيل</label>
            <div className="relative">
              <MapPin size={18} className="absolute right-3 top-3 text-ink-soft" />
              <textarea
                rows={2}
                value={form.address}
                onChange={e => updateField('address', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas py-2 pr-10 pl-3 text-sm text-ink outline-none focus:border-amber resize-none"
                placeholder="اسم الشارع / رقم العمارة / الشقة..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            إنشاء الحساب
          </button>
        </form>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs text-ink-soft">أو المتابعة السريعة</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-canvas p-4 shadow-subtle transition hover:border-amber/50">
          <div className="overflow-hidden rounded-xl">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('فشل التسجيل عبر جوجل.')}
              theme="outline"
              shape="pill"
            />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-medium text-amber hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}