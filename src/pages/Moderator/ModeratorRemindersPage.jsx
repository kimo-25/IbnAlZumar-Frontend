// File: src/pages/Moderator/ModeratorRemindersPage.jsx
import React, { useEffect, useState } from 'react'
import { 
  getAllRemindersAdmin, 
  createReminderAdmin, 
  updateReminderAdmin, 
  toggleReminderStatusAdmin, 
  deleteReminderAdmin 
} from '../../api/reminders'
import { BookOpen, Plus, Trash2, Edit3, Power, Loader2, X } from 'lucide-react'

export default function ModeratorRemindersPage() {
  const [reminders, setReminders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    text: '',
    type: 2,
    source: '',
    surahName: '',
    ayahNumber: '',
    isActive: true
  })

  const loadReminders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAllRemindersAdmin()
      setReminders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذر تحميل الأذكار')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()
  }, [])

  const handleOpenModal = (reminder = null) => {
    if (reminder) {
      setEditingId(reminder.id || reminder.Id)
      setFormData({
        text: reminder.text || reminder.Text || '',
        type: reminder.type ?? reminder.Type ?? 2,
        source: reminder.source || reminder.Source || '',
        surahName: reminder.surahName || reminder.SurahName || '',
        ayahNumber: reminder.ayahNumber || reminder.AyahNumber || '',
        isActive: reminder.isActive ?? reminder.IsActive ?? true
      })
    } else {
      setEditingId(null)
      setFormData({ text: '', type: 2, source: '', surahName: '', ayahNumber: '', isActive: true })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const dto = {
      text: formData.text,
      type: Number(formData.type),
      source: formData.source || null,
      surahName: formData.type == 1 ? formData.surahName : null,
      ayahNumber: formData.type == 1 && formData.ayahNumber ? Number(formData.ayahNumber) : null,
      isActive: formData.isActive
    }

    try {
      if (editingId) {
        await updateReminderAdmin(editingId, dto)
      } else {
        await createReminderAdmin(dto)
      }
      setIsModalOpen(false)
      loadReminders()
    } catch (err) {
      alert(err?.response?.data?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await toggleReminderStatusAdmin(id)
      loadReminders()
    } catch (err) {
      alert('تعذر تغيير حالة الذكر')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا الذكر؟')) return
    try {
      await deleteReminderAdmin(id)
      loadReminders()
    } catch (err) {
      alert('تعذر حذف الذكر')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <BookOpen className="text-emerald-600" /> إدارة الأذكار والآيات (المشرف)
          </h1>
          <p className="text-sm text-ink-soft">إضافة وتفعيل الأذكار والآيات الظاهرة للمستخدمين.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
        >
          <Plus size={18} /> إضافة ذكر جديد
        </button>
      </div>

      {error && <div className="p-4 rounded-xl bg-danger/10 text-danger text-sm">{error}</div>}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-ink-soft flex justify-center items-center gap-2">
            <Loader2 className="animate-spin" size={20} /> جاري تحميل الأذكار...
          </div>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">النص</th>
                <th className="p-4">النوع</th>
                <th className="p-4">المصدر / السورة</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reminders.map((r, idx) => {
                const id = r.id || r.Id
                const text = r.text || r.Text
                const type = r.type ?? r.Type
                const source = r.source || r.Source
                const surahName = r.surahName || r.SurahName
                const ayahNumber = r.ayahNumber || r.AyahNumber
                const isActive = r.isActive ?? r.IsActive

                return (
                  <tr key={id} className="hover:bg-canvas/50 transition">
                    <td className="p-4 font-mono">{idx + 1}</td>
                    <td className="p-4 max-w-md font-medium text-ink leading-relaxed">{text}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${type === 1 ? 'bg-amber/10 text-amber-dark' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {type === 1 ? 'قرآن كريم' : 'ذكر / دعاء'}
                      </span>
                    </td>
                    <td className="p-4 text-ink-soft">
                      {type === 1 ? (surahName ? `سورة ${surahName} (${ayahNumber || ''})` : '-') : (source || '-')}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Power size={12} />
                        {isActive ? 'نشط' : 'موقوف'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(r)}
                          className="p-1.5 text-ink-soft hover:text-amber hover:bg-canvas rounded-lg transition"
                          title="تعديل"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          className="p-1.5 text-ink-soft hover:text-danger hover:bg-canvas rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-ink">
                {editingId ? 'تعديل الذكر' : 'إضافة ذكر جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-soft hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">النوع</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option value={2}>ذكر / دعاء / حديث</option>
                  <option value={1}>قرآن كريم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">النص الكامل</label>
                <textarea
                  required
                  rows={3}
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="أدخل نص الذكر أو الآية القرآنية..."
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              {formData.type === 1 ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">اسم السورة</label>
                    <input
                      type="text"
                      value={formData.surahName}
                      onChange={(e) => setFormData({ ...formData, surahName: e.target.value })}
                      placeholder="مثال: البقرة"
                      className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">رقم الآية</label>
                    <input
                      type="number"
                      value={formData.ayahNumber}
                      onChange={(e) => setFormData({ ...formData, ayahNumber: e.target.value })}
                      placeholder="مثال: 255"
                      className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">المصدر (اختياري)</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="مثال: حديث شريف / متفق عليه"
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveMod"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActiveMod" className="text-sm font-medium text-ink">
                  تفعيل الذكر ليظهر في المتجر فوراً
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-soft hover:bg-canvas transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}