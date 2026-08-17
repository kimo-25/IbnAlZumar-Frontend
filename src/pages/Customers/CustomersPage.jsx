// File: src/pages/Customers/CustomersPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, PencilLine, Plus, Users, Trash2 } from 'lucide-react'
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from '../../api/adminApi'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'

function normalizeCustomer(customer = {}) {
  return {
    id: customer.id ?? customer.Id,
    fullName: customer.fullName ?? customer.FullName ?? customer.name ?? customer.Name ?? '',
    phoneNumber: customer.phoneNumber ?? customer.PhoneNumber ?? customer.phone ?? customer.Phone ?? '',
    email: customer.email ?? customer.Email ?? '',
    address: customer.address ?? customer.Address ?? '',
    currentDebt: Number(customer.currentDebt ?? customer.CurrentDebt ?? customer.debt ?? customer.Debt ?? 0),
  }
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  return value?.items ?? value?.Items ?? value?.data ?? value?.Data ?? []
}

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState(null)
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', email: '', address: '', currentDebt: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    getCustomers()
      .then((data) => {
        if (!active) return
        setCustomers(normalizeArray(data).map(normalizeCustomer))
      })
      .catch((err) => {
        if (!active) return
        setError(err?.message || 'تعذر تحميل العملاء')
        setCustomers([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const totalCount = customers.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const visibleCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return customers.slice(start, start + pageSize)
  }, [customers, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function resetForm() {
    setEditingCustomerId(null)
    setForm({ fullName: '', phoneNumber: '', email: '', address: '', currentDebt: '' })
  }

  function startEdit(customer) {
    setEditingCustomerId(customer.id)
    setForm({
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      address: customer.address,
      currentDebt: String(customer.currentDebt ?? ''),
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload = {
      fullName: form.fullName.trim(),
      name: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      phone: form.phoneNumber.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      currentDebt: form.currentDebt === '' ? 0 : Number(form.currentDebt),
      debt: form.currentDebt === '' ? 0 : Number(form.currentDebt),
    }

    try {
      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, payload)
      } else {
        await createCustomer(payload)
      }

      const next = normalizeArray(await getCustomers()).map(normalizeCustomer)
      setCustomers(next)
      resetForm()
      setCurrentPage(1)
    } catch (err) {
      setError(err?.message || 'تعذر حفظ العميل')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(customerId) {
    if (!window.confirm('هل تريد حذف هذا العميل؟')) return

    setIsSubmitting(true)
    setError(null)

    try {
      await deleteCustomer(customerId)
      const next = normalizeArray(await getCustomers()).map(normalizeCustomer)
      setCustomers(next)
      if (editingCustomerId === customerId) resetForm()
    } catch (err) {
      setError(err?.message || 'تعذر حذف العميل')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-ink-soft">
        <Loader2 className="animate-spin" size={18} />
        جاري تحميل العملاء...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">العملاء</h1>
          <p className="text-sm text-ink-soft">إدارة حسابات العملاء ومتابعة المديونيات المتبقية (الآجل / الشكك).</p>
        </div>
        <div className="inline-flex rounded-full border border-amber/20 bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
          إجمالي العملاء: {totalCount}
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card title={editingCustomerId ? 'تعديل عميل' : 'إضافة عميل'}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={form.fullName}
              onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
              placeholder="الاسم الكامل"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              dir="auto"
            />
            <input
              value={form.phoneNumber}
              onChange={(e) => setForm((current) => ({ ...current, phoneNumber: e.target.value }))}
              placeholder="رقم الهاتف"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              dir="auto"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="البريد الإلكتروني"
              type="email"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              dir="auto"
            />
            <input
              value={form.address}
              onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
              placeholder="العنوان"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none"
              dir="auto"
            />
            <input
              value={form.currentDebt}
              onChange={(e) => setForm((current) => ({ ...current, currentDebt: e.target.value }))}
              placeholder="المديونية الحالية"
              type="number"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none text-right"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !form.fullName.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={16} />
                {editingCustomerId ? 'حفظ التعديل' : 'إضافة العميل'}
              </button>
              {editingCustomerId && (
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

        <Card title="جدول العملاء">
          {visibleCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا توجد بيانات عملاء"
              description="سيظهر هنا سجل العملاء من النظام مع أزرار الإضافة والتعديل والحذف."
            />
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-ink-soft">
                      <th className="pb-2 pl-4 font-medium">الاسم</th>
                      <th className="pb-2 pl-4 font-medium">الهاتف</th>
                      <th className="pb-2 pl-4 font-medium">المديونية</th>
                      <th className="pb-2 pl-4 font-medium">العنوان</th>
                      <th className="pb-2 text-left font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-border last:border-0">
                        <td 
                          className="py-3 pl-4 font-medium text-ink cursor-pointer hover:underline text-primary" 
                          dir="auto"
                          onClick={() => navigate(`/admin/customers/${customer.id}`)}
                          title="اضغط لعرض تفاصيل وطلبات العميل"
                        >
                          {customer.fullName}
                        </td>
                        <td className="py-3 pl-4 text-ink-soft" dir="auto">{customer.phoneNumber || '—'}</td>
                        <td className="py-3 pl-4 font-mono tabular-nums text-ink-soft">{customer.currentDebt} ج.م</td>
                        <td className="py-3 pl-4 text-ink-soft" dir="auto">{customer.address || '—'}</td>
                        <td className="py-3 text-left">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(customer)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-amber hover:text-ink"
                            >
                              <PencilLine size={14} />
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(customer.id)}
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