// File: src/pages/Customers/CustomersPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2,
  PencilLine,
  Plus,
  Users,
  Trash2,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  X,
  ArrowLeft,
} from 'lucide-react'
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

// Deterministic, pleasant color pick per customer for the avatar chip
const AVATAR_PALETTE = [
  { bg: 'bg-amber/15', text: 'text-amber-dark' },
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  { bg: 'bg-sky-500/10', text: 'text-sky-600' },
  { bg: 'bg-violet-500/10', text: 'text-violet-600' },
  { bg: 'bg-rose-500/10', text: 'text-rose-600' },
]

function avatarStyleFor(id) {
  const key = String(id ?? '0')
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function getInitials(name) {
  const trimmed = (name || '').trim()
  if (!trimmed) return '؟'
  const parts = trimmed.split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + second).toUpperCase() || first.toUpperCase()
}

function FieldLabel({ icon: Icon, children }) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
      <Icon size={13} className="text-ink-soft/70" />
      {children}
    </label>
  )
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
  const totalDebt = useMemo(
    () => customers.reduce((sum, c) => sum + (Number.isFinite(c.currentDebt) ? c.currentDebt : 0), 0),
    [customers],
  )
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

  function goToDetails(customerId) {
    navigate(`/admin/customers/${customerId}`)
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
        <span className="text-sm">جاري تحميل العملاء...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-graphite-900 text-white shadow-sm">
            <Users size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">العملاء</h1>
            <p className="text-sm text-ink-soft">إدارة حسابات العملاء ومتابعة المديونيات المتبقية (الآجل / الشكك)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm">
            <Users size={15} className="text-ink-soft" />
            <span className="text-xs text-ink-soft">إجمالي العملاء</span>
            <span className="text-sm font-semibold text-ink">{totalCount}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber/20 bg-amber/10 px-4 py-2.5 shadow-sm">
            <Wallet size={15} className="text-amber-dark" />
            <span className="text-xs text-amber-dark">إجمالي المديونيات</span>
            <span className="text-sm font-semibold text-amber-dark">{totalDebt.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Form card */}
        <Card title={editingCustomerId ? 'تعديل عميل' : 'إضافة عميل جديد'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel icon={User}>الاسم الكامل</FieldLabel>
              <input
                value={form.fullName}
                onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                dir="auto"
              />
            </div>

            <div>
              <FieldLabel icon={Phone}>رقم الهاتف</FieldLabel>
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm((current) => ({ ...current, phoneNumber: e.target.value }))}
                placeholder="01xxxxxxxxx"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                dir="auto"
              />
            </div>

            <div>
              <FieldLabel icon={Mail}>البريد الإلكتروني</FieldLabel>
              <input
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                placeholder="example@mail.com"
                type="email"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                dir="auto"
              />
            </div>

            <div>
              <FieldLabel icon={MapPin}>العنوان</FieldLabel>
              <input
                value={form.address}
                onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                placeholder="العنوان بالتفصيل"
                className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                dir="auto"
              />
            </div>

            <div>
              <FieldLabel icon={Wallet}>المديونية الحالية</FieldLabel>
              <div className="relative">
                <input
                  value={form.currentDebt}
                  onChange={(e) => setForm((current) => ({ ...current, currentDebt: e.target.value }))}
                  placeholder="0"
                  type="number"
                  className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                />
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-ink-soft">
                  ج.م
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !form.fullName.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {editingCustomerId ? 'حفظ التعديل' : 'إضافة العميل'}
              </button>
              {editingCustomerId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm font-medium text-ink-soft transition hover:bg-surface-muted"
                >
                  <X size={15} />
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* Table card */}
        <Card title="جدول العملاء">
          {visibleCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا توجد بيانات عملاء"
              description="سيظهر هنا سجل العملاء من النظام مع أزرار الإضافة والتعديل والحذف."
            />
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/60 text-xs uppercase tracking-wider text-ink-soft">
                      <th className="px-4 py-3 font-medium">العميل</th>
                      <th className="px-4 py-3 font-medium">الهاتف</th>
                      <th className="px-4 py-3 font-medium">المديونية</th>
                      <th className="px-4 py-3 font-medium">العنوان</th>
                      <th className="px-4 py-3 text-left font-medium">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCustomers.map((customer) => {
                      const avatar = avatarStyleFor(customer.id)
                      const hasDebt = customer.currentDebt > 0
                      return (
                        <tr
                          key={customer.id}
                          className="group border-b border-border/70 last:border-0 transition hover:bg-surface-muted/40"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => goToDetails(customer.id)}
                              className="flex items-center gap-3 text-right"
                              title="اضغط لعرض تفاصيل وطلبات العميل"
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatar.bg} ${avatar.text}`}
                              >
                                {getInitials(customer.fullName)}
                              </span>
                              <span className="flex flex-col">
                                <span
                                  className="font-medium text-ink underline-offset-4 group-hover:text-primary group-hover:underline"
                                  dir="auto"
                                >
                                  {customer.fullName || 'بدون اسم'}
                                </span>
                                <span className="text-xs text-ink-soft" dir="auto">
                                  {customer.email || '—'}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-ink-soft" dir="auto">
                            {customer.phoneNumber || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums ${
                                hasDebt ? 'bg-danger/10 text-danger' : 'bg-emerald-500/10 text-emerald-600'
                              }`}
                            >
                              {customer.currentDebt.toLocaleString('ar-EG')} ج.م
                            </span>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-ink-soft" dir="auto" title={customer.address}>
                            {customer.address || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => goToDetails(customer.id)}
                                title="عرض التفاصيل"
                                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                              >
                                <Eye size={14} />
                                عرض
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(customer)}
                                title="تعديل العميل"
                                className="inline-flex items-center justify-center rounded-full border border-border p-1.5 text-ink-soft transition hover:border-amber hover:text-ink"
                              >
                                <PencilLine size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(customer.id)}
                                title="حذف العميل"
                                className="inline-flex items-center justify-center rounded-full border border-border p-1.5 text-danger transition hover:border-danger/40 hover:bg-danger/5"
                              >
                                <Trash2 size={14} />
                              </button>
                              <ArrowLeft
                                size={14}
                                className="mr-0.5 text-ink-soft opacity-0 transition group-hover:opacity-100"
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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