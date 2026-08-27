// File: src/components/operations/MaintenanceInquiriesTab.jsx
import { useMemo, useState } from 'react'
import { Loader2, AlertCircle, Wrench, ImageOff, ClipboardEdit } from 'lucide-react'
import { formatCurrency } from '../../utils/catalog'
import { handleImageError } from '../../utils/imageHelper'
import { resolveMaintenanceImageUrls } from '../../utils/mediaUrl'
import { getMaintenanceStatusMeta, getDeliveryMethodLabel } from '../../constants/maintenance'

// عدد الصور المصغّرة الظاهرة في صف الجدول قبل تجميع الباقي في شارة "+N"
const MAX_VISIBLE_THUMBS = 3

function MaintenanceImageGallery({ imageUrls, onReview }) {
  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="w-12 h-12 rounded-lg bg-canvas border border-border flex items-center justify-center text-ink-soft">
        <ImageOff size={16} />
      </div>
    )
  }

  const visible = imageUrls.slice(0, MAX_VISIBLE_THUMBS)
  const extraCount = imageUrls.length - visible.length

  return (
    <div className="flex items-center -space-x-3 rtl:space-x-reverse">
      {visible.map((url, idx) => {
        const isLastVisible = idx === visible.length - 1
        return (
          <button
            key={url + idx}
            type="button"
            onClick={() => onReview()}
            title={extraCount > 0 && isLastVisible ? `+${extraCount} صور إضافية` : 'عرض الصور'}
            className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-surface shadow-xs hover:z-10 hover:scale-105 transition cursor-pointer bg-canvas shrink-0"
          >
            <img
              src={url}
              alt="صورة العطل"
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
            {extraCount > 0 && isLastVisible && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-[11px] font-bold">
                +{extraCount}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function MaintenanceInquiriesTab({ requests, loading, error, onReview }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter((r) => Number(r.status) === Number(statusFilter))
  }, [requests, statusFilter])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
        <AlertCircle size={18} className="shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <Wrench size={16} className="text-emerald-600" />
          <span>
            إجمالي طلبات الصيانة: <span className="font-mono font-bold text-emerald-600">{requests.length}</span>
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-canvas px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-emerald-600 transition"
        >
          <option value="all">كل الحالات</option>
          <option value="1">قيد المراجعة</option>
          <option value="2">تم التسعير</option>
          <option value="3">تمت الموافقة</option>
          <option value="4">مرفوض</option>
          <option value="5">تم الانتهاء</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-xs text-ink-soft">
          <Wrench size={36} className="mx-auto mb-2 text-border" />
          <p className="font-bold text-sm text-ink">لا توجد طلبات صيانة مطابقة</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                <tr>
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">الإيميل</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">وصف المشكلة</th>
                  <th className="p-3">طريقة التسليم</th>
                  <th className="p-3">الصور</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3">الموعد</th>
                  <th className="p-3">ملاحظات الفني</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const meta = getMaintenanceStatusMeta(item.status)
                  const StatusIcon = meta.icon
                  // مصفوفة موحّدة عبر resolveMaintenanceImageUrls: تقرأ imageUrls
                  // (أو imageUrl كـ fallback للطلبات القديمة) وتعيد بناء كل رابط
                  // دائماً فوق الـ API Origin الحالي، حتى لو كانت القيم المخزّنة
                  // روابط مطلقة قديمة بـ Host مختلف.
                  const displayImgUrls = resolveMaintenanceImageUrls(item)

                  return (
                    <tr key={item.id} className="hover:bg-canvas/50 transition align-top">
                      <td className="p-3 font-bold text-ink whitespace-nowrap">
                        {item.userName || item.customerName || item.fullName || 'عميل غير مسجل'}
                      </td>
                      <td className="p-3 text-ink-soft dir-ltr text-right">
                        {item.userEmail || item.customerEmail || item.email || '-'}
                      </td>
                      <td className="p-3 font-mono text-ink-soft whitespace-nowrap">
                        {item.userPhone || item.customerPhone || item.phone || '-'}
                      </td>
                      <td className="p-3 font-semibold text-ink max-w-[220px]">
                        {item.problemDescription || item.description || item.notes}
                      </td>
                      <td className="p-3 text-ink-soft whitespace-nowrap">
                        {getDeliveryMethodLabel(item.deliveryMethod)}
                      </td>
                      <td className="p-3">
                        <MaintenanceImageGallery imageUrls={displayImgUrls} onReview={() => onReview(item)} />
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border whitespace-nowrap ${meta.className}`}>
                          <StatusIcon size={12} /> {meta.label}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-ink whitespace-nowrap">
                        {item.estimatedPrice != null ? formatCurrency(item.estimatedPrice) : '-'}
                      </td>
                      <td className="p-3 text-ink-soft whitespace-nowrap">
                        {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('ar-EG') : '-'}
                      </td>
                      <td className="p-3 text-ink-soft max-w-[200px] truncate" title={item.adminNotes || ''}>
                        {item.adminNotes || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onReview(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer whitespace-nowrap"
                        >
                          <ClipboardEdit size={13} />
                          مراجعة الطلب
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}