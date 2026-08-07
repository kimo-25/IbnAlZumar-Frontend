// File: src/pages/admin/ProductsPage.jsx
import { useEffect, useState, useCallback } from 'react'
import { Loader2, Package, Search, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { getImageUrl, getProductImagePath, handleImageError } from '../../utils/imageHelper'
import { getProducts, deleteProduct } from '../../api/adminApi'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(20) // عرض 20 منتج في الصفحة الواحدة بشكل منطقي
  const [totalCount, setTotalCount] = useState(0)

  // 1. Debounce handle: تأخير البحث 400ms أثناء الكتابة لتخفيف الضغط على السيرفر
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 2. دالة جلب المنتجات ديناميكياً من الـ Backend
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        pageNumber: currentPage,
        pageSize: pageSize,
      }

      const trimmedSearch = debouncedSearch.trim()
      if (trimmedSearch) {
        params.searchTerm = trimmedSearch
      }

      const data = await getProducts(params)

      // استخراج البيانات والميتاداتا الخاصة بالـ Pagination
      const items = Array.isArray(data) ? data : (data.items || data.Items || [])
      const total = Number(
        Array.isArray(data)
          ? data.length
          : (data.totalCount ?? data.TotalCount ?? data.count ?? items.length)
      )

      setProducts(items)
      setTotalCount(total)

      // حساب عدد الصفحات الكلي بناءً على العدد الفعلي في قاعدة البيانات
      const calculatedPages = Math.max(1, Math.ceil(total / pageSize))
      setTotalPages(calculatedPages)

      // إذا كانت الصفحة الحالية أكبر من إجمالي الصفحات (مثلاً بعد الحذف أو البحث)، نرجع للصفحة الأولى
      if (currentPage > calculatedPages && calculatedPages > 0) {
        setCurrentPage(1)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function handleSearchChange(event) {
    setCurrentPage(1) // إعادة الترقيم للصفحة الأولى عند بدء بحث جديد
    setSearchQuery(event.target.value)
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت تأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(id)
        // إعادة التحميل لضمان تحديث الـ TotalCount وأعداد الصفحات بدقة من قاعدة البيانات
        await loadProducts()
      } catch (err) {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">إدارة الكتالوج والمنتجات</h1>
          <p className="text-sm text-ink-soft">عرض، بحث، والتحكم بالمنتجات المتاحة في قاعدة البيانات.</p>
        </div>
        <div className="inline-flex w-fit rounded-full border border-amber/20 bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
          إجمالي المنتجات المتاحة: {totalCount} منتج
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            placeholder="بحث بالاسم أو الـ SKU..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-9 text-sm text-ink focus:outline-none focus:border-amber"
          />
          {loading && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber" />
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading && products.length === 0 ? (
        <div className="p-12 text-center text-ink-soft flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          جاري تحميل المنتجات...
        </div>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="لا توجد منتجات مضافة"
            description="لم نتمكن من العثور على أي نتائج تطابق بحثك."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {products.map((product) => (
              <Card key={product.id} className="flex items-center gap-4 p-4 relative group">
                <img
                  src={getImageUrl(getProductImagePath(product))}
                  alt={product.nameAr || product.name}
                  onError={handleImageError}
                  className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-ink" dir="auto">{product.nameAr || product.name}</h3>
                  {product.nameAr && <p className="truncate text-xs text-ink-soft">{product.name}</p>}
                  <p className="mt-0.5 text-xs text-ink-soft">SKU: {product.sku}</p>
                  <p className="mt-1 text-xs font-bold text-emerald-600">{product.sellingPrice || product.price || 0} ج.م</p>
                </div>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="opacity-0 group-hover:opacity-100 transition p-2 text-danger hover:bg-danger/10 rounded-lg"
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="justify-between"
          />
        </div>
      )}
    </div>
  )
}