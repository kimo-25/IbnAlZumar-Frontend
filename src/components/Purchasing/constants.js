// File: src/components/Purchasing/constants.js

export const STATUS_META = {
  Draft: { label: 'مسودة', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Received: { label: 'تم الاستلام', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export const LEDGER_TYPE_META = {
  Purchase: { label: 'فاتورة شراء', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  Payment: { label: 'دفعة سداد', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export const PAYMENT_METHOD_META = {
  Cash: 'كاش',
  Transfer: 'تحويل بنكي',
  Cheque: 'شيك'
}

export function innerTabClass(active) {
  return `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition ${
    active ? 'bg-emerald-600 text-white shadow-xs' : 'bg-canvas text-ink-soft hover:text-ink'
  }`
}