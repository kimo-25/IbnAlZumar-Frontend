import { useState } from 'react'
import { Camera, Check, Mail, Phone, Shield, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import VoiceEnrollmentButton from '../admin/VoiceEnrollmentButton'

export default function AdminProfilePage() {
  const { user, setAuth } = useAuth()
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phoneNumber || '',
    avatarUrl: user?.avatarUrl || ''
  })

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, avatarUrl: imageUrl }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    // تحديث بيانات الجلسة الحالية
    const updatedUser = {
      ...user,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      avatarUrl: formData.avatarUrl
    }

    // حفظ في الـ Auth Context و LocalStorage
    if (setAuth) {
      setAuth(updatedUser)
    }

    setTimeout(() => {
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 600)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">الملف الشخصي</h1>
          <p className="text-sm text-ink-soft">إدارة بيانات حسابك الشخصية وإعدادات اللوحة</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-800 border border-emerald-200">
          <Check size={18} />
          <span className="text-sm font-medium">تم حفظ التغيرات بنجاح!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* الصورة الشخصية والمعلومات الأساسية */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-ink">الصورة الشخصية</h2>
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-canvas">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-graphite-900 text-2xl font-bold text-white">
                  {formData.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <label className="absolute bottom-0 inset-x-0 bg-graphite-900/70 py-1 text-center text-white cursor-pointer hover:bg-graphite-900 transition">
                <Camera size={14} className="mx-auto" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">صورة الحساب</p>
              <p className="text-xs text-ink-soft">تدعم صيغ JPG، PNG. الحجم الأقصى 2MB</p>
            </div>
          </div>
        </div>

        {/* البيانات الشخصية */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-ink">البيانات الشخصية</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">الاسم بالكامل</label>
              <div className="relative">
                <User size={18} className="absolute start-3 top-2.5 text-ink-soft" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-canvas py-2 ps-10 pe-3 text-sm text-ink focus:border-amber focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={18} className="absolute start-3 top-2.5 text-ink-soft" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-canvas py-2 ps-10 pe-3 text-sm text-ink focus:border-amber focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">رقم الهاتف</label>
              <div className="relative">
                <Phone size={18} className="absolute start-3 top-2.5 text-ink-soft" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01xxxxxxxx"
                  className="w-full rounded-lg border border-border bg-canvas py-2 ps-10 pe-3 text-sm text-ink focus:border-amber focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink">الصلاحيات والحساب</label>
              <div className="relative">
                <Shield size={18} className="absolute start-3 top-2.5 text-ink-soft" />
                <input
                  type="text"
                  disabled
                  value={user?.roles?.join('، ') || 'مشرف'}
                  className="w-full rounded-lg border border-border bg-canvas/50 py-2 ps-10 pe-3 text-sm text-ink-soft cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* البصمة الصوتية للحضور والانصراف */}
        <VoiceEnrollmentButton />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber px-6 py-2.5 text-sm font-medium text-graphite-900 hover:bg-amber/90 transition disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التغيرات'}
          </button>
        </div>
      </form>
    </div>
  )
}