// File: src/utils/pos/unitPricing.js
//
// Client-side mirror of PricingService.ResolveUnitPriceAsync (backend). Used ONLY to show the
// cashier a live running total and cash-change calculator before the order exists. It must
// NEVER be trusted as the final price — the server re-resolves it again, authoritatively, at
// order creation (ARCHITECTURE.md §7.4, same rule as the existing ESTIMATED_TAX_RATE in
// PosCheckoutPage.jsx).

/**
 * @param {object} params
 * @param {object} params.product - PosProductDto-shaped object (camelCase from the API).
 * @param {object|null} params.variant - the selected PosVariantDto, or null.
 * @param {number} params.tier - PRICING_TIER.* value.
 * @param {number} params.quantityInBaseUnit - quantity already converted to the product's base unit.
 * @param {Array} params.pricingTiers - product.pricingTiers (ProductPriceDto[]).
 */
export function resolveClientUnitPrice({ product, variant, tier, quantityInBaseUnit, pricingTiers }) {
  const variantId = variant?.id ?? null

  const candidates = (pricingTiers || [])
    .filter(
      (p) =>
        p.isActive &&
        p.tier === tier &&
        (p.productVariantId === variantId || p.productVariantId === null) &&
        p.minQuantity <= quantityInBaseUnit
    )
    .sort((a, b) => {
      const variantPreference = (b.productVariantId ? 1 : 0) - (a.productVariantId ? 1 : 0)
      if (variantPreference !== 0) return variantPreference
      return b.minQuantity - a.minQuantity
    })

  if (candidates.length > 0) return candidates[0].price
  return variant?.price ?? product?.sellingPrice ?? 0
}

export function findBaseUnit(units) {
  return (units || []).find((u) => u.isBaseUnit) || null
}

/** Converts a quantity expressed in `unit` into the product's base unit. */
export function convertQuantityToBaseUnit(quantity, unit) {
  if (!unit || unit.isBaseUnit) return quantity
  return quantity * unit.factor
}
