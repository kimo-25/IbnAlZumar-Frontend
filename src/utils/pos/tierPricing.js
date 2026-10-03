// File: src/utils/pos/tierPricing.js
// Quantity-based tier pricing over a product's ProductPrices rows (instant client-side estimate).
// The server (PricingService) stays authoritative — see the confirmation pass in PosCheckoutPage.
import { PRICING_TIER } from "../../api/posApi";

// Escalation order for the "auto" mode: Retail -> Half-wholesale (FIRST_WHOLESALE) -> Wholesale.
// NOTE the enum values are NOT in escalation order (RETAIL=1, WHOLESALE=2, FIRST_WHOLESALE=3).
// Distributor is never chosen automatically.
export const AUTO_LADDER = [PRICING_TIER.RETAIL, PRICING_TIER.FIRST_WHOLESALE, PRICING_TIER.WHOLESALE];

export function normalizeTier(raw) {
  if (typeof raw === "number") {
    return Object.values(PRICING_TIER).includes(raw) ? raw : PRICING_TIER.RETAIL;
  }
  const s = String(raw ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (/^\d+$/.test(s)) return normalizeTier(Number(s));
  if (s.startsWith("first") || s.startsWith("half")) return PRICING_TIER.FIRST_WHOLESALE;
  if (s.startsWith("whole")) return PRICING_TIER.WHOLESALE;
  if (s.startsWith("dist")) return PRICING_TIER.DISTRIBUTOR;
  return PRICING_TIER.RETAIL;
}

// The /Pos/products payload carries "configured pricing tiers" per product; the exact property name
// is not visible from the frontend files, so several candidates are accepted.
const ROW_KEYS = ["pricingTiers", "tierPrices", "productPrices", "prices", "pricing", "ProductPrices", "PricingTiers"];

export function findPriceRows(product) {
  for (const key of ROW_KEYS) {
    const v = product?.[key];
    const list = Array.isArray(v) ? v : v?.$values;
    if (Array.isArray(list) && list.length) return list;
  }
  return [];
}

export function normalizePriceRows(product) {
  return findPriceRows(product)
    .map((r) => ({
      tier: normalizeTier(r.tier ?? r.pricingTier ?? r.Tier),
      minQuantity: Number(r.minQuantity ?? r.minQty ?? r.MinQuantity ?? 1) || 1,
      price: Number(r.price ?? r.unitPrice ?? r.sellingPrice ?? r.Price),
      variantId: r.productVariantId ?? r.variantId ?? r.ProductVariantId ?? null,
    }))
    .filter((r) => Number.isFinite(r.price) && r.price > 0);
}

// Prefer rows for the chosen variant; fall back to product-level rows (no variant).
function rowsFor(rows, variantId) {
  const own = variantId != null ? rows.filter((r) => r.variantId != null && String(r.variantId) === String(variantId)) : [];
  return own.length ? own : rows.filter((r) => r.variantId == null);
}

const best = (rows) => rows.reduce((a, r) => (!a || r.minQuantity > a.minQuantity ? r : a), null);

/**
 * @param rows      normalized rows
 * @param baseQty   quantity in BASE units (the cart's quantityInBaseUnit)
 * @param tierMode  "auto" | a PRICING_TIER value (manual override)
 * @param fallback  price to keep when no row applies
 * @returns {{ price:number, tier:number|null, nextBreak:{minQuantity:number,price:number,tier:number}|null }}
 */
export function resolveUnitPrice({ rows, baseQty, tierMode = "auto", fallback = 0, variantId = null }) {
  const pool = rowsFor(rows, variantId);
  const qty = Math.max(1, Number(baseQty) || 1);
  const ok = (r) => r.minQuantity <= qty;

  let pick;
  if (tierMode === "auto") {
    pick = best(pool.filter((r) => AUTO_LADDER.includes(r.tier) && ok(r)));
  } else {
    // Manual tier: that tier's best quantity break; if it has none yet, retail's.
    pick =
      best(pool.filter((r) => r.tier === tierMode && ok(r))) ??
      best(pool.filter((r) => r.tier === PRICING_TIER.RETAIL && ok(r)));
  }

  const nextBreak =
    tierMode === "auto"
      ? [...pool]
          .filter((r) => AUTO_LADDER.includes(r.tier) && r.minQuantity > qty)
          .sort((a, b) => a.minQuantity - b.minQuantity)[0] ?? null
      : null;

  return {
    price: pick ? pick.price : Number(fallback) || 0,
    tier: pick ? pick.tier : null,
    nextBreak: nextBreak && { minQuantity: nextBreak.minQuantity, price: nextBreak.price, tier: nextBreak.tier },
  };
}
