// File: src/pages/Moderator/ModeratorProductsPage.jsx
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Package, Search, Trash2, Edit3, FileSpreadsheet, X, Check } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { getImageUrl, getProductImagePath, handleImageError } from '../../utils/imageHelper'
import { getModeratorProducts, deleteModeratorProduct, updateModeratorProduct, getCategories } from '../../api/moderatorApi'

export default function ModeratorProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 20
  const [totalCount, setTotalCount] = useState(0)

  // حالات التعديل
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editImageFile, setEditImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    getCategories().then((data) => {
      const list = Array.isArray(data) ? data : (data.items || data.$values || [])
      setCategories(list)
    }).catch(err => console.error('Error fetching categories:', err))
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { pageNumber: currentPage, pageSize: pageSize }
      const trimmedSearch = debouncedSearch.trim()
      if (trimmedSearch) params.search = trimmedSearch

      const data = await getModeratorProducts(params)
      const items = Array.isArray(data) ? data : (data.items || data.Items || [])
      const total = Number(Array.isArray(data) ? data.length : (data.totalCount ?? data.TotalCount ?? data.count ?? items.length))

      setProducts(items)
      setTotalCount(total)

      const calculatedPages = Math.max(1, Math.ceil(total / pageSize))
      setTotalPages(calculatedPages)

      if (currentPage > calculatedPages && calculatedPages > 0) setCurrentPage(1)
    } catch (err) {
      console.error('Error fetching moderator products:', err)
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
    setCurrentPage(1)
    setSearchQuery(event.target.value)
  }

  const handleStartEdit = (product) => {
    setEditingProduct(product)
    setEditFormData({
      sku: product.sku || '',
      barcode: product.barcode || '',
      name: product.name || '',
      nameAr: product.nameAr || '',
      sellingPrice: product.sellingPrice || product.price || 0,
      currentCostPrice: product.currentCostPrice || 0,
      quantityPerCarton: product.quantityPerCarton || 1,
      categoryId: product.categoryId || (categories[0]?.id ?? 1),
      isActive: product.isActive ?? true,
      trackInventory: product.trackInventory ?? true,
      imageUrl: product.imageUrl || ''
    })
    setEditImageFile(null)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingProduct) return

    setSaving(true)
    try {
      await updateModeratorProduct(editingProduct.id, editFormData, editImageFile)
      setEditingProduct(null)
      await loadProducts()
    } catch (err) {
      console.error('فشل تعديل المنتج:', err)
      alert('حدث خطأ أثناء حفظ التعديلات.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت تأكد من حذف هذا المنتج؟')) {
      try {
        await deleteModeratorProduct(id)
        await loadProducts()
      } catch (err) {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">المنتجات (لوحة المشرف)</h1>
          <p className="text-sm text-ink-soft">استعراض، بحث، وإدارة المنتجات للكتالوج.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/moderator/products/import"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>استيراد عبر اكسل</span>
          </Link>
          <div className="inline-flex w-fit rounded-full border border-amber/20 bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
            إجمالي المنتجات: {totalCount} منتج
          </div>
        </div>
      </div>

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
          {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber" />}
        </div>
      </div>

      {loading && products.length === 0 ? (
        <div className="p-12 text-center text-ink-soft flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          جاري تحميل المنتجات...
        </div>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState icon={Package} title="لا توجد منتجات مضافة" description="لم نتمكن من العثور على أي نتائج تطابق بحثك." />
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

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleStartEdit(product)}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="تعديل المنتج"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="justify-between" />
        </div>
      )}

      {/* Modal تعديل المنتج للمشرف */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-ink">تعديل بيانات المنتج</h2>
              <button type="button" onClick={() => setEditingProduct(null)} className="p-1 text-ink-soft hover:text-rose-600 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-ink">SKU (رمز المنتج)</label>
                <input
                  type="text"
                  required
                  value={editFormData.sku}
                  onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-ink">اسم المنتج (إنجليزي)</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">اسم المنتج (عربي)</label>
                  <input
                    type="text"
                    value={editFormData.nameAr}
                    onChange={(e) => setEditFormData({ ...editFormData, nameAr: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-ink">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={editFormData.sellingPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-ink">سعر التكلفة (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.currentCostPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, currentCostPrice: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">القسم (Category)</label>
                <select
                  value={editFormData.categoryId}
                  onChange={(e) => setEditFormData({ ...editFormData, categoryId: Number(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">تغيير صورة المنتج (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber/10 file:text-amber-dark hover:file:bg-amber/20 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>تأكيد وحفظ التعديلات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-canvas transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}