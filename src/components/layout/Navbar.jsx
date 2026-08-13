// File: src/components/layout/Navbar.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function getRoleLabel(role) {
  if (!role) return ''
  const roleMap = {
    Admin: 'المسؤول',
    admin: 'المسؤول',
    SuperAdmin: 'المشرف العام',
    'Super Admin': 'المشرف العام',
    Moderator: 'المشرف',
    moderator: 'المشرف',
    Manager: 'المدير',
    STORE_OWNER: 'المالك',
    ONLINE_MANAGER: 'مدير العمليات',
    User: 'المستخدم'
  }
  return roleMap[role] || role
}

function getUserName(fullName) {
  if (!fullName) return 'مستخدم'
  return fullName
    .replace(/\bSuper Admin\b/gi, 'المشرف العام')
    .replace(/\bAdmin\b/gi, 'مسؤول')
    .replace(/\bModerator\b/gi, 'المشرف')
    .replace(/\bManager\b/gi, 'مدير')
}

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const primaryRole = user?.roles?.[0]
  const displayName = getUserName(user?.fullName || user?.name)

  // تحديد رابط البروفايل بدقة بحسب الرتبة
  const getProfileLink = () => {
    if (!user?.roles || user.roles.length === 0) return '/profile'
    const rolesStr = user.roles.map(r => r.toString().toLowerCase()).join(' ')

    if (rolesStr.includes('moderator')) {
      return '/moderator/profile'
    }
    if (rolesStr.includes('admin') || rolesStr.includes('owner') || rolesStr.includes('store_owner')) {
      return '/admin/profile'
    }
    
    return '/profile'
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-surface/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <button onClick={onMenuClick} className="text-ink-soft hover:text-ink lg:hidden" aria-label="فتح القائمة">
          <Menu size={22} />
        </button>

        <div className="hidden lg:block" />

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-canvas"
          >
            <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-graphite-900 text-xs font-medium text-white">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                displayName?.charAt(0)?.toUpperCase() ?? <UserIcon size={14} />
              )}
            </div>
            
            <span className="hidden text-sm font-medium text-ink sm:block">
              {displayName}
            </span>

            {primaryRole && (
              <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 sm:inline-flex">
                {getRoleLabel(primaryRole)}
              </span>
            )}

            <ChevronDown size={16} className={`text-ink-soft transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute start-0 lg:start-auto lg:end-0 z-20 mt-2 w-52 rounded-lg border border-border bg-surface py-1 shadow-lg">
                <div className="border-b border-border px-3 py-2 text-start">
                  <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                  {user?.roles && (
                    <p className="truncate text-xs text-ink-soft">
                      {user.roles.map(getRoleLabel).join('، ')}
                    </p>
                  )}
                </div>

                <Link
                  to={getProfileLink()}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-canvas"
                >
                  <UserIcon size={16} className="text-ink-soft" />
                  <span>الملف الشخصي</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 justify-between border-t border-border/50"
                >
                  <div className="flex items-center gap-2">
                    <LogOut size={16} className="rotate-180" />
                    <span>تسجيل الخروج</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}