import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Loader2, User, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import axiosInstance from '../../api/axiosInstance'
import { setStoredAuth } from '../../utils/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // دالة تحديد المسار المستهدف بناءً على دور المستخدم الفعلي فقط دون افتراضات خاطئة
  const determineDestination = (userData) => {
    // 1. إذا كان تم تحويل المستخدم من صفحة محمية سابقة (مثل /admin/operations)
    const fromPath = location.state?.from?.pathname
    if (fromPath && fromPath !== '/login' && fromPath !== '/admin/login') {
      return fromPath
    }

    // 2. تجميع الأدوار المسجلة للمستخدم بطريقة مرنة
    const roles = []
    if (userData?.roles && Array.isArray(userData.roles)) {
      roles.push(...userData.roles)
    } else if (userData?.roles) {
      roles.push(userData.roles)
    }

    const normalizedRoles = roles.map((r) => String(r).toUpperCase().trim())

    // 3. التوجيه بناءً على الدور الفعلي الصارم فقط
    if (normalizedRoles.includes('ONLINE_MANAGER')) {
      return '/admin/operations'
    }
    
    if (normalizedRoles.includes('MODERATOR')) {
      return '/admin/moderator'
    }

    const isAdminOrOwner = normalizedRoles.some((r) =>
      ['ADMIN', 'SUPER ADMIN', 'SUPERADMIN', 'STORE_OWNER', 'OWNER'].includes(r)
    )

    // تم إزالة الاعتماد تماماً على مسار الـ URL لمنع دخول الزوار العاديين للوحة التحكم
    if (isAdminOrOwner) {
      return '/admin/dashboard'
    }

    // 4. الافتراضي الحتمي للعميل العادي (Customer)
    return '/profile'
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!username.trim() || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.')
      return
    }

    setIsSubmitting(true)
    try {
      const userData = await login(username.trim(), password)
      const targetPath = determineDestination(userData)
      navigate(targetPath, { replace: true })
    } catch (err) {
      setError(err?.message || 'فشل تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await axiosInstance.post('/Auth/google', {
        idToken: credentialResponse.credential,
      })

      const data = response.data

      // استخدام الميثود الموحدة للحفظ لضمان التزامن مع AuthContext
      setStoredAuth(data)

      const targetPath = determineDestination(data)
      navigate(targetPath, { replace: true })
      // إعادة تحميل خفيفة لضمان قراءة AuthContext للبيانات الجديدة
      window.location.href = targetPath;
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء المصادقة مع جوجل.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2" dir="rtl">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-graphite-900 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber text-graphite-900">
            <Wrench size={20} strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">ابن الزمر</span>
        </div>

        <div className="relative space-y-4">
          <p className="font-display text-3xl font-semibold leading-tight">
            إدارة المخزون ونقاط البيع،
            <br />
            تحت سقف واحد.
          </p>
          <p className="max-w-sm text-sm text-white/60">
            الكتالوج، حركة المخزون، الموردون، حسابات العملاء، والمبيعات — نظام واحد، وتحديث موحد.
          </p>
        </div>

        <div className="receipt-tear relative opacity-20" />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber text-graphite-900">
              <Wrench size={20} strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-semibold">ابن الزمر</span>
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-ink-soft">أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">
                اسم المستخدم
              </label>
              <div className="relative">
                <User size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pr-10 pl-3 text-sm text-ink shadow-subtle focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                  placeholder="اسم المستخدم"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface py-2.5 pr-10 pl-10 text-sm text-ink shadow-subtle focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-graphite-900 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-ink-soft">أو</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-surface p-4 shadow-subtle transition hover:border-amber/50">
              <span className="mb-3 text-xs font-medium text-ink-soft">المتابعة السريعة باستخدام حسابك</span>
              <div className="overflow-hidden rounded-xl">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('فشل تسجيل الدخول عبر جوجل.')}
                  useOneTap={false}
                  theme="outline"
                  shape="pill"
                />
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-ink-soft">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="font-semibold text-amber hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}