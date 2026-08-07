// File: src/components/ui/Card.jsx
export default function Card({ title, children, className = '', actions }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-xs p-6 ${className}`} dir="rtl">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          {title && <h3 className="text-sm font-bold text-ink">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}