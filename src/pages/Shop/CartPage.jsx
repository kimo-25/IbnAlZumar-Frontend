import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/catalog'
import { getImageUrl } from '../../utils/imageHelper'

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart()

  if (!items.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <EmptyState
          icon={ShoppingBag}
          title="السلة فارغة"
          description="ابدأ بإضافة منتجات من المتجر ثم عد لإكمال الطلب بسهولة."
          action={
            <Link to="/" className="rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800">
              تصفح المنتجات
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">سلة المشتريات</h1>
          <p className="text-sm text-ink-soft">{itemCount} عنصر داخل السلة حالياً</p>
        </div>
        <button onClick={clearCart} className="text-sm font-medium text-ink-soft transition hover:text-danger">
          تفريغ السلة
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas">
                  <img src={getImageUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium text-ink" dir="auto">
                        {item.name}
                      </h2>
                      {item.variantLabel && <p className="mt-1 text-xs text-ink-soft">{item.variantLabel}</p>}
                      <p className="mt-1 font-mono text-sm text-ink-soft">{item.sku}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-ink-soft transition hover:text-danger" aria-label={`إزالة ${item.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-border">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-2 text-ink-soft transition hover:text-ink" aria-label="إنقاص الكمية">
                        <Minus size={16} />
                      </button>
                      <span className="min-w-8 text-center font-mono text-sm font-semibold tabular-nums text-ink">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-2 text-ink-soft transition hover:text-ink" aria-label="زيادة الكمية">
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="text-left rtl:text-right">
                      <p className="text-xs text-ink-soft">الإجمالي</p>
                      <p className="font-mono text-base font-semibold text-ink">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="ملخص الطلب">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>قيمة المنتجات</span>
              <span className="font-mono text-base font-semibold text-ink">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>الشحن</span>
              <span className="font-medium text-ink">يُحسب عند الطلب</span>
            </div>
            <div className="border-t border-border pt-4">
              <Link
                to="/checkout"
                className="flex w-full items-center justify-center rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark"
              >
                الانتقال للدفع
              </Link>
              <Link
                to="/"
                className="mt-2 flex w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:border-amber/60"
              >
                مواصلة التسوق
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}