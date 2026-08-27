// File: src/components/operations/MaintenanceResponseModal.jsx
import { useEffect, useState } from 'react'
import { X, Loader2, Save, AlertCircle, ImageOff, User, Mail, Phone, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { resolveMaintenanceImageUrls } from '../../utils/mediaUrl'
import { MAINTENANCE_STATUS_OPTIONS, getDeliveryMethodLabel } from '../../constants/maintenance'

// Converts an ISO/server date string to the yyyy-MM-dd shape <input type="date"> needs.
function toDateInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

// معرض صور + Lightbox لتكبير أي صورة من صور طلب الصيانة والتنقل بينها
function MaintenanceImageGallery({ imageUrls }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="w-24 h-24 rounded-xl bg-surface border border-border flex items-center justify-center text-ink-soft">
        <ImageOff size={20} />
      </div>
    )
  }

  const openAt = (idx) => setLightboxIndex(idx)
  const close = () => setLightboxIndex(null)
  const showPrev = (e) => {
    e.stopPropagation()
    setLightboxIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length)
  }
  const showNext = (e) => {
    e.stopPropagation()
    setLightboxIndex((i) => (i + 1) % imageUrls.length)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {imageUrls.map((url, idx) => (
          <button
            key={url + idx}
            type="button"
            onClick={() => openAt(idx)}
            className="group relative w-24 h-24 rounded-xl overflow-hidden border border-border hover:opacity-90 transition cursor-pointer"
          >
            <img src={url} alt={`صورة العطل ${idx + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
              <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition" />
            </div>
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
          >
            <X size={20} />
          </button>

          {imageUrls.length > 1 && (
            <span className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
              {lightboxIndex + 1} / {imageUrls.length}
            </span>
          )}

          {imageUrls.length > 1 && (
            <button
              type="button"
              onClick={showPrev}
              className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            >
              <ChevronRight size={22} />
            </button>
          )}

          <img
            src={imageUrls[lightboxIndex]}
            alt={`صورة العطل ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
          />

          {imageUrls.length > 1 && (
            <button
              type="button"
              onClick={showNext}
              className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            >
              <ChevronLeft size={22} />
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default function MaintenanceResponseModal({ request, onClose, onSave, saving, error }) {
  const [status, setStatus] = useState(1)
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [maintenanceReportUrl, setMaintenanceReportUrl] = useState('')

  useEffect(() => {
    if (request) {
      setStatus(Number(request.status) || 1)
      setEstimatedPrice(request.estimatedPrice ?? '')
      setScheduledDate(toDateInputValue(request.scheduledDate))
      setAdminNotes(request.adminNotes || '')
      setMaintenanceReportUrl(request.maintenanceReportUrl || '')
    }
  }, [request])

  if (!request) return null

  // مصفوفة موحّدة ومقاومة لاختلاف تسمية الحقل بين الـ endpoints (imageUrls أو
  // imageUrl القديم)، ويُعاد بناء كل رابط دائماً فوق الـ API Origin الحالي.
  const imageUrls = resolveMaintenanceImageUrls(request)

  function handleSubmit(e) {
    e.preventDefault()
    onSave(request.id, {
      status: Number(status),
      estimatedPrice: estimatedPrice === '' ? null : Number(estimatedPrice),
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      adminNotes: adminNotes || null,
      maintenanceReportUrl: maintenanceReportUrl || null
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} dir="rtl">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl border border-border relative"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface p-4 z-10">
          <h3 className="text-sm font-bold text-ink">مراجعة طلب الصيانة #{request.id}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition">
            <X size={16} />
          </button>
        </div>

        {/* Read-only customer + request summary */}
        <div className="p-4 space-y-3 border-b border-border bg-canvas/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-ink">
              <User size={13} className="text-ink-soft" />
              <span className="font-bold">{request.userName || request.customerName || 'عميل غير مسجل'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-soft dir-ltr justify-start">
              <Mail size={13} />
              <span>{request.userEmail || request.customerEmail || '-'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-soft">
              <Phone size={13} />
              <span className="font-mono">{request.userPhone || request.customerPhone || '-'}</span>
            </div>
            <div className="text-ink-soft">{getDeliveryMethodLabel(request.deliveryMethod)}</div>
          </div>

          <div className="text-xs bg-surface border border-border rounded-xl p-3 text-ink">
            {request.problemDescription}
          </div>

          <MaintenanceImageGallery imageUrls={imageUrls} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">حالة الطلب</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
            >
              {MAINTENANCE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">التكلفة التقديرية (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">الموعد المجدول</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">ملاحظات المهندس / الفني</label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
              placeholder="اكتب رد المهندس المختص هنا..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">رابط تقرير الفحص (اختياري)</label>
            <input
              type="url"
              value={maintenanceReportUrl}
              onChange={(e) => setMaintenanceReportUrl(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition dir-ltr text-right"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              حفظ وإشعار العميل
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}