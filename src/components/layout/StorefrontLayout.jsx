// File: src/components/layout/StorefrontLayout.jsx
import { Outlet } from 'react-router-dom'
import StorefrontAnnouncementBar from '../storefront/StorefrontAnnouncementBar'
import StorefrontHeader from '../storefront/StorefrontHeader'
import CartDrawer from '../storefront/CartDrawer'
import ReminderBanner from '../ui/ReminderBanner'
import { useLanguage } from '../../context/LanguageContext'

export default function StorefrontLayout() {
  const { direction, language } = useLanguage()

  return (
    <div className="min-h-screen bg-canvas font-arabic flex flex-col justify-between" dir={direction} lang={language}>
      <div>
        {/* الـ Sticky Header والـ Announcement Bar فقط */}
        <div className="sticky top-0 z-40">
          <StorefrontAnnouncementBar />
          <StorefrontHeader />
        </div>

        {/* محتوى الصفحة الرئيسي */}
        <main>
          <Outlet />
        </main>
      </div>

      <CartDrawer />

      {/* 📍 الـ ReminderBanner العائم بأسفل الشاشة بره الـ sticky wrapper */}
      <ReminderBanner />

      <footer className="border-t border-border py-8 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} ابن الزمر — الأدوات، الخامات، والتشطيبات
      </footer>
    </div>
  )
}