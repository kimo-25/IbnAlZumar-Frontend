// File: src/pages/moderator/ModeratorHubPage.jsx
import { useEffect, useState } from 'react'
import { Edit3, Loader2, Package, Trash2, Upload, X } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/catalog'
import {
  createModeratorProduct,
  deleteModeratorProduct,
  getModeratorCategories,
  getModeratorProducts,
  updateModeratorProduct,
} from '../../api/moderatorApi'

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  return []
}

const initialProductState = {
  id: null,
  sku: '',
  barcode: '',
  name: '',
  nameAr: '',
  description: '',
  sellingPrice: '',
  currentCostPrice: '',
  quantityPerCarton: 1,
  categoryId: 1,
  brandId: 1,
  isActive: true,
  trackInventory: true,
  imageUrl: 'uploads/products/default.png',
}

export default function ModeratorHubPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [productForm, setProductForm] = useState(initialProductState)
  const [imageFile, setImageFile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        getModeratorProducts(),
        getModeratorCategories(),
      ])

      const productsData = results[0].status === 'fulfilled' ? results[0].value : []
      const categoriesData = results[1].status === 'fulfilled' ? results[1].value : []

      setProducts(normalizeArray(productsData))
      setCategories(normalizeArray(categoriesData))
    } catch (err) {
      console.error('Error loading moderator hub data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleProductSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (isEditing && productForm.id) {
        await updateModeratorProduct(productForm.id, productForm, imageFile)
      } else {
        await createModeratorProduct(productForm, imageFile)
      }
      resetProductForm()
      await loadData()
      alert('تم حفظ المنتج بنجاح!')
    } catch (err) {
      alert('حدث خطأ أثناء حفظ المنتج: ' + (err?.message || 'تأكد من البيانات'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (product) => {
    setIsEditing(true)
    setImageFile(null)
    setProductForm({
      id: product.id,
      sku: product.sku || product.SKU || '',
      barcode: product.barcode || product.Barcode || '',
      name: product.name || product.Name || '',
      nameAr: product.nameAr || product.NameAr || '',
      description: product.description || product.Description || '',
      sellingPrice: product.sellingPrice || product.SellingPrice || '',
      currentCostPrice: product.currentCostPrice || product.CurrentCostPrice || '',
      quantityPerCarton: product.quantityPerCarton || product.QuantityPerCarton || 1,
      categoryId: product.categoryId || product.CategoryId || 1,
      brandId: product.brandId || product.BrandId || 1,
      isActive: product.isActive !== undefined ? product.isActive : true,
      trackInventory: product.trackInventory !== undefined ? product.trackInventory : true,
      imageUrl: product.imageUrl || product.ImageUrl || 'uploads/products/default.png',
    })
  }

  const resetProductForm = () => {
    setProductForm(initialProductState)
    setImageFile(null)
    setIsEditing(false)
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) {
      try {
        await deleteModeratorProduct(productId)
        setProducts((current) => current.filter((item) => item.id !== productId))
      } catch (err) {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-ink-soft">
        <Loader2 className="animate-spin" size={18} />
        جارٍ تحميل لوحة المنتجات...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">إدارة المنتجات (مشرف النظام)</h1>
        <p className="text-sm text-ink-soft">يمكنك إضافة المنتجات وتعديلها وحذفها من الكتالوج فقط.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Form */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>{isEditing ? 'تعديل منتج' : 'إضافة منتج جديد'}</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs text-danger flex items-center gap-1 hover:underline"
                >
                  <X size={14} /> إلغاء التعديل
                </button>
              )}
            </div>
          }
        >
          <form onSubmit={handleProductSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">SKU *</label>
                <input
                  value={productForm.sku}
                  onChange={(e) => setProductForm((c) => ({ ...c, sku: e.target.value }))}
                  placeholder="مثال: JDDT1B77"
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">الباركود</label>
                <input
                  value={productForm.barcode}
                  onChange={(e) => setProductForm((c) => ({ ...c, barcode: e.target.value }))}
                  placeholder="اختياري"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block">اسم المنتج (إنجليزي) *</label>
              <input
                value={productForm.name}
                onChange={(e) => setProductForm((c) => ({ ...c, name: e.target.value }))}
                placeholder="Product Name English"
                required
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block">اسم المنتج (عربي)</label>
              <input
                value={productForm.nameAr}
                onChange={(e) => setProductForm((c) => ({ ...c, nameAr: e.target.value }))}
                placeholder="الاسم باللغة العربية"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">سعر البيع *</label>
                <input
                  value={productForm.sellingPrice}
                  onChange={(e) => setProductForm((c) => ({ ...c, sellingPrice: e.target.value }))}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">سعر التكلفة</label>
                <input
                  value={productForm.currentCostPrice}
                  onChange={(e) => setProductForm((c) => ({ ...c, currentCostPrice: e.target.value }))}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">القسم</label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm((c) => ({ ...c, categoryId: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
                >
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameAr || cat.name}
                      </option>
                    ))
                  ) : (
                    <option value={1}>القسم الرئيسي (1)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-soft mb-1 block">الكمية لكل كرتونة</label>
                <input
                  value={productForm.quantityPerCarton}
                  onChange={(e) => setProductForm((c) => ({ ...c, quantityPerCarton: Number(e.target.value) }))}
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block">وصف المنتج</label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm((c) => ({ ...c, description: e.target.value }))}
                placeholder="وصف المنتج والمواصفات الفنية..."
                rows={2}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-ink-soft mb-1 block flex items-center gap-1">
                <Upload size={14} /> صورة المنتج (اختياري)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0] || null)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-ink outline-none file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {imageFile && (
                <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                  تم اختيار: {imageFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm((c) => ({ ...c, isActive: e.target.checked }))}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-600"
                />
                متاح أونلاين / نشط
              </label>
            </div>

            <button
              disabled={submitting}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition flex items-center justify-center gap-2 ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {isEditing ? 'تحديث المنتج' : 'إضافة المنتج'}
            </button>
          </form>
        </Card>

        {/* List */}
        <Card title={`بيانات الكتالوج (${products.length} منتج)`}>
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="الكتالوج فارغ"
              description="سيظهر هنا الكتالوج الكامل للموديريتور."
            />
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {products.map((product) => {
                const displayName = product.nameAr || product.NameAr || product.name || product.Name
                const subName = (product.nameAr || product.NameAr) ? (product.name || product.Name) : ''

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border p-3.5 hover:border-emerald-600/30 transition bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-ink truncate" dir="auto">
                          {displayName}
                        </p>
                        {product.sku && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                            {product.sku}
                          </span>
                        )}
                      </div>
                      {subName && (
                        <p className="text-xs text-ink-soft truncate mt-0.5">{subName}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="font-semibold text-emerald-600" dir="ltr">
                          {formatCurrency(product.sellingPrice || product.SellingPrice || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="rounded-lg border border-border p-2 text-ink-soft hover:text-emerald-600 hover:bg-emerald-50"
                        title="تعديل المنتج"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="rounded-lg border border-border p-2 text-danger hover:bg-danger/5"
                        title="حذف المنتج"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}