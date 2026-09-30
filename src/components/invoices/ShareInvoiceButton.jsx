// File: src/components/invoices/ShareInvoiceButton.jsx
import { useEffect, useState } from 'react'
import { FileText, Send, Mail, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { generateOrderInvoice, generateMaintenanceInvoice, shareInvoice, getInvoiceDownloadUrl } from '../../api/invoicesApi'

/**
 * Props (exactly one of orderId / maintenanceRequestId):
 *  - orderId?: number
 *  - maintenanceRequestId?: number
 *  - printFormat?: string — defaults to 'a4' for orders, 'a5' for maintenance
 *  - autoGenerate?: boolean — generate the invoice as soon as this mounts (use right after a
 *    successful checkout / ticket completion, so "immediately after the sale" is satisfied
 *    without needing a backend hook into OrderService/MaintenanceWorkflowService)
 */
export default function ShareInvoiceButton({ orderId, maintenanceRequestId, printFormat, autoGenerate = true }) {
  const [invoice, setInvoice] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (autoGenerate) handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, maintenanceRequestId])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const data = orderId
        ? await generateOrderInvoice(orderId, printFormat || 'a4')
        : await generateMaintenanceInvoice(maintenanceRequestId, printFormat || 'a5')
      setInvoice(data)
    } catch (err) {
      setError(err?.message || 'تعذر إنشاء الفاتورة.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleShare(channel) {
    if (!invoice) return
    setSharing(true)
    setError(null)
    setResult(null)
    try {
      const data = await shareInvoice(invoice.id, {
        viaWhatsApp: channel === 'whatsapp',
        viaEmail: channel === 'email',
      })
      setResult(data)
      if (channel === 'whatsapp' && !data.whatsAppSent) setError(data.whatsAppError || 'تعذر الإرسال عبر واتساب.')
      if (channel === 'email' && !data.emailSent) setError(data.emailError || 'تعذر الإرسال عبر البريد.')
    } catch (err) {
      setError(err?.message || 'تعذر مشاركة الفاتورة.')
    } finally {
      setSharing(false)
    }
  }

  if (generating) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-canvas p-3 text-xs text-ink-soft">
        <Loader2 size={14} className="animate-spin" />
        جاري إنشاء الفاتورة...
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-2" dir="rtl">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-canvas py-2.5 text-xs font-bold text-ink transition hover:border-emerald-300 cursor-pointer"
        >
          <FileText size={14} className="text-emerald-600" />
          إنشاء الفاتورة
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-canvas p-3" dir="rtl">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-ink">فاتورة {invoice.invoiceNumber}</span>
        <span className="font-mono font-bold text-emerald-700">{invoice.totalAmount.toFixed(2)} ج.م</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2 text-[11px] font-semibold text-rose-700">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => handleShare('whatsapp')}
          disabled={sharing}
          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
        >
          {sharing ? <Loader2 size={12} className="animate-spin" /> : invoice.sentViaWhatsAppAt ? <CheckCircle2 size={12} /> : <Send size={12} />}
          واتساب
        </button>
        <button
          type="button"
          onClick={() => handleShare('email')}
          disabled={sharing}
          className="flex items-center justify-center gap-1 rounded-lg bg-sky-600 py-2 text-[11px] font-bold text-white transition hover:bg-sky-700 disabled:opacity-60 cursor-pointer"
        >
          {sharing ? <Loader2 size={12} className="animate-spin" /> : invoice.sentViaEmailAt ? <CheckCircle2 size={12} /> : <Mail size={12} />}
          إيميل
        </button>
        <a
          href={getInvoiceDownloadUrl(invoice.id)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1 rounded-lg border border-border bg-surface py-2 text-[11px] font-bold text-ink-soft transition hover:bg-canvas"
        >
          <Download size={12} />
          تحميل
        </a>
      </div>
    </div>
  )
}
