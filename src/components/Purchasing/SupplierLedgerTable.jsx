// File: src/components/Purchasing/SupplierLedgerTable.jsx
import { formatCurrency } from '../../utils/catalog'
import { LEDGER_TYPE_META } from './constants'

export default function SupplierLedgerTable({ entries }) {
  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-ink-soft">
        لا توجد حركات في كشف الحساب بعد
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-canvas text-[10px] text-ink-soft border-b border-border">
            <th className="px-4 py-3 text-right font-bold">التاريخ</th>
            <th className="px-4 py-3 text-right font-bold">النوع</th>
            <th className="px-4 py-3 text-right font-bold">المرجع</th>
            <th className="px-4 py-3 text-right font-bold">المبلغ</th>
            <th className="px-4 py-3 text-right font-bold">الرصيد المتبقي</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const meta = LEDGER_TYPE_META[e.type] || { label: e.type, className: 'bg-surface text-ink-soft border-border' }
            const isPayment = e.type === 'Payment'
            return (
              <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-canvas/50 transition">
                <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{new Date(e.date).toLocaleDateString('ar-EG')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft font-mono">{e.reference || '—'}</td>
                <td className={`px-4 py-3 font-mono font-bold ${isPayment ? 'text-emerald-700' : 'text-ink'}`}>
                  {isPayment ? '-' : '+'}{formatCurrency(Math.abs(e.amount))}
                </td>
                <td className="px-4 py-3 font-mono font-bold text-ink">{formatCurrency(e.runningBalance)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}