// File: src/components/profile/MyRequests.jsx
import { useState, useEffect } from 'react'
import { Wrench, Clock, CheckCircle2, AlertCircle, FileText, ExternalLink, Loader2 } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/catalog'

export default function MyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true)
        const res = await axiosInstance.get('/Maintenance/my-requests')
        const data = Array.isArray(res.data) ? res.data : (res.data?.$values || [])
        setRequests(data)
      } catch (err) {
        setError('تعذر تحميل طلبات الصيانة الخاصة بك.')
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center text-xs text-ink-soft">
        <Wrench size={36} className="mx-auto mb-2 text-border" />
        <p className="font-bold text-sm text-ink">لا توجد طلبات صيانة مسجلة باسمك حالياً</p>
        <p className="mt-1">عند طلب صيانة لأي معدة من الكتالوج ستظهر متابعة الحالة هنا.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      {requests.map((req) => {
        // تحديد الحالة بناءً على الـ Enum الرقمي الصحيح
        const statusVal = Number(req.status)
        const statusText = statusVal === 0 ? 'قيد المراجعة' : statusVal === 1 ? 'تم الرد والتسعير' : statusVal === 2 ? 'جاري الصيانة' : 'مكتمل'
        const badgeColor = statusVal === 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'

        return (
          <div key={req.id} className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Wrench size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">طلب صيانة #{req.id}</h4>
                  <p className="text-[11px] text-ink-soft">
                    {new Date(req.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${badgeColor}`}>
                <Clock size={12} />
                {statusText}
              </span>
            </div>

            <div className="text-xs text-ink space-y-1">
              <p className="font-semibold text-ink-soft">وصف المشكلة:</p>
              <p className="bg-canvas p-3 rounded-xl border border-border">{req.problemDescription}</p>
            </div>

            {req.estimatedPrice && (
              <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl text-xs">
                <span className="font-bold text-emerald-800">التكلفة التقديرية للصيانة:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(req.estimatedPrice)}</span>
              </div>
            )}

            {req.adminNotes && (
              <div className="text-xs space-y-1 bg-amber-50/40 border border-amber-200/60 p-3 rounded-xl">
                <p className="font-bold text-amber-900 flex items-center gap-1">
                  <FileText size={14} /> رد وملاحظات المهندس المختص:
                </p>
                <p className="text-ink-soft">{req.adminNotes}</p>
              </div>
            )}

            {req.maintenanceReportUrl && (
              <div className="pt-1">
                <a
                  href={req.maintenanceReportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                >
                  <ExternalLink size={14} /> معاينة تقرير الفحص والصورة المعالجة
                </a>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}