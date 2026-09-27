// File: src/api/posApi.js
import axiosInstance from './axiosInstance'

export const PRICING_TIER = {
  RETAIL: 1,
  WHOLESALE: 2,
  FIRST_WHOLESALE: 3,
  DISTRIBUTOR: 4,
}

export const PRICING_TIER_LABELS = {
  [PRICING_TIER.RETAIL]: 'تجزئة',
  [PRICING_TIER.FIRST_WHOLESALE]: 'نص جملة',
  [PRICING_TIER.WHOLESALE]: 'جملة',
  [PRICING_TIER.DISTRIBUTOR]: 'موزع',
}

/**
 * POS Horizontal Grid View search — one round trip returns each product's units,
 * variants, configured pricing tiers, and on-hand quantity for the given warehouse.
 */
export async function searchPosProducts({ query = '', warehouseId = 1, tier = PRICING_TIER.RETAIL, pageNumber = 1, pageSize = 30 } = {}) {
  const response = await axiosInstance.get('/Pos/products', {
    params: { query, warehouseId, tier, pageNumber, pageSize },
  })
  return response.data
}

/**
 * Live unit-price preview for the running cart total. This is a convenience call for the
 * UI only — the server re-resolves the authoritative price again at order creation and
 * never trusts a client-supplied UnitPrice (see ARCHITECTURE.md §7.4).
 */
export async function getResolvedUnitPrice({ productId, productVariantId = null, tier = PRICING_TIER.RETAIL, quantity = 1 }) {
  const response = await axiosInstance.get(`/Pos/products/${productId}/unit-price`, {
    params: { productVariantId: productVariantId ?? undefined, tier, quantity },
  })
  return response.data
}

export async function getProductPricingTiers(productId, productVariantId = null) {
  const response = await axiosInstance.get(`/ProductPricing/${productId}`, {
    params: { productVariantId: productVariantId ?? undefined },
  })
  return response.data
}

export async function saveProductPricingTier(payload) {
  const response = await axiosInstance.post('/ProductPricing', payload)
  return response.data
}

export async function deleteProductPricingTier(priceId) {
  await axiosInstance.delete(`/ProductPricing/${priceId}`)
}
