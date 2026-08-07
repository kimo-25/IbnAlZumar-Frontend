import { useEffect, useState } from 'react'
import { Loader2, Package, Search } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/catalog'
import { getImageUrl, getProductImagePath } from '../../utils/imageHelper'
import { getModeratorProducts } from '../../api/moderatorApi'

export default function ModeratorCatalogPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchData()
  }, [debouncedSearch])

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getModeratorProducts({ search: debouncedSearch })
      const items = Array.isArray(data) ? data : data.items || data.Items || []
      setProducts(items)
    } catch (err) {
      console.error('Error fetching catalog:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">عرض الكتالوج (Moderator)</h1>
          <p className="text-sm text-ink-soft">استعراض وحسب للمنتجات المتاحة في النظام.</p>
        </div>
        <div className="rounded-full bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark border border-amber/20">
          إجمالي المنتجات: {products.length} منتج
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          placeholder="بحث بالاسم أو SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-9 text-sm text-ink focus:outline-none focus:border-amber"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber" />
        )}
      </div>

      {products.length === 0 && !loading ? (
        <Card>
          <EmptyState icon={Package} title="لا توجد منتجات" description="لم نتمكن من العثور على أي نتائج." />
        </Card>
      ) : (
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
          {products.map((product) => (
            <Card key={product.id} className="flex items-center gap-4 p-4">
              <img
                src={getImageUrl(getProductImagePath(product))}
                alt={product.name}
                className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-100 object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/150x150/f3f4f6/9ca3af?text=No+Image'
                }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-ink" dir="auto">
                  {product.nameAr || product.name}
                </h3>
                <p className="mt-0.5 text-xs text-ink-soft">SKU: {product.sku}</p>
                <p className="mt-1 text-xs font-bold text-emerald-600">
                  {formatCurrency(product.sellingPrice || product.price || 0)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}