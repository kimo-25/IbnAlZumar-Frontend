import { getWarrantyLabel } from '../utils/warranty'

export default function WarrantyText({ item, className = '' }) {
  const label = getWarrantyLabel(item)
  if (!label) return null
  return <span className={className || 'text-[10px] font-semibold text-emerald-700'}>{label}</span>
}
