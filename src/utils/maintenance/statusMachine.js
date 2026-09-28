// File: src/utils/maintenance/statusMachine.js
//
// Mirrors Domain/Enums/Enums.cs MaintenanceStatus and MaintenanceWorkflowService's
// AllowedTransitions table. Used to render Kanban columns, disable invalid quick-action
// buttons, and label statuses consistently across the table/Kanban/receipt views. The SERVER
// is still the source of truth for whether a transition is valid — this only drives the UI so
// the cashier/technician isn't offered a button that will just come back as a 400.

export const MAINTENANCE_STATUS = {
  PENDING: 1,
  PRICED: 2,
  APPROVED: 3,
  REJECTED: 4,
  COMPLETED: 5,
  IN_DIAGNOSTICS: 6,
  AWAITING_PARTS: 7,
  IN_REPAIR: 8,
  DELIVERED: 9,
  CANCELLED: 10,
}

export const MAINTENANCE_STATUS_LABELS = {
  [MAINTENANCE_STATUS.PENDING]: 'قيد الانتظار',
  [MAINTENANCE_STATUS.PRICED]: 'تم التسعير',
  [MAINTENANCE_STATUS.APPROVED]: 'تمت الموافقة',
  [MAINTENANCE_STATUS.REJECTED]: 'مرفوض',
  [MAINTENANCE_STATUS.COMPLETED]: 'تم الانتهاء',
  [MAINTENANCE_STATUS.IN_DIAGNOSTICS]: 'قيد الفحص',
  [MAINTENANCE_STATUS.AWAITING_PARTS]: 'بانتظار قطع الغيار',
  [MAINTENANCE_STATUS.IN_REPAIR]: 'قيد الإصلاح',
  [MAINTENANCE_STATUS.DELIVERED]: 'تم التسليم',
  [MAINTENANCE_STATUS.CANCELLED]: 'ملغى',
}

export const MAINTENANCE_STATUS_COLORS = {
  [MAINTENANCE_STATUS.PENDING]: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  [MAINTENANCE_STATUS.PRICED]: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-500' },
  [MAINTENANCE_STATUS.APPROVED]: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  [MAINTENANCE_STATUS.REJECTED]: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
  [MAINTENANCE_STATUS.COMPLETED]: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  [MAINTENANCE_STATUS.IN_DIAGNOSTICS]: { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200', dot: 'bg-violet-500' },
  [MAINTENANCE_STATUS.AWAITING_PARTS]: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
  [MAINTENANCE_STATUS.IN_REPAIR]: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500' },
  [MAINTENANCE_STATUS.DELIVERED]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
  [MAINTENANCE_STATUS.CANCELLED]: { bg: 'bg-canvas', text: 'text-ink-soft', border: 'border-border', dot: 'bg-ink-soft' },
}

// Kanban column order — the technician-facing shop-floor flow. Rejected/Cancelled are
// deliberately left out of the board (they're dead ends) and are only reachable via the
// table view's status filter.
export const KANBAN_COLUMNS = [
  MAINTENANCE_STATUS.PENDING,
  MAINTENANCE_STATUS.IN_DIAGNOSTICS,
  MAINTENANCE_STATUS.PRICED,
  MAINTENANCE_STATUS.APPROVED,
  MAINTENANCE_STATUS.AWAITING_PARTS,
  MAINTENANCE_STATUS.IN_REPAIR,
  MAINTENANCE_STATUS.COMPLETED,
  MAINTENANCE_STATUS.DELIVERED,
]

export const ALL_STATUSES = [
  MAINTENANCE_STATUS.PENDING,
  MAINTENANCE_STATUS.IN_DIAGNOSTICS,
  MAINTENANCE_STATUS.PRICED,
  MAINTENANCE_STATUS.APPROVED,
  MAINTENANCE_STATUS.REJECTED,
  MAINTENANCE_STATUS.AWAITING_PARTS,
  MAINTENANCE_STATUS.IN_REPAIR,
  MAINTENANCE_STATUS.COMPLETED,
  MAINTENANCE_STATUS.DELIVERED,
  MAINTENANCE_STATUS.CANCELLED,
]

const ALLOWED_TRANSITIONS = {
  [MAINTENANCE_STATUS.PENDING]: [MAINTENANCE_STATUS.IN_DIAGNOSTICS, MAINTENANCE_STATUS.CANCELLED],
  [MAINTENANCE_STATUS.IN_DIAGNOSTICS]: [MAINTENANCE_STATUS.PRICED, MAINTENANCE_STATUS.AWAITING_PARTS, MAINTENANCE_STATUS.IN_REPAIR, MAINTENANCE_STATUS.CANCELLED],
  [MAINTENANCE_STATUS.PRICED]: [MAINTENANCE_STATUS.APPROVED, MAINTENANCE_STATUS.REJECTED, MAINTENANCE_STATUS.CANCELLED],
  [MAINTENANCE_STATUS.APPROVED]: [MAINTENANCE_STATUS.AWAITING_PARTS, MAINTENANCE_STATUS.IN_REPAIR, MAINTENANCE_STATUS.CANCELLED],
  [MAINTENANCE_STATUS.AWAITING_PARTS]: [MAINTENANCE_STATUS.IN_REPAIR, MAINTENANCE_STATUS.CANCELLED],
  [MAINTENANCE_STATUS.IN_REPAIR]: [MAINTENANCE_STATUS.COMPLETED, MAINTENANCE_STATUS.CANCELLED],
  [MAINTENANCE_STATUS.COMPLETED]: [MAINTENANCE_STATUS.DELIVERED],
  [MAINTENANCE_STATUS.REJECTED]: [],
  [MAINTENANCE_STATUS.CANCELLED]: [],
  [MAINTENANCE_STATUS.DELIVERED]: [],
}

export function getAllowedNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || []
}
