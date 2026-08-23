// File: src/components/operations/ShippingTab.jsx
import { useState } from 'react'
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Card from '../ui/Card'
import { formatCurrency } from '../../utils/catalog'

export default function ShippingTab({
  zones,
  loading,
  adding,
  newZone,
  setNewZone,
  onAddZone,
  onDeleteZone,
  pendingZoneRequests = [],
  onAcceptRequest,
  onRejectRequest,
}) {
  const [selectedRequestPrice, setSelectedRequestPrice] = useState({})

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. جدول طلبات المناطق الجديدة المنشأة من العملاء */}
      {pendingZoneRequests.length > 0 && (
        <Card title="طلبات المناطق الجديدة (من العملاء)">
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-right text-xs">
              <thead className="bg-amber-50 border-b border-amber-200 text-amber-900 font-semibold">
                <tr>
                  <th className="p-3">اسم العميل / الهاتف</th>
                  <th className="p-3">المنطقة المقترحة</th>
                  <th className="p-3">تحديد سعر الشحن (ج.م)</th>
                  <th className="p-3 text-center">إجراء الأدمن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingZoneRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-3">
                      <div className="font-bold text-ink">{req.customerName}</div>
                      <div className="text-[11px] text-ink-soft">{req.customerPhone}</div>
                    </td>
                    <td className="p-3 font-semibold text-amber-900">{req.customZoneName}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        placeholder="أدخل السعر"
                        value={selectedRequestPrice[req.id] || ''}
                        onChange={(e) =>
                          setSelectedRequestPrice({ ...selectedRequestPrice, [req.id]: e.target.value })
                        }
                        className="w-32 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-emerald-600 transition"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAcceptRequest && onAcceptRequest(req.id, selectedRequestPrice[req.id])}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                        >
                          <CheckCircle size={14} /> قبول وإضافة
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectRequest && onRejectRequest(req.id)}
                          className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                        >
                          <XCircle size={14} /> رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  )
}