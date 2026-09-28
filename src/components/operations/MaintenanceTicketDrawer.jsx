// File: src/components/maintenance/MaintenanceTicketDrawer.jsx
import { useState } from 'react'
import { X, UserCog, Wrench, Printer, Send, Loader2, AlertCircle, Clock } from 'lucide-react'
import {
  changeMaintenanceStatus,
  addMaintenanceNote,
  setMaintenanceLaborCost,
  getMaintenanceReceipt,
} from '../../api/maintenanceWorkflowApi'
import { MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS, getAllowedNextStatuses } from '../../utils/maintenance/statusMachine'
import { openPrintWindow } from '../../utils/print/shared'
import { renderMaintenanceDeviceLabel, renderMaintenanceReceipt } from '../../utils/print/renderMaintenanceReceipt'
import TechnicianAssignModal from './TechnicianAssignModal'
import PartUsageModal from './PartUsageModal'

export default function MaintenanceTicketDrawer({ ticket, onClose, onUpdated }) {
  const [showTechnicianModal, setShowTechnicianModal] = useState(false)
  const [showPartsModal, setShowPartsModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [laborCostInput, setLaborCostInput] = useState(ticket.laborCost ?? 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [printing, setPrinting] = useState(false)

  const color = MAINTENANCE_STATUS_COLORS[ticket.status]
  const nextStatuses = getAllowedNextStatuses(ticket.status)

  async function handleTransition(newStatus) {
    setBusy(true)
    setError(null)
    try {
      const updated = await changeMaintenanceStatus(ticket.id, newStatus)
      onUpdated(updated)
    } catch (err) {
      setError(err?.message || 'تعذر تغيير الحالة.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return
    setBusy(true)
    setError(null)
    try {
      const updated = await addMaintenanceNote(ticket.id, newNote.trim())
      onUpdated(updated)
      setNewNote('')
    } catch (err) {
      setError(err?.message || 'تعذر إضافة الملاحظة.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveLaborCost() {
    setBusy(true)
    setError(null)
    try {
      const updated = await setMaintenanceLaborCost(ticket.id, Number(laborCostInput) || 0)
      onUpdated(updated)
    } catch (err) {
      setError(err?.message || 'تعذر حفظ قيمة المصنعية.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePrintReceipt() {
    setPrinting(true)
    setError(null)
    try {
      const receipt = await getMaintenanceReceipt(ticket.id)
      openPrintWindow(renderMaintenanceReceipt(receipt))
    } catch (err) {
      setError(err?.message || 'تعذر إنشاء الإيصال.')
    } finally {
      setPrinting(false)
    }
  }

  function handlePrintDeviceLabel() {
    setError(null)
    try {
      openPrintWindow(renderMaintenanceDeviceLabel(ticket))
    } catch (err) {
      setError(err?.message || 'تعذر إنشاء باركود الجهاز.')
    }
  }

  const partsTotal = (ticket.partUsages || []).reduce((sum, p) => sum + p.lineTotal, 0)
  const runningTotal = (ticket.laborCost || 0) + partsTotal

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-end bg-black/40" onClick={onClose} dir="rtl">
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-ink">طلب صيانة #{ticket.id}</h3>
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${color.bg} ${color.text} ${color.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
              {MAINTENANCE_STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-canvas cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & problem */}
        <div className="space-y-1 rounded-xl border border-border bg-canvas p-3 text-xs">
          <div className="font-bold text-ink">{ticket.customerName || 'عميل غير مسجل'}</div>
          <div className="text-ink-soft">{ticket.customerPhone || '-'}</div>
          <div className="pt-1 text-ink" dir="auto">{ticket.problemDescription}</div>
        </div>

        {/* Quick status transitions */}
        {nextStatuses.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink">نقل الحالة إلى</p>
            <div className="flex flex-wrap gap-1.5">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy}
                  onClick={() => handleTransition(status)}
                  className="rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-[11px] font-bold text-ink-soft transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {MAINTENANCE_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Technician / parts launchers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowTechnicianModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-canvas py-2.5 text-xs font-bold text-ink transition hover:border-emerald-300 cursor-pointer"
          >
            <UserCog size={14} className="text-emerald-600" />
            {ticket.assignedTechnicianName || 'إسناد فني'}
          </button>
          <button
            type="button"
            onClick={() => setShowPartsModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-canvas py-2.5 text-xs font-bold text-ink transition hover:border-emerald-300 cursor-pointer"
          >
            <Wrench size={14} className="text-emerald-600" />
            قطع الغيار ({(ticket.partUsages || []).length})
          </button>
        </div>

        {/* Cost summary */}
        <div className="space-y-2 rounded-xl border border-border bg-canvas p-3">
          <p className="text-xs font-bold text-ink">التكلفة</p>
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>السعر التقديري</span>
            <span className="font-mono">{ticket.estimatedPrice != null ? `${ticket.estimatedPrice.toFixed(2)} ج.م` : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex-1 text-[11px] font-bold text-ink-soft">
              المصنعية
              <input
                type="number"
                min="0"
                step="0.01"
                value={laborCostInput}
                onChange={(e) => setLaborCostInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
              />
            </label>
            <button
              type="button"
              onClick={handleSaveLaborCost}
              disabled={busy}
              className="mt-4 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              حفظ
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>قطع الغيار</span>
            <span className="font-mono">{partsTotal.toFixed(2)} ج.م</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold text-ink">
            <span>{ticket.actualCost != null ? 'التكلفة الفعلية النهائية' : 'الإجمالي الحالي'}</span>
            <span className="font-mono text-emerald-700">{(ticket.actualCost ?? runningTotal).toFixed(2)} ج.م</span>
          </div>
        </div>

        {/* Print receipt */}
        <button
          type="button"
          onClick={handlePrintReceipt}
          disabled={printing}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-graphite-900 py-2.5 text-xs font-bold text-white transition hover:bg-graphite-800 disabled:opacity-60 cursor-pointer"
        >
          {printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
          طباعة إيصال الصيانة
        </button>
        <button
          type="button"
          onClick={handlePrintDeviceLabel}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-canvas py-2.5 text-xs font-bold text-ink transition hover:border-emerald-300 cursor-pointer"
        >
          <Printer size={14} className="text-emerald-600" />
          طبع باركود الجهاز
        </button>

        {/* Notes log */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Clock size={13} className="text-ink-soft" />
            سجل الملاحظات
          </p>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="أضف ملاحظة..."
              className="flex-1 rounded-xl border border-border bg-canvas p-2 text-xs outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={busy || !newNote.trim()}
              className="rounded-xl bg-emerald-600 px-3 text-white transition hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>

          <div className="max-h-52 space-y-2 overflow-y-auto">
            {(ticket.notes || []).length === 0 ? (
              <p className="py-3 text-center text-[11px] text-ink-soft">لا توجد ملاحظات بعد</p>
            ) : (
              ticket.notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-border bg-canvas p-2 text-[11px]">
                  <div className="flex items-center justify-between text-ink-soft">
                    <span className="font-bold text-ink">{note.authorName}</span>
                    <span>{new Date(note.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <p className="mt-1 text-ink" dir="auto">{note.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showTechnicianModal && (
        <TechnicianAssignModal
          ticket={ticket}
          onClose={() => setShowTechnicianModal(false)}
          onAssigned={(updated) => {
            onUpdated(updated)
            setShowTechnicianModal(false)
          }}
        />
      )}

      {showPartsModal && (
        <PartUsageModal
          ticket={ticket}
          onClose={() => setShowPartsModal(false)}
          onUpdated={onUpdated}
        />
      )}
    </div>
  )
}
