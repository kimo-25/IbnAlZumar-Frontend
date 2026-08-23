// File: src/components/Purchasing/SupplierDetailsModal.jsx
import { useEffect, useState } from 'react'
import { X, Loader2, FileText, Wallet, TrendingUp, BadgeCheck, Receipt, History, PackagePlus, Banknote } from 'lucide-react'
import { getSupplierDetails, getSupplierLedger } from '../../api/purchasingApi'
import { formatCurrency } from '../../utils/catalog'
import { innerTabClass } from './constants'
import SupplierLedgerTable from './SupplierLedgerTable'
import SupplierPaymentsTable from './SupplierPaymentTable'
import SupplierOrdersTable from './SupplierOrdersTable'
import AddPaymentModal from './AddPaymentModal'

export default function SupplierDetailsModal({ supplierId, onClose, onPaymentRecorded }) {
  const [details, setDetails] = useState(null)
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(true)
  const [innerTab, setInnerTab] = useState('ledger') // 'ledger' | 'payments' | 'orders'
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  useEffect(() => { load() }, [supplierId])

  async function load() {
    setLoading(true)
    const [detailsData, ledgerData] = await Promise.all([
      getSupplierDetails(supplierId),
      getSupplierLedger(supplierId)
    ])
    setDetails(detailsData)
    setLedger(Array.isArray(ledgerData) ? ledgerData : [])
    setLoading(false)
  }

  function handlePaymentSaved() {
    setPaymentModalOpen(false)
    load()
    onPaymentRecorded?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface p-4 z-10">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            كشف حساب المورد{details ? ` — ${details.name}` : ''}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition"><X size={16} /></button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> جاري تحميل بيانات المورد...
          </div>
        ) : !details ? (
          <div className="py-16 text-center text-xs text-ink-soft">تعذر تحميل بيانات المورد</div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700">
                  <Wallet size={12} /> الرصيد المستحق
                </div>
                <div className="mt-1.5 font-mono font-bold text-sm text-amber-700">{formatCurrency(details.currentBalance)}</div>
              </div>
              <div className="rounded-xl border border-border bg-canvas p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-soft">
                  <TrendingUp size={12} /> إجمالي المشتريات
                </div>
                <div className="mt-1.5 font-mono font-bold text-sm text-ink">{formatCurrency(details.totalPurchases)}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                  <BadgeCheck size={12} /> إجمالي المدفوع
                </div>
                <div className="mt-1.5 font-mono font-bold text-sm text-emerald-700">{formatCurrency(details.totalPaid)}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setInnerTab('ledger')} className={innerTabClass(innerTab === 'ledger')}>
                  <Receipt size={13} /> كشف الحساب
                </button>
                <button onClick={() => setInnerTab('payments')} className={innerTabClass(innerTab === 'payments')}>
                  <History size={13} /> سجل الدفعات
                </button>
                <button onClick={() => setInnerTab('orders')} className={innerTabClass(innerTab === 'orders')}>
                  <PackagePlus size={13} /> أوامر الشراء
                </button>
              </div>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
              >
                <Banknote size={13} /> تسجيل دفعة
              </button>
            </div>

            {innerTab === 'ledger' && <SupplierLedgerTable entries={ledger} />}
            {innerTab === 'payments' && <SupplierPaymentsTable payments={details.payments || []} />}
            {innerTab === 'orders' && <SupplierOrdersTable orders={details.purchaseOrders || []} />}
          </div>
        )}
      </div>

      {paymentModalOpen && (
        <AddPaymentModal
          supplierId={supplierId}
          supplierName={details?.name}
          onClose={() => setPaymentModalOpen(false)}
          onSaved={handlePaymentSaved}
        />
      )}
    </div>
  )
}