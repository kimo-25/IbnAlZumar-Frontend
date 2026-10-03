// File: src/components/pos/BarcodeLabelPrinterModal.jsx
// مودال طباعة ملصقات باركود المنتجات: بحث/اختيار منتج → معاينة الباركود → عدد الملصقات → طباعة مباشرة.
import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Search, Barcode, Printer, Loader2, Package } from 'lucide-react'
import { searchPosProducts, PRICING_TIER } from '../../api/posApi'
import { normalizeScanTerm } from '../../utils/pos/scanInput'
import { buildBarcodeSvg } from '../../utils/print/renderMaintenanceReceipt'
import {
  printProductBarcodeLabels,
  normalizeBarcodeValue,
  clampCopies,
  MAX_LABEL_COPIES,
} from '../../utils/print/barcodePrinter'

const COPY_PRESETS = [1, 10, 20, 50, 100]

// الصنف الأساسي + كل variant له باركود/SKU خاص
function buildEntries(product) {
  if (!product) return []
  const baseName = product.nameAr || product.name || ''
  const entries = [
    {
      key: 'base',
      label: 'الصنف الأساسي',
      name: baseName,
      barcode: normalizeBarcodeValue(product.barcode || product.sku),
      rawBarcode: product.barcode || product.sku || '',
      price: product.sellingPrice,
    },
  ]
  ;(product.variants || []).forEach((v, i) => {
    const code = normalizeBarcodeValue(v.barcode || v.sku)
    if (!code) return
    const label = [v.color, v.size, v.material].filter(Boolean).join(' / ') || `نوع ${i + 1}`
    entries.push({
      key: `v-${v.id ?? i}`,
      label,
      name: `${baseName} (${label})`,
      barcode: code,
      rawBarcode: v.barcode || v.sku || '',
      price: v.sellingPrice ?? v.price ?? product.sellingPrice,
    })
  })
  return entries
}

