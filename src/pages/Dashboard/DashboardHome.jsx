// File: src/pages/Dashboard/DashboardHome.jsx
import { Link } from 'react-router-dom'
import { BarChart3, Package, ShoppingCart, Tags, Building2, Store, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'

const QUICK_LINKS = [
  { to: '/admin/pos', label: 'كاشير المعرض', icon: ShoppingCart, permission: 'Orders.Create' },
  { to: '/admin/catalog/products', label: 'المنتجات', icon: Package, permission: 'Products.View', allowRoles: ['STORE_OWNER', 'moderator', 'Moderator'] },
  { to: '/admin/catalog/categories', label: 'الأقسام', icon: Tags, permission: 'Categories.Manage' },
  { to: '/admin/reports', label: 'التقارير', icon: BarChart3, permission: 'Reports.View', hideForRoles: ['moderator', 'Moderator'], allowRoles: ['STORE_OWNER'] },
  { to: '/admin/operations', label: 'مركز العمليات', icon: Store, role: 'ONLINE_MANAGER' },
  
  // 👑 للمالك فقط
  { to: '/admin/owner', label: 'لوحة المالك', icon: Building2, role: 'STORE_OWNER' },
  
  // 🛡️ للموديريتور
  { to: '/admin/moderator', label: 'لوحة المشرف', icon: ShieldCheck, allowRoles: ['moderator', 'Moderator'] },
]

export default function DashboardHome() {
  const { user, hasPermission, hasRole } = useAuth()

  return (
    <div className="space-y-6">
      <div>
<h1 className="font-display text-xl font-semibold text-ink">
  مرحباً بك مجدداً، {
    (user?.fullName?.split(' ')[0] === 'Super' ? 'المشرف' : user?.fullName?.split(' ')[0]) ?? 'هناك'
  }
</h1>
        <p className="text-sm text-ink-soft">إليك اختصار سريع للوصول إلى أكثر المهام استخداماً.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_LINKS.filter((link) => {
          if (link.hideForRoles?.some((role) => hasRole(role))) return false

          if (link.allowRoles?.some((role) => hasRole(role))) return true

          const passesPermission = !link.permission || hasPermission(link.permission)
          const passesRole = !link.role || hasRole(link.role)

          return passesPermission && passesRole
        }).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 shadow-subtle transition hover:border-amber"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-canvas text-ink-soft transition group-hover:bg-amber/10 group-hover:text-amber-dark">
              <Icon size={20} />
            </div>
            <span className="text-sm font-medium text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <Card title="بدء الاستخدام">
        <p className="text-sm text-ink-soft">
          أصبح التوجيه داخل لوحة التحكم مرتبطاً بالصلاحيات. مديرو العمليات ينتقلون إلى مركز العمليات،
          ومشرفو النظام إلى لوحة المشرف، ومالكو المتجر إلى لوحة المالك.
        </p>
      </Card>
    </div>
  )
}