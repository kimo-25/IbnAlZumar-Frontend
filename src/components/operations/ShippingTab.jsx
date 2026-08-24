// File: src/components/operations/ShippingTab.jsx
import { useState } from 'react'
import { Loader2, Plus, Trash2, CheckCircle, XCircle, X, MapPinCheck, AlertCircle } from 'lucide-react'
import Card from '../ui/Card'
import { formatCurrency } from '../../utils/catalog'

// نافذة اعتماد طلب منطقة شحن جديدة: تجمع كل البيانات المطلوبة لإنشاء
// منطقة شحن كاملة في النظام (اسم، محافظة، تكلفة، رسوم، مدة توصيل)
// بدل اعتماد سعر واحد فقط بدون سياق.
function AcceptZoneRequestModal({ request, saving, onClose, onConfirm }) {
  const [form, setForm] = useState({
    name: request.customZoneName || '',
    governorate: '',
    shippingCost: '',
    shippingFee: '',
    estimatedDays: '2'
  })
  const [formError, setFormError] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.name.trim() || !form.governorate.trim() || form.shippingCost === '' || form.shippingFee === '') {
      setFormError('برجاء تعبئة اسم المنطقة، والمحافظة، وتكلفة الشحن، ورسوم الشحن.')
      return
    }

    const shippingCost = Number(form.shippingCost)
    const shippingFee = Number(form.shippingFee)
    const estimatedDays = form.estimatedDays === '' ? null : Number(form.estimatedDays)

    if (Number.isNaN(shippingCost) || shippingCost < 0) {
      setFormError('تكلفة الشحن يجب أن تكون رقماً صحيحاً أكبر من أو يساوي صفر.')
      return
    }
    if (Number.isNaN(shippingFee) || shippingFee < 0) {
      setFormError('رسوم الشحن يجب أن تكون رقماً صحيحاً أكبر من أو يساوي صفر.')
      return
    }
    if (estimatedDays != null && (Number.isNaN(estimatedDays) || estimatedDays < 1)) {
      setFormError('عدد الأيام المتوقعة يجب أن يكون رقماً صحيحاً أكبر من صفر.')
      return
    }

    setFormError('')

    try {
      await onConfirm(Number(request.orderId), {
        name: form.name.trim(),
        governorate: form.governorate.trim(),
        shippingCost,
        shippingFee,
        estimatedDays
      })
    } catch (err) {
      setFormError(err?.message || 'حدث خطأ أثناء اعتماد المنطقة، برجاء المحاولة مرة أخرى.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} dir="rtl">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl border border-border"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface p-4 z-10">
          <div className="flex items-center gap-2">
            <MapPinCheck size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-ink">اعتماد منطقة شحن جديدة</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 pb-2 text-xs text-ink-soft">
          طلب من العميل: <span className="font-bold text-ink">{request.customerName}</span>
          {request.customerPhone && <span className="font-mono"> — {request.customerPhone}</span>}
        </div>

        <form onSubmit={handleSubmit} className="p-4 pt-2 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">اسم المنطقة</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
              placeholder="مثال: العجمي"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">المحافظة</label>
            <input
              type="text"
              value={form.governorate}
              onChange={(e) => updateField('governorate', e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
              placeholder="مثال: الإسكندرية"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">تكلفة الشحن الفعلية (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.shippingCost}
                onChange={(e) => updateField('shippingCost', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">رسوم الشحن للعميل (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.shippingFee}
                onChange={(e) => updateField('shippingFee', e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">عدد الأيام المتوقعة للتوصيل</label>
            <input
              type="number"
              min="1"
              value={form.estimatedDays}
              onChange={(e) => updateField('estimatedDays', e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
              placeholder="2"
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
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              اعتماد المنطقة
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// نافذة رفض طلب منطقة شحن، مع سبب اختياري يوضّح للعميل لماذا تم الرفض.
function RejectZoneRequestModal({ request, saving, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    try {
      await onConfirm(Number(request.orderId), reason.trim() || null)
    } catch (err) {
      setFormError(err?.message || 'حدث خطأ أثناء رفض الطلب، برجاء المحاولة مرة أخرى.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} dir="rtl">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface shadow-xl border border-border"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-rose-600" />
            <h3 className="text-sm font-bold text-ink">رفض طلب المنطقة</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 pb-2 text-xs text-ink-soft">
          سيتم رفض طلب المنطقة <span className="font-bold text-ink">"{request.customZoneName}"</span> من العميل{' '}
          <span className="font-bold text-ink">{request.customerName}</span>.
        </div>

        <form onSubmit={handleSubmit} className="p-4 pt-2 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">سبب الرفض (اختياري)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-canvas p-2.5 text-sm text-ink outline-none focus:border-emerald-600 transition"
              placeholder="مثال: المنطقة خارج نطاق التغطية الحالي..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas transition"
            >
              تراجع
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              تأكيد الرفض
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ShippingTab({
  zones,
  loading,
  adding,
  newZone,
  setNewZone,
  onAddZone,
  onDeleteZone,
  pendingZoneRequests = [],
  loadingZoneRequests = false,
  processingZoneRequestId = null,
  onAcceptRequest,
  onRejectRequest,
}) {
  const [acceptModalRequest, setAcceptModalRequest] = useState(null)
  const [rejectModalRequest, setRejectModalRequest] = useState(null)

  async function handleConfirmAccept(requestId, zoneData) {
    await onAcceptRequest(requestId, zoneData)
    setAcceptModalRequest(null)
  }

  async function handleConfirmReject(requestId, reason) {
    await onRejectRequest(requestId, reason)
    setRejectModalRequest(null)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. جدول طلبات المناطق الجديدة المنشأة من العملاء */}
      {(loadingZoneRequests || pendingZoneRequests.length > 0) && (
        <Card title="طلبات المناطق الجديدة (من العملاء)">
          {loadingZoneRequests ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-right text-xs">
                <thead className="bg-amber-50 border-b border-amber-200 text-amber-900 font-semibold">
                  <tr>
                    <th className="p-3">اسم العميل / الهاتف</th>
                    <th className="p-3">المنطقة المقترحة</th>
                    <th className="p-3 text-center">إجراء الأدمن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingZoneRequests.map((req) => {
                    const isBusy = processingZoneRequestId === req.orderId
                    return (
                      <tr key={req.orderId} className="hover:bg-amber-50/30 transition">
                        <td className="p-3">
                          <div className="font-bold text-ink">{req.customerName}</div>
                          <div className="text-[11px] text-ink-soft">{req.customerPhone}</div>
                        </td>
                        <td className="p-3 font-semibold text-amber-900">{req.customZoneName}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setAcceptModalRequest(req)}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
                            >
                              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              قبول الطلب
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setRejectModalRequest(req)}
                              className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer disabled:opacity-60"
                            >
                              <XCircle size={14} /> رفض الطلب
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 2. إضافة منطقة شحن جديدة من الأدمن */}
      <Card title="إضافة منطقة شحن جديدة">
        <form onSubmit={onAddZone} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">اسم المحافظة / المنطقة</label>
            <input
              type="text"
              required
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              placeholder="مثال: الإسكندرية"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">تكلفة الشحن (ج.م)</label>
            <input
              type="number"
              required
              min="0"
              value={newZone.price}
              onChange={(e) => setNewZone({ ...newZone, price: e.target.value })}
              placeholder="50"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">مدة التوصيل المتوقعة (أيام)</label>
            <input
              type="number"
              min="1"
              value={newZone.estimatedDays}
              onChange={(e) => setNewZone({ ...newZone, estimatedDays: e.target.value })}
              placeholder="2"
              className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            <span>إضافة المنطقة</span>
          </button>
        </form>
      </Card>

      {/* 3. قائمة المناطق المعتمدة */}
      <Card title="قائمة مناطق الشحن المعتمدة في النظام">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-right text-xs">
              <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                <tr>
                  <th className="p-3">المنطقة / المحافظة</th>
                  <th className="p-3">تكلفة الشحن</th>
                  <th className="p-3">مدة التوصيل التقريبية</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-ink-soft">
                      لا توجد مناطق شحن مضافة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id} className="hover:bg-canvas/50 transition">
                      <td className="p-3 font-bold text-ink">{zone.name || zone.governorate}</td>
                      <td className="p-3 font-mono font-semibold text-emerald-700">
                        {formatCurrency(zone.shippingCost ?? zone.shippingFee ?? zone.price ?? 0)}
                      </td>
                      <td className="p-3">{zone.estimatedDays ? `${zone.estimatedDays} أيام` : 'غير محدد'}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteZone(zone.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="حذف المنطقة"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {acceptModalRequest && (
        <AcceptZoneRequestModal
          request={acceptModalRequest}
          saving={processingZoneRequestId === acceptModalRequest.orderId}
          onClose={() => setAcceptModalRequest(null)}
          onConfirm={handleConfirmAccept}
        />
      )}

      {rejectModalRequest && (
        <RejectZoneRequestModal
          request={rejectModalRequest}
          saving={processingZoneRequestId === rejectModalRequest.orderId}
          onClose={() => setRejectModalRequest(null)}
          onConfirm={handleConfirmReject}
        />
      )}
    </div>
  )
}