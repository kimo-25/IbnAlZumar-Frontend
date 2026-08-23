// File: src/components/Purchasing/StatusBadge.jsx
import { STATUS_META } from './constants'

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, className: 'bg-surface text-ink-soft border-border' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  )
}