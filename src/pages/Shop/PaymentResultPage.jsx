import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function PaymentResultPage({ success }) {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id') || searchParams.get('merchant_order_id')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12" dir="rtl">
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        {success ? <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={64} /> : <XCircle className="mx-auto mb-4 text-rose-600" size={64} />}
        <h1 className="mb-3 text-2xl font-bold text-ink">{success ? 'تم الدفع بنجاح' : 'لم تكتمل عملية الدفع'}</h1>
        <p className="mb-6 text-sm leading-7 text-ink-soft">
          {success ? 'تم استلام دفعتك وسيتم تحديث حالة الطلب تلقائياً.' : 'يمكنك المحاولة مرة أخرى أو التواصل مع خدمة العملاء.'}
          {orderId && <span className="mt-2 block">رقم العملية: <strong>{orderId}</strong></span>}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/profile?tab=orders" className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white">متابعة الطلب</Link>
          <Link to="/" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-ink">العودة للمتجر</Link>
        </div>
      </div>
    </div>
  )
}
