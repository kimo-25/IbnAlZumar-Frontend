import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Loader2, User, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'
import axiosInstance from '../../api/axiosInstance'
import { setStoredAuth } from '../../utils/auth'
import { getRoleHomePath } from '../../utils/roles'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // قراءة حالة تفعيل الحساب التي تم تمريرها من صفحة التحقق
  const successMessage = location.state?.verified
    ? 'تم تفعيل الحساب بنجاح. يمكنك تسجيل الدخول الآن.'
    : null

  // دالة تحديد المسار المستهدف الموحدة بناءً على دور المستخدم
  const determineDestination = (userData) => {
    const fromPath = location.state?.from?.pathname
    if (fromPath && !['/login', '/admin/login', '/'].includes(fromPath)) {
      return fromPath
    }

    const rawRoles =
      userData?.roles || userData?.role || userData?.user?.roles || userData?.user?.role || []

    return getRoleHomePath(rawRoles)
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
      const response = await axiosInstance.post('/Auth/login', {
        username: username.trim(),
        password,
      })

      const data = response.data

      // 1. حفظ التوكن المشفّر وتحديث Context فوراً
      const parsedUser = login(data.token)
      localStorage.setItem("user", JSON.stringify(data))

      // 2. تحديد المسار المناسب حسب الأدوار المعالجة
      const targetPath = determineDestination(parsedUser || data)

      // 3. التوجيه المباشر دون المرور على ForbiddenPage
      navigate(targetPath, { replace: true })
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'فشل تسجيل الدخول. تحقق من بياناتك.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // استخدام useGoogleLogin لمنع إعادة التهيئة والضغط المزدوج
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null)
      setIsSubmitting(true)
      try {
        const response = await axiosInstance.post('/Auth/google', {
          accessToken: tokenResponse.access_token,
        })

        const data = response.data
        setStoredAuth(data)
        
        let parsedUser = null;
        if (data.token) {
          parsedUser = login(data.token)
        }

        const targetPath = determineDestination(parsedUser || data)
        navigate(targetPath, { replace: true })
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'حدث خطأ أثناء المصادقة مع جوجل.'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    onError: () => setError('فشل تسجيل الدخول عبر جوجل.'),
  })

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
            {successMessage && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

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

              {/* رابط نسيت كلمة المرور تحت الباسورد مباشرة */}
              <div className="mt-2 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-amber hover:underline"
                >
                  نسيت كلمة المرور؟
                </Link>
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

            <button
              type="button"
              onClick={() => loginWithGoogle()}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-ink shadow-subtle transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>تسجيل الدخول باستخدام Google</span>
            </button>

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