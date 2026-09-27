// File: src/components/pos/VariantUnitPickerModal.jsx
import { useMemo, useState } from 'react'
import { X, Check, Package } from 'lucide-react'
import { resolveClientUnitPrice, findBaseUnit } from '../../utils/pos/unitPricing'

/**
 * Props:
 *  - product: PosProductDto-shaped object (camelCase) — must include `units`, `variants`,
 *             `pricingTiers`.
 *  - tier: current PRICING_TIER.* selection from the POS screen.
 *  - onConfirm({ variant, unit, quantity, quantityInBaseUnit, unitPrice, lineTotal })
 *  - onClose()
 */
export default function VariantUnitPickerModal({ product, tier, onConfirm, onClose }) {
  const variants = product.variants || []
  const pricingTiers = product.pricingTiers || []
  const baseUnit = findBaseUnit(product.units)
  const sellableUnits =
    product.units && product.units.length > 0
      ? product.units
      : [{ id: 'base', fromUnit: baseUnit?.fromUnit || 'قطعة', toUnit: baseUnit?.toUnit || 'قطعة', factor: 1, isBaseUnit: true }]

  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null)
  const [selectedUnit, setSelectedUnit] = useState(sellableUnits.find((u) => u.isBaseUnit) || sellableUnits[0])
  const [quantity, setQuantity] = useState(1)

  const quantityInBaseUnit = quantity * (selectedUnit?.factor || 1)

  const unitPrice = useMemo(
    () =>
      resolveClientUnitPrice({
        product,
        variant: selectedVariant,
        tier,
        quantityInBaseUnit,
        pricingTiers,
      }),
    [product, selectedVariant, tier, quantityInBaseUnit, pricingTiers]
  )

  const lineTotal = unitPrice * quantityInBaseUnit

  function handleConfirm() {
    onConfirm({
      variant: selectedVariant,
      unit: selectedUnit,
      quantity,
      quantityInBaseUnit,
      unitPrice,
      lineTotal,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose} dir="rtl">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Package size={16} className="text-emerald-600" />
            {product.nameAr || product.name}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-canvas cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {variants.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold text-ink">اختر المتغيّر</p>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  className={`rounded-xl border p-2.5 text-right text-xs transition cursor-pointer ${
                    selectedVariant?.id === variant.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-border bg-canvas text-ink hover:border-emerald-300'
                  }`}
                >
                  <div className="font-bold">
                    {[variant.color, variant.size, variant.material, variant.finish].filter(Boolean).join(' / ') || variant.sku}
                  </div>
                  <div className="font-mono text-[10px] text-ink-soft">{variant.sku}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {sellableUnits.length > 1 && (
          <div>
            <p className="mb-2 text-xs font-bold text-ink">اختر وحدة البيع</p>
            <div className="grid grid-cols-3 gap-2">
              {sellableUnits.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnit(unit)}
                  className={`rounded-xl border p-2 text-xs font-bold transition cursor-pointer ${
                    selectedUnit?.id === unit.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-border bg-canvas text-ink hover:border-emerald-300'
                  }`}
                >
                  {unit.fromUnit}
                  {!unit.isBaseUnit && (
                    <span className="block text-[10px] font-normal text-ink-soft">
                      1 = {unit.factor} {unit.toUnit}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-canvas px-3 py-2.5">
          <span className="text-xs font-bold text-ink">الكمية</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-lg border border-border bg-surface text-ink-soft transition hover:text-ink cursor-pointer"
            >
              −
            </button>
            <span className="w-8 text-center font-mono font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="h-8 w-8 rounded-lg border border-border bg-surface text-ink-soft transition hover:text-ink cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-[11px] font-bold text-emerald-700">إجمالي السطر</p>
          <p className="font-mono text-xl font-black text-emerald-800">{lineTotal.toFixed(2)} ج.م</p>
          <p className="text-[10px] text-emerald-700/80">
            {unitPrice.toFixed(2)} ج.م × {quantityInBaseUnit} ({selectedUnit?.fromUnit})
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <Check size={16} />
          إضافة للسلة
        </button>
      </div>
    </div>
  )
}
