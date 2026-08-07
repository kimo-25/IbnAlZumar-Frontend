// File: src/components/ui/EmptyState.jsx
import { PackageOpen } from 'lucide-react'

export default function EmptyState({ 
  icon: Icon = PackageOpen, 
  title = 'لا توجد بيانات متاحة', 
  description = 'لم يتم العثور على أي عناصر لعرضها في الوقت الحالي.',
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" dir="rtl">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-canvas border border-border text-ink-soft mb-4 shadow-xs">
        <Icon size={28} />
      </div>
      <h3 className="text-sm font-bold text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-soft max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}