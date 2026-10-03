// File: src/components/pos/PosProductTable.jsx
// High-density product list: ONE fixed-height line per product (no images) so 15-20 items fit on screen.
import { Info } from "lucide-react";

export function getOnHand(product) {
  const v = product?.quantityOnHand ?? product?.onHandQuantity ?? product?.availableQuantity;
  return v === undefined || v === null ? null : Number(v);
}

function StockCell({ product }) {
  const q = getOnHand(product);
  if (q === null || product.trackInventory === false) return <span className="text-ink-soft">—</span>;
  if (q <= 0) return <span className="rounded bg-rose-100 px-1.5 font-bold text-rose-700">نفذ</span>;
  return <span className={`font-mono font-bold ${q <= 5 ? "text-amber-600" : "text-ink"}`}>{q}</span>;
}

export default function PosProductTable({ products, loading, activeId, onAdd, onInfo }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-surface"
      // keep keyboard focus in the scan box when the mouse is used
      onMouseDown={(e) => {
        if (!e.target.closest("input,select,textarea")) e.preventDefault();
      }}
    >
      <div className="max-h-[calc(100dvh-262px)] min-h-[200px] overflow-y-auto">
        <table className="w-full table-fixed text-[12px]">
          <colgroup>
            <col />
            <col className="w-40" />
            <col className="w-24" />
            <col className="w-16" />
            <col className="w-9" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-canvas text-[11px] text-ink-soft">
            <tr className="h-7">
              <th className="px-2 text-start font-bold">الصنف</th>
              <th className="px-2 text-start font-bold">الكود / الباركود</th>
              <th className="px-2 text-end font-bold">السعر</th>
              <th className="px-2 text-center font-bold">المتاح</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const hasOptions = p.variants?.length > 0 || p.units?.length > 1;
              return (
                <tr
                  key={p.id}
                  data-row="product"
                  onClick={() => onAdd(p)}
                  className={`h-8 cursor-pointer border-t border-border transition-colors hover:bg-emerald-50 ${
                    activeId === p.id ? "bg-emerald-50" : "odd:bg-surface even:bg-canvas/50"
                  }`}
                >
                  <td className="px-2">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-bold text-ink" title={p.nameAr || p.name}>
                        {p.nameAr || p.name}
                      </span>
                      {hasOptions && (
                        <span className="shrink-0 rounded bg-amber/15 px-1 text-[9px] font-bold text-amber-dark">
                          خيارات
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2">
                    <div className="truncate font-mono text-[11px] text-ink-soft" title={`${p.sku || ""} ${p.barcode || ""}`}>
                      {p.sku || "—"}
                      {p.barcode ? <span className="text-ink-soft/70"> · {p.barcode}</span> : null}
                    </div>
                  </td>
                  <td className="px-2 text-end font-mono font-black text-emerald-700">
                    {Number(p.sellingPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="px-2 text-center">
                    <StockCell product={p} />
                  </td>
                  <td className="px-1 text-center">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`تفاصيل ${p.nameAr || p.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInfo(p);
                      }}
                      className="rounded-md p-1 text-ink-soft transition hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer"
                    >
                      <Info size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-14 text-center text-sm text-ink-soft">
                  لا توجد منتجات مطابقة للبحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
