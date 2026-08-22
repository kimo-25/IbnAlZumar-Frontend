// File: src/pages/Dashboard/DashboardHome.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Package,
  ShoppingCart,
  Tags,
  Building2,
  Store,
  ShieldCheck,
  AlertTriangle,
  PackageX,
  RefreshCw,
  Loader2,
  ClipboardList,
  User // 👈 إضافة أيقونة البروفايل
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import { getLowStockProducts } from '../../api/adminApi'
import { formatCurrency } from '../../utils/catalog'

const QUICK_LINKS = [
  { to: '/admin/pos', label: 'كاشير المعرض', icon: ShoppingCart, permission: 'Orders.Create' },
  { to: '/admin/catalog/products', label: 'المنتجات', icon: Package, permission: 'Products.View', allowRoles: ['STORE_OWNER', 'moderator', 'Moderator'] },
  { to: '/admin/catalog/categories', label: 'الأقسام', icon: Tags, permission: 'Categories.Manage' },
  { to: '/admin/reports', label: 'التقارير', icon: BarChart3, permission: 'Reports.View', hideForRoles: ['moderator', 'Moderator'], allowRoles: ['STORE_OWNER'] },
  { to: '/admin/operations', label: 'مركز العمليات', icon: Store, role: 'ONLINE_MANAGER' },

  // 👤 رابط مباشر للملف الشخصي (تسجيل البصمة الصوتية)
  { to: '/admin/profile', label: 'الملف الشخصي', icon: User },

  // 👑 للمالك فقط
  { to: '/admin/owner', label: 'لوحة المالك', icon: Building2, role: 'STORE_OWNER' },

  // 🛡️ للموديريتور
  { to: '/admin/moderator', label: 'لوحة المشرف', icon: ShieldCheck, allowRoles: ['moderator', 'Moderator'] },
]

// ==========================================
// Widget: تنبيهات نقص المخزون
// يظهر فقط لـ STORE_OWNER و Moderator
// ==========================================
function LowStockWidget() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLowStock = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLowStockProducts()
      const list = Array.isArray(data) ? data : (data?.$values || data?.data || [])
      setProducts(list)
    } catch (err) {
      console.error('فشل جلب تنبيهات نقص المخزون:', err)
      setError('تعذر تحميل بيانات المخزون حالياً.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLowStock()
  }, [fetchLowStock])

  const outOfStockCount = products.filter((p) => (p.currentStock ?? p.stock ?? 0) <= 0).length
  const nearlyOutCount = products.length - outOfStockCount

  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-amber-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2">
        <AlertTriangle size={16} className="shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex items-center gap-3">
        <ShieldCheck size={22} className="text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">المخزون في وضع جيد</p>
          <p className="text-xs text-emerald-700/80 mt-0.5">لا توجد منتجات اقتربت من النفاد حالياً.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-100 text-rose-600 animate-pulse">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">تنبيهات نقص المخزون</h3>
            <p className="text-xs text-ink-soft mt-0.5">
              <span className="font-bold text-rose-600">{outOfStockCount}</span> نفدت كمياتها ·{' '}
              <span className="font-bold text-amber-600">{nearlyOutCount}</span> اقتربت من الحد الأدنى
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLowStock}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3 py-2 text-[11px] font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
          >
            <RefreshCw size={13} />
            تحديث
          </button>
          <Link
            to="/admin/operations?tab=restock"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
          >
            <ClipboardList size={13} />
            إدارة التموين
          </Link>
        </div>
      </div>

      <div className="divide-y divide-rose-100/70 max-h-72 overflow-y-auto">
        {products.slice(0, 6).map((p) => {
          const stock = p.currentStock ?? p.stock ?? 0
          const isOut = stock <= 0
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/40 transition">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink truncate">{p.name || p.nameAr}</p>
                <p className="text-[10px] font-mono text-ink-soft mt-0.5">
                  SKU: {p.sku} · {p.categoryName}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-ink-soft font-mono">{formatCurrency(p.unitPrice || 0)}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    isOut ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isOut ? <PackageX size={12} /> : <AlertTriangle size={12} />}
                  {stock} / {p.minStockThreshold}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {products.length > 6 && (
        <div className="px-5 py-2.5 text-center border-t border-rose-100">
          <Link to="/admin/operations?tab=restock" className="text-[11px] font-bold text-rose-600 hover:underline">
            عرض كل الـ {products.length} منتج ناقص المخزون ←
          </Link>
        </div>
      )}
    </div>
  )
}

export default function DashboardHome() {
  const { user, hasPermission, hasRole } = useAuth()

  const canSeeLowStockWidget = hasRole('STORE_OWNER') || hasRole('moderator') || hasRole('Moderator')

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

      {canSeeLowStockWidget && <LowStockWidget />}

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