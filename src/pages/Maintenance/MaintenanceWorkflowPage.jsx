// File: src/pages/Maintenance/MaintenanceWorkflowPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, Table as TableIcon, Loader2, AlertCircle, RefreshCw, Wrench } from 'lucide-react'
import { getMaintenanceTickets, getTechnicians } from '../../api/maintenanceWorkflowApi'
import {
  KANBAN_COLUMNS,
  ALL_STATUSES,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
} from '../../utils/maintenance/statusMachine'
import MaintenanceTicketDrawer from '../../components/maintenance/MaintenanceTicketDrawer'

function TicketCard({ ticket, onOpen }) {
  const color = MAINTENANCE_STATUS_COLORS[ticket.status]
  return (
    <button
      type="button"
      onClick={() => onOpen(ticket)}
      className={`w-full rounded-xl border p-3 text-right text-xs shadow-xs transition hover:shadow-md cursor-pointer ${color.border} bg-surface`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-ink">#{ticket.id}</span>
        {ticket.partsCount > 0 && (
          <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
            {ticket.partsCount} قطعة
          </span>
        )}
      </div>
      <div className="mt-1 truncate font-bold text-ink">{ticket.customerName || 'عميل غير مسجل'}</div>
      <p className="mt-0.5 line-clamp-2 text-ink-soft" dir="auto">{ticket.problemDescription}</p>
      {ticket.assignedTechnicianName && (
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold text-ink-soft">
          <Wrench size={10} />
          {ticket.assignedTechnicianName}
        </div>
      )}
      {(ticket.actualCost ?? ticket.estimatedPrice) != null && (
        <div className="mt-1.5 font-mono text-[11px] font-bold text-emerald-700">
          {(ticket.actualCost ?? ticket.estimatedPrice).toFixed(2)} ج.م
        </div>
      )}
    </button>
  )
}

export default function MaintenanceWorkflowPage() {
  const [view, setView] = useState('kanban') // 'kanban' | 'table'
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    loadTickets()
    getTechnicians().then(setTechnicians).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, technicianFilter])

  async function loadTickets() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMaintenanceTickets({
        status: statusFilter || undefined,
        technicianId: technicianFilter || undefined,
        pageSize: 200,
      })
      setTickets(data.items || [])
    } catch (err) {
      setError(err?.message || 'تعذر تحميل طلبات الصيانة.')
    } finally {
      setLoading(false)
    }
  }

  const ticketsByStatus = useMemo(() => {
    const map = {}
    for (const status of KANBAN_COLUMNS) map[status] = []
    for (const ticket of tickets) {
      if (map[ticket.status]) map[ticket.status].push(ticket)
    }
    return map
  }, [tickets])

  function handleTicketUpdated(updated) {
    setSelectedTicket(updated)
    setTickets((prev) => {
      const exists = prev.some((t) => t.id === updated.id)
      const listItem = {
        id: updated.id,
        customerName: updated.customerName,
        customerPhone: updated.customerPhone,
        problemDescription: updated.problemDescription,
        status: updated.status,
        assignedTechnicianUserId: updated.assignedTechnicianUserId,
        assignedTechnicianName: updated.assignedTechnicianName,
        estimatedPrice: updated.estimatedPrice,
        actualCost: updated.actualCost,
        partsCount: (updated.partUsages || []).length,
        createdAt: updated.createdAt,
        scheduledDate: updated.scheduledDate,
      }
      return exists ? prev.map((t) => (t.id === updated.id ? listItem : t)) : [listItem, ...prev]
    })
  }

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-6" dir="rtl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-black text-ink text-lg">
          <Wrench size={20} className="text-emerald-600" />
          طلبات الصيانة الداخلية
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-ink outline-none focus:border-emerald-500"
          >
            <option value="">كل الحالات</option>
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MAINTENANCE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-ink outline-none focus:border-emerald-500"
          >
            <option value="">كل الفنيين</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.fullName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadTickets}
            className="rounded-xl border border-border bg-surface p-2 text-ink-soft transition hover:bg-canvas cursor-pointer"
            title="تحديث"
          >
            <RefreshCw size={15} />
          </button>

          <div className="flex overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition cursor-pointer ${
                view === 'kanban' ? 'bg-emerald-600 text-white' : 'bg-surface text-ink-soft hover:bg-canvas'
              }`}
            >
              <LayoutGrid size={14} />
              كانبان
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition cursor-pointer ${
                view === 'table' ? 'bg-emerald-600 text-white' : 'bg-surface text-ink-soft hover:bg-canvas'
              }`}
            >
              <TableIcon size={14} />
              جدول
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const color = MAINTENANCE_STATUS_COLORS[status]
            const columnTickets = ticketsByStatus[status] || []
            return (
              <div key={status} className="w-64 shrink-0">
                <div className={`mb-2 flex items-center justify-between rounded-xl border px-3 py-2 ${color.bg} ${color.border}`}>
                  <span className={`text-xs font-bold ${color.text}`}>{MAINTENANCE_STATUS_LABELS[status]}</span>
                  <span className={`rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold ${color.text}`}>{columnTickets.length}</span>
                </div>
                <div className="space-y-2">
                  {columnTickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-ink-soft">
                      لا توجد طلبات
                    </div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} onOpen={setSelectedTicket} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-border bg-canvas font-semibold text-ink-soft">
                <tr>
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">وصف العطل</th>
                  <th className="p-3">الفني</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">التكلفة</th>
                  <th className="p-3">تاريخ الإنشاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-soft">
                      لا توجد طلبات مطابقة
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => {
                    const color = MAINTENANCE_STATUS_COLORS[ticket.status]
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="cursor-pointer transition hover:bg-canvas/50"
                      >
                        <td className="p-3 font-mono font-bold text-ink">#{ticket.id}</td>
                        <td className="p-3 font-bold text-ink">{ticket.customerName || 'عميل غير مسجل'}</td>
                        <td className="max-w-xs truncate p-3 text-ink-soft" dir="auto">{ticket.problemDescription}</td>
                        <td className="p-3 text-ink-soft">{ticket.assignedTechnicianName || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${color.bg} ${color.text} ${color.border}`}>
                            {MAINTENANCE_STATUS_LABELS[ticket.status]}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {ticket.actualCost != null ? `${ticket.actualCost.toFixed(2)} ج.م` : ticket.estimatedPrice != null ? `${ticket.estimatedPrice.toFixed(2)} ج.م (تقديري)` : '-'}
                        </td>
                        <td className="p-3 text-ink-soft">{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTicket && (
        <MaintenanceTicketDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={handleTicketUpdated}
        />
      )}
    </div>
  )
}
