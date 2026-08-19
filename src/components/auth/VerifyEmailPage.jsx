// File: src/components/auth/VerifyEmailPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Loader2, RefreshCw } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 3. جلب الإيميل من الـ state أو من localStorage لو حصل Refresh (F5)
  const email = 
    location.state?.email || 
    localStorage.getItem('pendingVerificationEmail') || 
    ''

  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // إذا لم يوجد بريد نهائياً، ارجع لصفحة التسجيل
  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  // عملية التحقق من الكود
  async function handleVerify(e) {
    e.preventDefault()
    if (!code) return setError('يرجى إدخال كود التحقق.')
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      await axiosInstance.post('/Auth/verify-email', {
        email,
        code
      })
      
      // 3 & 2. مسح الإيميل المعلق من الـ localStorage وتوجيه المستخدم لتسجيل الدخول مع رسالة نجاح عبر الـ state
      localStorage.removeItem('pendingVerificationEmail')
navigate('/login', {
  replace: true,
  state: {
    verified: true
  }
})
    } catch (err) {
      setError(err?.response?.data?.message || 'كود التحقق غير صحيح أو انتهت صلاحيته.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 1. إعادة إرسال الكود بالطريقة الصحيحة كـ Query String
  async function handleResend() {
    setIsResending(true)
    setError(null)
    try {
      await axiosInstance.post(`/Auth/resend-verification-code?email=${encodeURIComponent(email)}`)
      alert('تم إرسال كود جديد إلى بريدك الإلكتروني.')
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إعادة إرسال الكود.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-xl border border-border">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber/10 text-amber">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">تفعيل الحساب</h1>
          <p className="mt-2 text-sm text-ink-soft">
            تم إرسال كود التحقق إلى <span className="font-bold text-ink">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">كود التحقق (OTP)</label>
            {/* 4. تحسين حقل الـ OTP ليفتح لوحة الأرقام في الموبايل مباشرة */}
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas py-3 px-4 text-center text-xl tracking-widest text-ink outline-none focus:border-amber"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            تأكيد الحساب
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-ink-soft hover:text-amber transition"
          >
            {isResending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            إعادة إرسال الكود
          </button>
        </div>
      </div>
    </div>
  )
}