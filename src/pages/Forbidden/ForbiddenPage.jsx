import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getRoleHomePath } from '../../utils/roles'

export default function ForbiddenPage() {
  const { user } = useAuth()
  
  // تحديد الصفحة الرئيسية المناسبة لدور المستخدم أو التوجيه للرئيسية كافتراضي
  const dashboardPath = user?.roles || user?.role 
    ? getRoleHomePath(user.roles || user.role) 
    : '/'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center" dir="rtl">
      <ShieldAlert size={40} className="text-danger" />
      <h1 className="font-display text-xl font-semibold text-ink">تم رفض الوصول</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        حسابك لا يمتلك الصلاحيات الكافية لعرض هذه الصفحة. يرجى التواصل مع المسؤول للحصول على الصلاحية.
      </p>
      <Link 
        to={dashboardPath} 
        className="mt-2 rounded-lg bg-graphite-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-graphite-800"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  )
}