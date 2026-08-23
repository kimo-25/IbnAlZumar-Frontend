// File: src/pages/Moderator/ModeratorCatalogPage.jsx
import { useEffect, useState, useCallback } from 'react'
import { Loader2, Package, Search, Edit3, Trash2, X, Check } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/catalog'
import { getImageUrl, getProductImagePath, handleImageError } from '../../utils/imageHelper'
import { getModeratorProducts, updateModeratorProduct, deleteModeratorProduct, getCategories } from '../../api/moderatorApi'

export default function ModeratorCatalogPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editImageFile, setEditImageFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    getCategories()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.items || data.$values || []
        setCategories(list)
      })
      .catch((err) => console.error('Error fetching categories:', err))
  }, [])

  const fetchData = useCallback(async () => {
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
  }, [debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      imageUrl: product.imageUrl || '',
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
      await fetchData()
    } catch (err) {
      console.error('فشل تعديل المنتج:', err)
      alert('حدث خطأ أثناء حفظ التعديلات.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteModeratorProduct(id)
        await fetchData()
      } catch (err) {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">عرض الكتالوج (Moderator)</h1>
          <p className="text-sm text-ink-soft">استعراض وإدارة المنتجات المتاحة في النظام.</p>
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
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-amber" />}
      </div>

      {products.length === 0 && !loading ? (
        <Card>
          <EmptyState icon={Package} title="لا توجد منتجات" description="لم نتمكن من العثور على أي نتائج." />
        </Card>
      ) : (
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
          {products.map((product) => (
            <Card key={product.id} className="flex items-center gap-4 p-4 relative group">
              <img
                src={getImageUrl(getProductImagePath(product))}
                alt={product.nameAr || product.name}
                onError={handleImageError}
                className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-100 object-cover"
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

              <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={() => handleStartEdit(product)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                  title="تعديل المنتج"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

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
                    value={editFormData.nameAr || ''}
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
                    <option key={c.id} value={c.id}>
                      {c.name || c.nameAr}
                    </option>
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