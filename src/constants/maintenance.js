// File: src/constants/maintenance.js
import { Clock, Banknote, ThumbsUp, XCircle, CheckCircle2 } from 'lucide-react'

// Mirrors IbnAlZumar.Domain.Enums.MaintenanceStatus (backend Enums.cs) — keep in sync.
export const MAINTENANCE_STATUS = {
  Pending: 1,
  Priced: 2,
  Approved: 3,
  Rejected: 4,
  Completed: 5
}

// Used to populate the status <select> inside MaintenanceResponseModal.
export const MAINTENANCE_STATUS_OPTIONS = [
  { value: MAINTENANCE_STATUS.Pending, label: 'قيد المراجعة' },
  { value: MAINTENANCE_STATUS.Priced, label: 'تم التسعير' },
  { value: MAINTENANCE_STATUS.Approved, label: 'تمت الموافقة' },
  { value: MAINTENANCE_STATUS.Rejected, label: 'مرفوض' },
  { value: MAINTENANCE_STATUS.Completed, label: 'تم الانتهاء' }
]

// Single source of truth for status → { label, badge classes, icon }.
// Used by BOTH the admin table (MaintenanceInquiriesTab) and the customer
// page (MyRequests.jsx) so the two views can never show different Arabic text.
export function getMaintenanceStatusMeta(status) {
  switch (Number(status)) {
    case MAINTENANCE_STATUS.Pending:
      return { label: 'قيد المراجعة', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock }
    case MAINTENANCE_STATUS.Priced:
      return { label: 'تم التسعير', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Banknote }
    case MAINTENANCE_STATUS.Approved:
      return { label: 'تمت الموافقة', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ThumbsUp }
    case MAINTENANCE_STATUS.Rejected:
      return { label: 'مرفوض', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle }
    case MAINTENANCE_STATUS.Completed:
      return { label: 'تم الانتهاء', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
    default:
      return { label: `غير معروف (${status})`, className: 'bg-canvas text-ink-soft border-border', icon: Clock }
  }
}

// Mirrors IbnAlZumar.Domain.Enums.DeliveryMethod
export const DELIVERY_METHOD_LABELS = {
  1: 'العميل سيحضر الجهاز للمحل',
  2: 'استلام عبر مندوب الشركة'
}

export function getDeliveryMethodLabel(method) {
  return DELIVERY_METHOD_LABELS[Number(method)] || 'غير محدد'
}