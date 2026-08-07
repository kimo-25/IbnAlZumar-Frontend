// File: src/components/storefront/CartDrawer.jsx
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/catalog'
import { getImageUrl } from '../../utils/imageHelper'

export default function CartDrawer() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart, isCartOpen, closeCart } = useCart()

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-40 bg-graphite-950/50" onClick={closeCart} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-surface shadow-lg transition-transform duration-200 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">السلة{itemCount > 0 ? ` (${itemCount})` : ''}</h2>
          <button onClick={closeCart} className="text-ink-soft hover:text-ink" aria-label="إغلاق السلة">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <ShoppingBag size={32} className="text-ink-soft/50" />
            <p className="text-sm text-ink-soft">سلتك فارغة حالياً.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-border overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 px-5 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-canvas">
                    <img src={getImageUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium text-ink" dir="auto">
                        {item.name}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-ink-soft hover:text-danger"
                        aria-label={`إزالة ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {item.variantLabel && <p className="text-xs text-ink-soft">{item.variantLabel}</p>}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-border">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-ink-soft hover:text-ink"
                          aria-label="إنقاص الكمية"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[1.5rem] text-center font-mono text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-ink-soft hover:text-ink"
                          aria-label="زيادة الكمية"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-ink-soft">الإجمالي الفرعي</span>
                <span className="font-mono text-lg font-semibold tabular-nums text-ink">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-amber/60"
                >
                  صفحة السلة
                </Link>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="flex-1 rounded-lg bg-amber px-3 py-2.5 text-center text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark"
                >
                  إتمام الطلب
                </Link>
              </div>
              <button onClick={clearCart} className="mt-2 w-full text-center text-xs font-medium text-ink-soft hover:text-danger">
                تفريغ السلة
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
