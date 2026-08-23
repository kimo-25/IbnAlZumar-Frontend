// File: src/components/operations/ProductsVisibilityTab.jsx
import { Loader2, Search, Package, Eye, EyeOff } from 'lucide-react'
import { formatCurrency } from '../../utils/catalog'

export default function ProductsVisibilityTab({ products, loading, searchTerm, setSearchTerm, onToggleVisibility }) {
  const filteredProducts = products.filter(p =>
    (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border p-4 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المعدة أو التصنيف..."
            className="w-full rounded-xl border border-border bg-canvas pr-10 pl-4 py-2 text-xs text-ink outline-none focus:border-emerald-600 transition"
          />
        </div>
        <div className="text-xs font-semibold text-ink-soft">
          إجمالي المعدات المعروضة: <span className="font-mono font-bold text-emerald-600">{filteredProducts.length}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
              <tr>
                <th className="p-4">الصنف / المعدة</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4">السعر</th>
                <th className="p-4">الحالة بالمخزن</th>
                <th className="p-4">حالة الظهور للعملاء</th>
                <th className="p-4 text-center">التحكم في النشر والظهور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-ink-soft">
                    <Package size={36} className="mx-auto mb-2 text-border" />
                    <p className="font-bold text-sm text-ink">لا توجد منتجات مطابقة للبحث</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isVisible = product.isPublished ?? product.isActive ?? product.isVisible ?? true
                  return (
                    <tr key={product.id} className="hover:bg-canvas/50 transition">
                      <td className="p-4 font-bold text-ink flex items-center gap-3">
                        {product.imageUrl || product.image ? (
                          <img src={product.imageUrl || product.image} alt="" className="w-9 h-9 rounded-xl object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-canvas border border-border flex items-center justify-center text-ink-soft shrink-0">
                            <Package size={16} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-ink">{product.name || product.title}</div>
                          <div className="font-mono text-[10px] text-ink-soft">SKU: {product.sku || `PRD-${product.id}`}</div>
                        </div>
                      </td>
                      <td className="p-4 text-ink-soft">{product.categoryName || product.category?.name || 'مستلزمات ورش'}</td>
                      <td className="p-4 font-mono font-bold text-ink">{formatCurrency(product.price || product.unitPrice || 0)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${(product.stock ?? product.quantity ?? 10) > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                          {(product.stock ?? product.quantity ?? 10) > 0 ? 'متوفر بالمخزن' : 'نفذت الكمية'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${isVisible ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                          {isVisible ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} className="text-gray-500" />}
                          {isVisible ? 'منشور للعملاء' : 'مخفي'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleVisibility(product.id, !isVisible)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-semibold transition cursor-pointer shadow-xs ${isVisible
                              ? 'bg-surface border border-border text-rose-600 hover:bg-rose-50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                          {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{isVisible ? 'إخفاء من المتجر' : 'نشر بالمتجر'}</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}