export default function BarcodeLabelPrinterModal({ onClose, onPrinted }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [entryKey, setEntryKey] = useState('base')
  const [copies, setCopies] = useState('20')
  const [columns, setColumns] = useState(2)
  const [showPrice, setShowPrice] = useState(true)
  const [error, setError] = useState('')
  const reqRef = useRef(0)
  const searchRef = useRef(null)
  const copiesRef = useRef(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // بحث بالسيرفر (debounced). القائمة الفاضية = أول صفحة من المنتجات للاختيار منها.
  useEffect(() => {
    const id = ++reqRef.current
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchPosProducts({
          query: normalizeScanTerm(query),
          tier: PRICING_TIER.RETAIL,
          pageNumber: 1,
          pageSize: 12,
        })
        if (id !== reqRef.current) return
        setResults(data.items || [])
        setError('')
      } catch {
        if (id === reqRef.current) setError('تعذر تحميل المنتجات — تحقق من الاتصال')
      } finally {
        if (id === reqRef.current) setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const entries = useMemo(() => buildEntries(selected), [selected])
  const active = entries.find((e) => e.key === entryKey) || entries[0] || null
  const copiesNum = clampCopies(copies)
  const sanitizedChanged = active && active.rawBarcode && String(active.rawBarcode).trim() !== active.barcode
  const tooLong = active && active.barcode.length > 20

  function selectProduct(product) {
    const list = buildEntries(product)
    const first = list.find((e) => e.barcode) || list[0]
    setSelected(product)
    setEntryKey(first?.key || 'base')
    setError('')
    requestAnimationFrame(() => {
      copiesRef.current?.focus()
      copiesRef.current?.select()
    })
  }

  // Enter في البحث (سكانر أو كتابة): تطابق تام باركود/SKU أو نتيجة واحدة = اختيار مباشر
  async function handleSearchEnter(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const term = normalizeScanTerm(query).toLowerCase()
    if (!term) return
    const isExact = (p) =>
      String(p.sku ?? '').toLowerCase() === term || String(p.barcode ?? '').toLowerCase() === term
    let items = results
    try {
      const data = await searchPosProducts({ query: term, tier: PRICING_TIER.RETAIL, pageNumber: 1, pageSize: 12 })
      items = data.items || []
      setResults(items)
    } catch {
      /* نكمل بالنتائج الحالية */
    }
    const target = items.find(isExact) || (items.length === 1 ? items[0] : null)
    if (target) selectProduct(target)
    else setError('اختر المنتج المطلوب من القائمة')
  }

  function handlePrint() {
    if (!active?.barcode) {
      setError('هذا المنتج لا يملك باركود أو SKU للطباعة.')
      return
    }
    try {
      const res = printProductBarcodeLabels(
        { name: active.name, barcode: active.barcode, price: active.price },
        { copies: copiesNum, columns, showPrice }
      )
      onPrinted?.(`تم إرسال ${res.copies} ملصق باركود (${res.code}) للطابعة`)
      onClose()
    } catch (err) {
      setError(err?.message || 'تعذرت الطباعة')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-lg sm:max-h-[92vh]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Barcode size={16} className="text-emerald-600" />
            طباعة ملصقات باركود المنتجات
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-ink-soft transition hover:bg-canvas"
          >
            <X size={15} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {/* ===== اختيار المنتج ===== */}
          <div className="flex min-h-0 flex-col gap-2">
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchEnter}
                placeholder="ابحث بالاسم / SKU أو امسح الباركود..."
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-border bg-canvas p-2.5 pr-9 text-sm outline-none focus:border-emerald-500"
              />
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            </div>

            <div className="max-h-80 min-h-[10rem] overflow-y-auto rounded-xl border border-border divide-y divide-border">
              {loading && results.length === 0 ? (
                <div className="flex items-center justify-center gap-2 p-6 text-xs text-ink-soft">
                  <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-1 p-6 text-xs text-ink-soft">
                  <Package size={20} className="text-border" />
                  لا توجد منتجات مطابقة
                </div>
              ) : (
                results.map((p) => {
                  const isSel = selected?.id === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-right text-xs transition ${
                        isSel ? 'bg-emerald-50' : 'hover:bg-canvas'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-bold text-ink">{p.nameAr || p.name}</div>
                        <div className="truncate font-mono text-[10px] text-ink-soft" dir="ltr">
                          {p.barcode || p.sku || 'بدون باركود'}
                        </div>
                      </div>
                      {p.sellingPrice != null && (
                        <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-soft">
                          {Number(p.sellingPrice).toFixed(2)}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ===== المعاينة والطباعة ===== */}
          <div className="flex flex-col gap-3">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink-soft">
                <Barcode size={28} className="text-border" />
                اختر منتجًا لمعاينة الباركود وتحديد عدد الملصقات
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-canvas p-3">
                  <div className="text-xs font-bold text-ink">{active?.name}</div>

                  {entries.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entries.map((en) => (
                        <button
                          key={en.key}
                          type="button"
                          onClick={() => setEntryKey(en.key)}
                          className={`cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                            en.key === active?.key
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-border bg-surface text-ink-soft hover:border-emerald-300'
                          }`}
                        >
                          {en.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {active?.barcode ? (
                    <div className="mt-3 rounded-lg bg-white p-3 text-center">
                      <div
                        className="[&_svg]:mx-auto [&_svg]:h-16 [&_svg]:w-full [&_svg]:max-w-xs [&_svg]:fill-black"
                        dangerouslySetInnerHTML={{ __html: buildBarcodeSvg(active.barcode) }}
                      />
                      <div className="mt-1 font-mono text-sm font-bold tracking-wider text-black" dir="ltr">
                        {active.barcode}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">
                      هذا المنتج لا يملك باركود أو SKU — أضف باركود له أولًا
                    </div>
                  )}

                  {sanitizedChanged && (
                    <p className="mt-2 text-[10px] text-amber-700">
                      تم تحويل الباركود إلى أرقام/حروف إنجليزية قابلة للطباعة (الأصلي: {active.rawBarcode})
                    </p>
                  )}
                  {tooLong && (
                    <p className="mt-2 text-[10px] text-amber-700">
                      الباركود أطول من 20 حرفًا وسيُقصّ في الملصق — راجع الباركود قبل الطباعة.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-ink">عدد الملصقات</label>
                  <input
                    ref={copiesRef}
                    type="number"
                    min="1"
                    max={MAX_LABEL_COPIES}
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handlePrint()
                      }
                    }}
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 text-center font-mono text-lg font-bold outline-none focus:border-emerald-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COPY_PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCopies(String(n))}
                        className={`cursor-pointer rounded-lg border px-3 py-1 font-mono text-xs font-bold transition ${
                          copiesNum === n && String(copies) === String(n)
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-border bg-surface text-ink hover:border-emerald-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-ink-soft">الحد الأقصى {MAX_LABEL_COPIES} ملصق في الطلب الواحد.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5 font-bold text-ink">
                    <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
                    إظهار السعر
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-ink">الملصقات في الصف:</span>
                    {[2, 1].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColumns(c)}
                        className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                          columns === c
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-border bg-surface text-ink-soft hover:border-emerald-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{error}</div>}

            <button
              type="button"
              onClick={handlePrint}
              disabled={!selected || !active?.barcode}
              className="mt-auto flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Printer size={16} />
              تأكيد وطباعة {selected ? `${copiesNum} ملصق` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}