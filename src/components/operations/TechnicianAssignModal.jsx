// File: src/components/maintenance/TechnicianAssignModal.jsx
import { useEffect, useMemo, useState } from 'react'
import { X, Search, Check, Loader2, UserCog, AlertCircle } from 'lucide-react'
import { getTechnicians, assignTechnician } from '../../api/maintenanceWorkflowApi'

export default function TechnicianAssignModal({ ticket, onClose, onAssigned }) {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getTechnicians()
      .then((data) => {
        if (active) setTechnicians(data || [])
      })
      .catch((err) => {
        if (active) setError(err?.message || 'تعذر تحميل قائمة الفنيين.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(
    () => technicians.filter((t) => t.fullName.toLowerCase().includes(search.toLowerCase())),
    [technicians, search]
  )

  async function handleAssign(technicianId) {
    setSaving(true)
    setError(null)
    try {
      const updated = await assignTechnician(ticket.id, technicianId)
      onAssigned(updated)
    } catch (err) {
      setError(err?.message || 'تعذر إسناد الفني.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose} dir="rtl">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
            <UserCog size={16} className="text-emerald-600" />
            إسناد فني الصيانة
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-canvas cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن فني..."
            className="w-full rounded-xl border border-border bg-canvas p-2.5 pr-9 text-sm outline-none focus:border-emerald-500"
          />
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-soft">لا يوجد فنيون مطابقون</p>
            ) : (
              filtered.map((technician) => {
                const isCurrent = ticket.assignedTechnicianUserId === technician.id
                return (
                  <button
                    key={technician.id}
                    type="button"
                    disabled={saving}
                    onClick={() => handleAssign(technician.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-right text-sm transition cursor-pointer disabled:opacity-50 ${
                      isCurrent ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-border bg-canvas text-ink hover:border-emerald-300'
                    }`}
                  >
                    <span className="font-bold">{technician.fullName}</span>
                    {isCurrent && <Check size={15} className="text-emerald-600" />}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
