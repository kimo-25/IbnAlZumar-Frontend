// File: src/components/operations/RestockTab.jsx
import { useState } from 'react'
import { Loader2, AlertCircle, AlertTriangle, PackageX, ShieldCheck, RefreshCw, Plus, Check, X as XIcon } from 'lucide-react'
import { formatCurrency } from '../../utils/catalog'

export default function RestockTab({ products, loading, error, onRefresh, onQuickRestock, restockingId }) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  function startEdit(product) {
    setEditingId(product.id)
    setEditValue('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function confirmEdit(product) {
    const qty = parseInt(editValue, 10)
    if (!qty || qty <= 0) {
      alert('من فضلك أدخل كمية صحيحة أكبر من صفر.')
      return
    }
    await onQuickRestock(product.id, qty)
    setEditingId(null)
    setEditValue('')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-rose-600" />
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <AlertTriangle size={16} className="text-rose-600" />
          <span>
            إجمالي المنتجات الناقصة: <span className="font-mono font-bold text-rose-600">{products.length}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-3.5 py-2 text-[11px] font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
        >
          <RefreshCw size={13} />
          تحديث القائمة
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-12 text-center">
          <ShieldCheck size={40} className="mx-auto mb-3 text-emerald-500" />
          <p className="font-bold text-sm text-emerald-800">لا توجد أي منتجات ناقصة حالياً</p>
          <p className="mt-1 text-xs text-emerald-700/80">كل المخزون فوق الحد الأدنى المحدد.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                <tr>
                  <th className="p-4">الصنف / المعدة</th>
                  <th className="p-4">التصنيف</th>
                  <th className="p-4">الكمية الحالية</th>
                  <th className="p-4">الحد الأدنى</th>
                  <th className="p-4">سعر الوحدة</th>
                  <th className="p-4 text-center">إعادة التموين</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const stock = product.currentStock ?? product.stock ?? 0
                  const isOut = stock <= 0
                  const isEditing = editingId === product.id
                  const isBusy = restockingId === product.id

                  return (
                    <tr key={product.id} className="hover:bg-canvas/50 transition">
                      <td className="p-4 font-bold text-ink">
                        <div>{product.name || product.nameAr}</div>
                        <div className="font-mono text-[10px] text-ink-soft mt-0.5">SKU: {product.sku}</div>
                      </td>
                      <td className="p-4 text-ink-soft">{product.categoryName || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            isOut ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isOut ? <PackageX size={12} /> : <AlertTriangle size={12} />}
                          {stock}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-ink-soft">{product.minStockThreshold}</td>
                      <td className="p-4 font-mono font-bold text-ink">{formatCurrency(product.unitPrice || 0)}</td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="الكمية"
                              className="w-20 rounded-lg border border-border bg-canvas px-2 py-1.5 text-xs text-ink outline-none focus:border-emerald-600 transition"
                            />
                            <button
                              type="button"
                              onClick={() => confirmEdit(product)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-60"
                              title="تأكيد الإضافة"
                            >
                              {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-surface border border-border text-ink-soft hover:bg-canvas transition cursor-pointer"
                              title="إلغاء"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
                          >
                            <Plus size={13} />
                            تحديث الكمية
                          </button>
                        )}
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