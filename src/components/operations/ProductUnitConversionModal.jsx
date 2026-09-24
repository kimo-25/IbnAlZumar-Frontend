// File: src/components/admin/ProductUnitConversionModal.jsx
import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Ruler, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getProductUnitConversions, saveProductUnitConversions } from '../../api/inventoryApi'

let tempIdCounter = 0
function nextTempId() {
  tempIdCounter += 1
  return `tmp-${tempIdCounter}`
}

function emptyRow(overrides = {}) {
  return { tempId: nextTempId(), fromUnit: '', toUnit: '', factor: 1, isBaseUnit: false, ...overrides }
}

/**
 * Editor for a product's unit conversions (piece/box/carton). Works two ways:
 *  - If `productId` is given, it loads existing conversions from the (currently backend-pending —
 *    see the note in inventoryApi.js) endpoint and saves directly on "حفظ".
 *  - If `productId` is omitted (e.g. still inside a "create product" wizard), it just starts from
 *    `initialConversions` and hands the edited array back via `onSaved` for the parent form to hold
 *    in local state and submit together with the rest of the product payload.
 *
 * Props:
 *  - productId?: number
 *  - initialConversions?: { fromUnit, toUnit, factor, isBaseUnit }[]
 *  - baseUnitHint?: string  e.g. "قطعة" — pre-fills ToUnit on new rows
 *  - onClose(): void
 *  - onSaved(conversions): void — called after a successful save (or immediately, in local-only mode)
 */
export default function ProductUnitConversionModal({
  productId,
  initialConversions = [],
  baseUnitHint = 'قطعة',
  onClose,
  onSaved,
}) {
  const [rows, setRows] = useState(() =>
    initialConversions.length > 0
      ? initialConversions.map((c) => emptyRow(c))
      : [emptyRow({ fromUnit: baseUnitHint, toUnit: baseUnitHint, factor: 1, isBaseUnit: true })]
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    setLoading(true)
    getProductUnitConversions(productId).then((data) => {
      if (cancelled) return
      if (Array.isArray(data) && data.length > 0) {
        setRows(data.map((c) => emptyRow(c)))
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [productId])

  function updateRow(tempId, field, value) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r
        if (field === 'isBaseUnit' && value) {
          // Only one base-unit row is meaningful; a base unit always converts to itself at factor 1.
          return { ...r, isBaseUnit: true, factor: 1, toUnit: r.toUnit || r.fromUnit }
        }
        return { ...r, [field]: value }
      })
    )

    // Unchecking every other row's isBaseUnit when this one becomes the base unit.
    if (field === 'isBaseUnit' && value) {
      setRows((prev) => prev.map((r) => (r.tempId === tempId ? r : { ...r, isBaseUnit: false })))
    }
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow({ toUnit: baseUnitHint })])
  }

  function removeRow(tempId) {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId))
  }

  function validate() {
    if (rows.length === 0) return 'أضف وحدة واحدة على الأقل'
    if (rows.some((r) => !r.fromUnit.trim() || !r.toUnit.trim())) return 'الرجاء تعبئة اسم الوحدة (من / إلى) في كل صف'
    if (rows.some((r) => !r.factor || Number(r.factor) <= 0)) return 'معامل التحويل يجب أن يكون أكبر من صفر في كل صف'
    if (!rows.some((r) => r.isBaseUnit)) return 'حدد وحدة أساسية واحدة (IsBaseUnit) يُخزَّن بها المخزون'
    return null
  }

  async function handleSave() {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = rows.map(({ fromUnit, toUnit, factor, isBaseUnit }) => ({
      fromUnit: fromUnit.trim(),
      toUnit: toUnit.trim(),
      factor: Number(factor),
      isBaseUnit,
    }))

    if (!productId) {
      // Local-only mode — parent product form owns persistence.
      onSaved?.(payload)
      return
    }

    setSaving(true)
    try {
      await saveProductUnitConversions(productId, payload)
      onSaved?.(payload)
    } catch (err) {
      setError(err?.message || 'تعذر حفظ وحدات التحويل — تأكد من إضافة الـ Endpoint الخاص بها في الباك إند')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Ruler size={16} className="text-emerald-600" /> وحدات القياس والتحويل (قطعة / علبة / كرتونة)
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> جاري تحميل وحدات التحويل...
          </div>
        ) : (
          <>
            <p className="mb-3 text-[11px] leading-relaxed text-ink-soft">
              يُخزَّن المخزون دائماً بالوحدة الأساسية (مثلاً "قطعة"). حدد صفاً واحداً كوحدة أساسية
              (<span className="font-bold">IsBaseUnit</span>، معامله دائماً 1)، وأضف صفوفاً أخرى لكل
              وحدة بيع أكبر (مثلاً "كرتونة" = 12 قطعة).
            </p>

            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-ink-soft">
                <span className="col-span-3">من وحدة (FromUnit)</span>
                <span className="col-span-3">إلى وحدة أساسية (ToUnit)</span>
                <span className="col-span-2">المعامل (Factor)</span>
                <span className="col-span-2 text-center">وحدة أساسية؟</span>
                <span className="col-span-2"></span>
              </div>

              {rows.map((row) => (
                <div key={row.tempId} className="grid grid-cols-12 items-center gap-2 rounded-xl border border-border p-2">
                  <input
                    value={row.fromUnit}
                    onChange={(e) => updateRow(row.tempId, 'fromUnit', e.target.value)}
                    placeholder="مثال: كرتونة"
                    className="col-span-3 rounded-lg border border-border bg-surface px-2 py-2 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <input
                    value={row.toUnit}
                    onChange={(e) => updateRow(row.tempId, 'toUnit', e.target.value)}
                    placeholder="مثال: قطعة"
                    className="col-span-3 rounded-lg border border-border bg-surface px-2 py-2 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    disabled={row.isBaseUnit}
                    value={row.factor}
                    onChange={(e) => updateRow(row.tempId, 'factor', e.target.value)}
                    className="col-span-2 rounded-lg border border-border bg-surface px-2 py-2 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:bg-canvas disabled:opacity-70"
                  />
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={row.isBaseUnit}
                      onChange={(e) => updateRow(row.tempId, 'isBaseUnit', e.target.checked)}
                      className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(row.tempId)}
                      disabled={rows.length <= 1}
                      className="rounded-lg p-1.5 text-danger hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {row.fromUnit && row.toUnit && Number(row.factor) > 0 && !row.isBaseUnit && (
                    <p className="col-span-12 text-[10px] text-ink-soft">
                      1 {row.fromUnit} = {row.factor} {row.toUnit}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-[11px] font-bold text-ink-soft hover:bg-canvas"
            >
              <Plus size={13} /> إضافة وحدة أخرى
            </button>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-ink-soft hover:bg-canvas"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                حفظ وحدات التحويل
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}