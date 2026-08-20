// File: src/pages/Moderator/ModeratorCategoriesPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Loader2, PencilLine, Plus, Tags, Trash2 } from 'lucide-react'
import {
  createModeratorCategory,
  deleteModeratorCategory,
  getModeratorCategories,
  updateModeratorCategory,
} from '../../api/moderatorApi'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'

function normalizeCategory(category = {}) {
  return {
    id: category.id ?? category.Id,
    name: category.name ?? category.Name ?? category.title ?? category.Title ?? '',
    description: category.description ?? category.Description ?? '',
    sortOrder: Number(category.sortOrder ?? category.SortOrder ?? 0),
    isActive: category.isActive ?? category.IsActive ?? true,
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  return value?.items ?? value?.Items ?? value?.data ?? value?.Data ?? []
}

export default function ModeratorCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', sortOrder: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loadCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getModeratorCategories()
      setCategories(normalizeArray(data).map(normalizeCategory))
    } catch (err) {
      setError(err?.message || 'تعذر تحميل الأقسام')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const totalCount = categories.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const visibleCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return categories.slice(start, start + pageSize)
  }, [categories, currentPage])

  function resetForm() {
    setEditingCategoryId(null)
    setForm({ name: '', description: '', sortOrder: '' })
  }

  function startEdit(category) {
    setEditingCategoryId(category.id)
    setForm({ name: category.name, description: category.description, sortOrder: String(category.sortOrder ?? '') })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      title: form.name.trim(),
      description: form.description.trim(),
      sortOrder: form.sortOrder === '' ? 0 : Number(form.sortOrder),
      isActive: true,
    }

    try {
      if (editingCategoryId) {
        await updateModeratorCategory(editingCategoryId, payload)
      } else {
        await createModeratorCategory(payload)
      }

      await loadCategories()
      resetForm()
      setCurrentPage(1)
    } catch (err) {
      setError(err?.message || 'تعذر حفظ القسم')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(categoryId) {
    if (!window.confirm('هل تريد حذف هذا القسم؟')) return

    setIsSubmitting(true)
    setError(null)

    try {
      await deleteModeratorCategory(categoryId)
      await loadCategories()
      if (editingCategoryId === categoryId) resetForm()
    } catch (err) {
      setError(err?.message || 'تعذر حذف القسم')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-ink-soft">
        <Loader2 className="animate-spin" size={18} />
        جاري تحميل الأقسام...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">الأقسام (لوحة المشرف)</h1>
          <p className="text-sm text-ink-soft">إدارة وتعديل أقسام المنتجات المتاحة.</p>
        </div>
        <div className="inline-flex rounded-full border border-amber/20 bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
          إجمالي الأقسام: {totalCount}
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card title={editingCategoryId ? 'تعديل قسم' : 'إضافة قسم'}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="اسم القسم"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              dir="auto"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              placeholder="الوصف"
              rows={4}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              dir="auto"
            />
            <input
              value={form.sortOrder}
              onChange={(e) => setForm((current) => ({ ...current, sortOrder: e.target.value }))}
              placeholder="ترتيب العرض"
              type="number"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none text-right"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {editingCategoryId ? 'حفظ التعديل' : 'إضافة القسم'}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink-soft"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card title="جدول الأقسام">
          {visibleCategories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="لا توجد أقسام"
              description="سيظهر هنا سجل الأقسام المتاحة للموديراتور."
            />
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-ink-soft">
                      <th className="pb-2 pl-4 font-medium">الاسم</th>
                      <th className="pb-2 pl-4 font-medium">الوصف</th>
                      <th className="pb-2 pl-4 font-medium">الترتيب</th>
                      <th className="pb-2 text-left font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCategories.map((category) => (
                      <tr key={category.id} className="border-b border-border last:border-0">
                        <td className="py-3 pl-4 font-medium text-ink" dir="auto">{category.name}</td>
                        <td className="py-3 pl-4 text-ink-soft" dir="auto">{category.description || '—'}</td>
                        <td className="py-3 pl-4 font-mono tabular-nums text-ink-soft">{category.sortOrder}</td>
                        <td className="py-3 text-left">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-amber hover:text-ink"
                            >
                              <PencilLine size={14} />
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5"
                            >
                              <Trash2 size={14} />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}