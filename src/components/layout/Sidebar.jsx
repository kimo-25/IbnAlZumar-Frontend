// File: src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  SlidersHorizontal,
  Tags,
  Truck,
  Users,
  Wrench,
  X,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
      // 🛒 مركز العمليات والطلبات (مُتاح للموديريتور ومدير الأونلاين والمالك)
      { 
        to: '/admin/operations', 
        label: 'مركز العمليات (الطلبات)', 
        icon: Truck, 
        allowRoles: ['ONLINE_MANAGER', 'moderator', 'Moderator', 'STORE_OWNER', 'Admin', 'SuperAdmin', 'admin'] 
      },
      // 👑 للمالك فقط
      { to: '/admin/owner', label: 'لوحة المالك', icon: BarChart3, role: 'STORE_OWNER' },
      // 🛡️ للموديريتور والمشرفين
      { to: '/admin/moderator', label: 'لوحة المشرف', icon: ShieldCheck, allowRoles: ['moderator', 'Moderator', 'Admin', 'SuperAdmin', 'admin'] },
    ],
  },
  {
    label: 'الكتالوج والأصناف',
    items: [
      { to: '/admin/catalog/categories', label: 'الأقسام', icon: Tags, permission: 'Categories.Manage' },
      { to: '/admin/catalog/products', label: 'المنتجات', icon: Package, permission: 'Products.View', allowRoles: ['STORE_OWNER', 'moderator', 'Moderator', 'Admin', 'SuperAdmin', 'admin'] },
    ],
  },
  {
    label: 'إدارة المخزون',
    items: [
      { to: '/admin/inventory/adjust', label: 'تسوية المخزون', icon: SlidersHorizontal, permission: 'Inventory.Adjust' },
      { to: '/admin/inventory/transfer', label: 'نقل المخزون', icon: ArrowLeftRight, permission: 'Inventory.Transfer' },
    ],
  },
  {
    label: 'المبيعات والشركاء',
    items: [
      { to: '/admin/pos', label: 'كاشير المعرض', icon: ShoppingCart, permission: 'Orders.Create' },
      { to: '/admin/customers', label: 'العملاء', icon: Users, permission: 'Customers.View' },
      { to: '/admin/purchasing', label: 'المشتريات', icon: Truck, permission: 'Purchasing.View' },
    ],
  },
  {
    label: null,
    items: [{ to: '/admin/reports', label: 'التقارير', icon: BarChart3, permission: 'Reports.View', allowRoles: ['STORE_OWNER', 'Admin', 'SuperAdmin', 'admin'], hiddenForRoles: ['moderator', 'Moderator'] }],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  const { hasPermission, hasRole, user } = useAuth()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-graphite-950/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-64 flex-col bg-graphite-900 text-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber text-graphite-900">
              <Wrench size={18} strokeWidth={2.5} />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">ابن الزمر</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden" aria-label="إغلاق القائمة">
            <X size={20} />
          </button>
        </div>

        <div className="receipt-tear mx-5 opacity-20" />

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group, idx) => {
            const visibleItems = group.items.filter((item) => {
              if (item.hiddenForRoles?.some((role) => hasRole(role))) return false

              if (item.allowRoles?.some((role) => hasRole(role))) return true

              const passesPermission = !item.permission || hasPermission(item.permission)
              const passesRole = !item.role || hasRole(item.role)

              return passesPermission && passesRole
            })
            if (visibleItems.length === 0) return null

            return (
              <div key={idx}>
                {group.label && (
                  <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-white/40">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {visibleItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg border-s-2 px-3 py-2 text-sm transition ${
                          isActive
                            ? 'border-amber bg-white/5 font-medium text-white'
                            : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      {Icon && <Icon size={18} />}
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="px-3 pt-2 text-xs text-white/45">
            {user?.roles?.join(' · ') || 'لا توجد صلاحية نشطة'}
          </div>
        </nav>
      </aside>
    </>
  )
}