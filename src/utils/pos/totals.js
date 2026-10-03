// File: src/utils/pos/totals.js
// Cart totals with per-line discounts + order-level discount + selectable VAT.
// Money is rounded to 2 decimals at each step (what the receipt prints).

export const DEFAULT_VAT_RATE = 0.14;

// Quick VAT choices shown on the cashier screen.
export const VAT_OPTIONS = [
  { rate: 0.14, label: "14%", title: "القيمة المضافة القياسية" },
  { rate: 0.15, label: "15%", title: "نسبة مخصصة" },
  { rate: 0, label: "معفى 0%", title: "بدون ضريبة" },
];

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clampPct = (v) => Math.min(100, Math.max(0, Number(v) || 0));

/**
 * Order of operations (so percentages never double-count):
 *   gross            = Σ unitPrice × baseQty                       (what the server calls SubTotal)
 *   lineDiscounts    = Σ gross_i × line%_i
 *   orderDiscount    = fixed amount, or % of (gross − lineDiscounts), capped at that base
 *   discountTotal    = lineDiscounts + orderDiscount               (sent as ONE discount to the API)
 *   tax              = (gross − discountTotal) × vatRate
 */
export function computeTotals({ cart, discountType, discountValue, vatRate = DEFAULT_VAT_RATE }) {
  const gross = round2(cart.reduce((s, l) => s + (l.unitPrice || 0) * (l.quantityInBaseUnit || 0), 0));
  const lineDiscountTotal = round2(
    cart.reduce(
      (s, l) => s + ((l.unitPrice || 0) * (l.quantityInBaseUnit || 0) * clampPct(l.lineDiscountPct)) / 100,
      0
    )
  );
  const afterLines = round2(gross - lineDiscountTotal);
  const value = Math.max(Number(discountValue) || 0, 0);
  const orderDiscount = round2(
    Math.min(discountType === "Percentage" ? (afterLines * Math.min(value, 100)) / 100 : value, afterLines)
  );
  const discountTotal = round2(lineDiscountTotal + orderDiscount);
  const discountedSubtotal = round2(Math.max(gross - discountTotal, 0));
  const tax = round2(discountedSubtotal * vatRate);
  return {
    gross,
    lineDiscountTotal,
    orderDiscount,
    discountTotal,
    // % of the post-line-discount base — what the "النسبة" input mirrors when the type is Fixed
    orderDiscountPct: afterLines > 0 ? (orderDiscount / afterLines) * 100 : 0,
    discountedSubtotal,
    tax,
    total: round2(discountedSubtotal + tax),
  };
}
