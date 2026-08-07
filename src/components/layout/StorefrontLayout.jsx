// File: src/components/layout/StorefrontLayout.jsx
import { Outlet } from 'react-router-dom'
import StorefrontAnnouncementBar from '../storefront/StorefrontAnnouncementBar'
import StorefrontHeader from '../storefront/StorefrontHeader'
import CartDrawer from '../storefront/CartDrawer'
import { useLanguage } from '../../context/LanguageContext'

export default function StorefrontLayout() {
  const { direction, language } = useLanguage()

  return (
    <div className="min-h-screen bg-canvas font-arabic" dir={direction} lang={language}>
      <div className="sticky top-0 z-40">
        <StorefrontAnnouncementBar />
        <StorefrontHeader />
      </div>
      <Outlet />
      <CartDrawer />

      <footer className="border-t border-border py-8 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} ابن الزمر — الأدوات، الخامات، والتشطيبات
      </footer>
    </div>
  )
}
