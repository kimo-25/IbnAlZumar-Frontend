// File: src/components/ui/StatCard.jsx
export default function StatCard({ title, value, icon: Icon, trend, trendUp = true, className = '' }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-xs ${className}`} dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-soft">{title}</span>
        {Icon && (
          <div className="h-9 w-9 rounded-xl bg-canvas border border-border flex items-center justify-center text-emerald-600">
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="mt-3 text-xl font-bold font-mono text-ink">
        {value}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold mt-1.5 inline-block ${trendUp ? 'text-emerald-600' : 'text-danger'}`}>
          {trend}
        </span>
      )}
    </div>
  )
}