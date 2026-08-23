// File: src/components/Purchasing/SupplierPaymentsTable.jsx
import { formatCurrency } from '../../utils/catalog'
import { PAYMENT_METHOD_META } from './constants'

export default function SupplierPaymentsTable({ payments }) {
  if (!payments.length) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-ink-soft">
        لا توجد دفعات مسجلة بعد
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-canvas text-[10px] text-ink-soft border-b border-border">
            <th className="px-4 py-3 text-right font-bold">تاريخ الدفع</th>
            <th className="px-4 py-3 text-right font-bold">المبلغ</th>
            <th className="px-4 py-3 text-right font-bold">طريقة الدفع</th>
            <th className="px-4 py-3 text-right font-bold">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-canvas/50 transition">
              <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{new Date(p.paymentDate).toLocaleDateString('ar-EG')}</td>
              <td className="px-4 py-3 font-mono font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-border bg-canvas px-2.5 py-0.5 text-[10px] font-bold text-ink-soft">
                  {PAYMENT_METHOD_META[p.method] || p.method}
                </span>
              </td>
              <td className="px-4 py-3 text-ink-soft">{p.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}