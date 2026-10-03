// File: src/components/pos/PosItemPanel.jsx
// Side drawer for ONE item: bigger image, quick quantity, per-line discount %, unit / colour / size,
// stock, and (privileged roles only) cost & margin. Non-modal: the scan box keeps keyboard focus.
import { X, Plus, Minus, Trash2, ImageOff, ZoomIn, Layers, Package, Percent, TrendingUp } from "lucide-react";
import { getOnHand } from "./PosProductTable";
import { PRICING_TIER, PRICING_TIER_LABELS } from "../../api/posApi";

const QUICK_ADD = [1, 5, 10];
const QUICK_DISCOUNT = [0, 5, 10, 15, 20];
const COST_KEYS = ["costPrice", "purchasePrice", "averageCost", "unitCost", "buyPrice"];

function getCost(product) {
  for (const k of COST_KEYS) {
    const v = product?.[k];
    if (v !== undefined && v !== null && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

const money = (n) => `${Number(n || 0).toFixed(2)} ج.م`;

function Section({ icon, title, children }) {
  return (
    <section className="space-y-2 border-t border-border px-4 py-3">
      <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-soft">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

/**
 * mode "line"    → `line` is a cart line (edit quantity / discount / unit)
 * mode "product" → `line` is null; the item is still in the list (quick add to the cart)
 */
export default function PosItemPanel({
  mode,
  line,
  product,
  canSeeCost,
  onClose,
  onQuickAdd,
  onSetQty,
  onSetDiscount,
  onPickOptions,
  onRemove,
  onOpenImage,
  onReturnFocus,
}) {
  const item = line || product;
  if (!item) return null;

  const name = item.nameAr || item.name;
  const image = (product || item).imageUrl;
  const hasOptions = !!product && (product.variants?.length > 0 || product.units?.length > 1);
  const onHand = getOnHand(product);
  const tracked = product && product.trackInventory !== false && onHand !== null;
  const cost = canSeeCost ? getCost(product) : null;

  const unitPrice = line ? line.unitPrice : Number(product?.sellingPrice ?? 0);
  const pct = line ? Number(line.lineDiscountPct) || 0 : 0;
  const netUnit = unitPrice * (1 - pct / 100);
  const baseQty = line ? line.quantityInBaseUnit : 1;
  const lineTotal = netUnit * baseQty;
  const lowStock = tracked && line && baseQty > onHand;
  const variantText = line?.variant
    ? [line.variant.color, line.variant.size, line.variant.material].filter(Boolean).join(" / ")
    : "";

  const commitOnEnter = (apply) => (e) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      if (e.key === "Enter") apply(e.currentTarget.value);
      e.currentTarget.blur();
      onReturnFocus?.();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside
        data-panel={mode}
        dir="rtl"
        aria-label="تفاصيل الصنف"
        // clicking inside must not pull focus away from the scan box (inputs excepted)
        onMouseDown={(e) => {
          if (!e.target.closest("input,select,textarea")) e.preventDefault();
        }}
        className="fixed inset-x-0 bottom-0 z-[71] flex h-[min(86dvh,720px)] max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-surface shadow-2xl sm:inset-x-auto sm:bottom-10 sm:right-0 sm:top-[68px] sm:h-auto sm:w-[348px] sm:max-w-[94vw] sm:rounded-l-2xl sm:rounded-t-none sm:border-b sm:border-r-0"
      >
      {/* header */}
      <div className="flex items-start justify-between gap-2 bg-gradient-to-l from-emerald-700 to-emerald-600 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-emerald-100">{mode === "line" ? "صنف في السلة" : "صنف من القائمة"}</p>
          <h3 className="truncate text-sm font-black" title={name}>{name}</h3>
          <p className="truncate font-mono text-[10px] text-emerald-100">
            {item.sku || product?.sku || "—"}
            {variantText ? ` · ${variantText}` : ""}
          </p>
        </div>
        <button type="button" tabIndex={-1} onClick={onClose} aria-label="إغلاق" className="rounded-lg p-1 hover:bg-white/15 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* image */}
        <div className="relative mx-4 mt-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-emerald-50">
          {image ? (
            <>
              <img src={image} alt={name} className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <button type="button" tabIndex={-1} onClick={onOpenImage} aria-label="تكبير الصورة" className="absolute left-2 top-2 rounded-full bg-black/45 p-1.5 text-white hover:bg-black/65 cursor-pointer">
                <ZoomIn size={14} />
              </button>
            </>
          ) : (
            <ImageOff size={30} className="text-emerald-300" />
          )}
        </div>

        {/* price */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-canvas p-2">
            <p className="text-[10px] text-ink-soft">سعر الوحدة{line?.unit?.fromUnit ? ` / ${line.unit.fromUnit}` : ""}</p>
            <p className="font-mono text-base font-black text-ink" data-field="unit-price">{money(netUnit)}</p>
            {line?.priceTier && line.priceTier !== PRICING_TIER.RETAIL && (
              <span className="rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-700">{PRICING_TIER_LABELS[line.priceTier]}</span>
            )}
            {pct > 0 && <span className="ms-1 rounded bg-rose-100 px-1 text-[9px] font-bold text-rose-700">−{pct}%</span>}
          </div>
          <div className="rounded-xl bg-emerald-50 p-2">
            <p className="text-[10px] text-emerald-800">{mode === "line" ? "إجمالي السطر" : "السعر"}</p>
            <p className="font-mono text-base font-black text-emerald-700" data-field="line-total">{money(mode === "line" ? lineTotal : unitPrice)}</p>
          </div>
        </div>

        {/* quantity */}
        <Section icon={<Plus size={12} />} title={mode === "line" ? "الكمية" : "إضافة للسلة"}>
          {mode === "line" && (
            <div className="flex items-center justify-center gap-2">
              <button type="button" tabIndex={-1} aria-label="إنقاص" onClick={() => onQuickAdd(-1)} className="grid size-9 place-items-center rounded-lg border border-border bg-canvas hover:bg-rose-50 cursor-pointer"><Minus size={14} /></button>
              <input
                key={line.quantity}
                defaultValue={line.quantity}
                inputMode="decimal"
                aria-label="الكمية"
                onFocus={(e) => e.target.select()}
                onBlur={(e) => { const v = Number(e.target.value); if (v > 0 && v !== line.quantity) onSetQty(v); else e.target.value = line.quantity; }}
                onKeyDown={commitOnEnter((v) => { const n = Number(v); if (n > 0) onSetQty(n); })}
                className="h-9 w-20 rounded-lg border border-border bg-canvas text-center font-mono text-lg font-black outline-none focus:border-emerald-500"
              />
              <button type="button" tabIndex={-1} aria-label="زيادة" onClick={() => onQuickAdd(1)} className="grid size-9 place-items-center rounded-lg border border-border bg-canvas hover:bg-emerald-50 cursor-pointer"><Plus size={14} /></button>
            </div>
          )}
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_ADD.map((n) => (
              <button key={n} type="button" tabIndex={-1} aria-label={`إضافة ${n}`} onClick={() => onQuickAdd(n)} className="rounded-lg border border-emerald-200 bg-emerald-50 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 cursor-pointer">
                +{n}
              </button>
            ))}
          </div>
        </Section>

        {/* unit / colour / size */}
        {hasOptions && (
          <Section icon={<Layers size={12} />} title="الوحدة / اللون / المقاس">
            {line && (
              <p className="text-xs text-ink">
                {line.unit?.fromUnit || "قطعة"}{variantText ? ` — ${variantText}` : ""}
              </p>
            )}
            <button type="button" tabIndex={-1} onClick={onPickOptions} className="w-full rounded-lg border border-amber/40 bg-amber/10 py-1.5 text-xs font-bold text-amber-dark hover:bg-amber/20 cursor-pointer">
              {mode === "line" ? "تغيير الوحدة / اللون / المقاس" : "اختيار الوحدة / اللون / المقاس"}
            </button>
          </Section>
        )}

        {/* line discount */}
        {mode === "line" && (
          <Section icon={<Percent size={12} />} title="خصم على هذا الصنف">
            <div className="flex items-center gap-1.5">
              {QUICK_DISCOUNT.map((d) => (
                <button key={d} type="button" tabIndex={-1} aria-label={`خصم ${d}%`} aria-pressed={pct === d} onClick={() => onSetDiscount(d)}
                  className={`flex-1 rounded-lg border py-1.5 text-[11px] font-black cursor-pointer ${pct === d ? "border-rose-500 bg-rose-500 text-white" : "border-border bg-canvas text-ink hover:border-rose-300"}`}>
                  {d === 0 ? "بدون" : `${d}%`}
                </button>
              ))}
              <input
                key={pct}
                defaultValue={pct || ""}
                placeholder="%"
                inputMode="decimal"
                aria-label="نسبة الخصم"
                onFocus={(e) => e.target.select()}
                onBlur={(e) => { const v = Math.min(100, Math.max(0, Number(e.target.value) || 0)); if (v !== pct) onSetDiscount(v); }}
                onKeyDown={commitOnEnter((v) => onSetDiscount(Math.min(100, Math.max(0, Number(v) || 0))))}
                className="h-8 w-12 rounded-lg border border-border bg-canvas text-center font-mono text-xs outline-none focus:border-rose-400"
              />
            </div>
            {pct > 0 && <p className="text-[10px] text-rose-600">خصم {money(unitPrice * baseQty - lineTotal)} على هذا السطر</p>}
          </Section>
        )}

        {/* stock */}
        {product && (
          <Section icon={<Package size={12} />} title="المخزون">
            {tracked ? (
              <p className={`text-xs font-bold ${onHand <= 0 ? "text-rose-600" : "text-ink"}`} data-field="stock">
                المتاح: <span className="font-mono">{onHand}</span>
                {lowStock && <span className="ms-2 rounded bg-amber-100 px-1.5 text-[10px] text-amber-700">الكمية أكبر من المتاح</span>}
              </p>
            ) : (
              <p className="text-xs text-ink-soft">غير متتبّع / غير متاح</p>
            )}
          </Section>
        )}

        {/* cost & margin: privileged roles only */}
        {canSeeCost && cost !== null && (
          <Section icon={<TrendingUp size={12} />} title="سعر الشراء والربحية">
            <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]" data-field="margin">
              <div className="rounded-lg bg-canvas p-1.5"><p className="text-ink-soft">سعر الشراء</p><p className="font-mono font-black">{money(cost)}</p></div>
              <div className="rounded-lg bg-canvas p-1.5"><p className="text-ink-soft">ربح الوحدة</p><p className={`font-mono font-black ${netUnit - cost < 0 ? "text-rose-600" : "text-emerald-700"}`}>{money(netUnit - cost)}</p></div>
              <div className="rounded-lg bg-canvas p-1.5"><p className="text-ink-soft">الهامش</p><p className="font-mono font-black">{netUnit > 0 ? (((netUnit - cost) / netUnit) * 100).toFixed(1) : "0.0"}%</p></div>
            </div>
            {line && <p className="text-[10px] text-ink-soft">ربح السطر: <span className="font-mono font-bold">{money((netUnit - cost) * baseQty)}</span></p>}
          </Section>
        )}
      </div>

      {mode === "line" && (
        <div className="border-t border-border p-3">
          <button type="button" tabIndex={-1} onClick={onRemove} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 cursor-pointer">
            <Trash2 size={13} /> حذف الصنف من السلة
          </button>
        </div>
      )}
      </aside>
    </>
  );
}
