// File: src/components/Purchasing/SupplierOrdersTable.jsx
import { formatCurrency } from '../../utils/catalog'
import StatusBadge from './StatusBadge'

export default function SupplierOrdersTable({ orders }) {
  if (!orders.length) {
    return (
      <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-ink-soft">
        لا توجد أوامر شراء لهذا المورد بعد
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-canvas text-[10px] text-ink-soft border-b border-border">
            <th className="px-4 py-3 text-right font-bold">رقم الأمر</th>
            <th className="px-4 py-3 text-right font-bold">تاريخ الطلب</th>
            <th className="px-4 py-3 text-right font-bold">الإجمالي</th>
            <th className="px-4 py-3 text-right font-bold">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-border/60 last:border-0 hover:bg-canvas/50 transition">
              <td className="px-4 py-3 font-mono font-bold text-ink">{o.purchaseOrderNumber}</td>
              <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{new Date(o.orderDate).toLocaleDateString('ar-EG')}</td>
              <td className="px-4 py-3 font-mono font-bold text-ink">{formatCurrency(o.totalCost)}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}