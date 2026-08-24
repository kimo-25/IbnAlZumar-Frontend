// File: src/components/layout/DashboardLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AiChatModal from '../ai/AiChatModal' // <-- تمت الإضافة هنا

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="lg:ps-64">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-4 text-right sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <AiChatModal /> {/* <-- زرار الشات العائم والنافذة الخاصة بالـ AI */}
    </div>
  )
}