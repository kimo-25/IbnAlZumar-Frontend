import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Package, Search, Trash2, Edit3, FileSpreadsheet, FileUp, X, Check, Mic, Square } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { getImageUrl, getProductImagePath, handleImageError } from '../../utils/imageHelper'
import { getProducts, updateProduct, deleteProduct, getCategories, convertInvoiceToExcel, sendVoiceCommand } from '../../api/adminApi'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  // حالات نافذة التعديل (Edit Modal)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editImageFile, setEditImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState(null)
  const [convertingInvoice, setConvertingInvoice] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [voiceFeedback, setVoiceFeedback] = useState(null)
  const recognitionRef = useRef(null)
  const invoiceInputRef = useRef(null)

  // 1. Debounce handle
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // جلب الأقسام لاستخدامها في القائمة المنسدلة للتعديل
  useEffect(() => {
    getCategories().then((data) => {
      const list = Array.isArray(data) ? data : (data.items || data.$values || [])
      setCategories(list)
    }).catch(err => console.error('Error fetching categories:', err))
  }, [])

  // 2. دالة جلب المنتجات
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

      const items = Array.isArray(data) ? data : (data.items || data.Items || [])
      const total = Number(
        Array.isArray(data)
          ? data.length
          : (data.totalCount ?? data.TotalCount ?? data.count ?? items.length)
      )

      setProducts(items)
      setTotalCount(total)

      const calculatedPages = Math.max(1, Math.ceil(total / pageSize))
      setTotalPages(calculatedPages)

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
    setCurrentPage(1)
    setSearchQuery(event.target.value)
  }

  // فتح نافذة التعديل
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

  // حفظ التعديلات
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingProduct) return

    setSaving(true)
    try {
      await updateProduct(editingProduct.id, editFormData, editImageFile)
      setEditingProduct(null)
      await loadProducts()
    } catch (err) {
      console.error('فشل تعديل المنتج:', err)
      alert('حدث خطأ أثناء حفظ التعديلات.')
    } finally {
      setSaving(false)
    }
  }

  const handleVoiceCommand = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setVoiceFeedback({ type: 'error', text: 'التعرف الصوتي غير مدعوم في هذا المتصفح.' })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = 'ar-EG'
    recognition.continuous = false
    recognition.interimResults = true
    setVoiceTranscript('')
    setVoiceFeedback(null)
    setIsListening(true)

    recognition.onresult = async (event) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      setVoiceTranscript(transcript)
      const finalResult = Array.from(event.results).some((result) => result.isFinal)
      if (!finalResult || !transcript.trim()) return

      try {
        const result = await sendVoiceCommand(transcript.trim())
        if (result?.success) {
          await loadProducts()
          setVoiceFeedback({ type: 'success', text: result.message || `تم تنفيذ الأمر: ${result.action || 'نجاح'}` })
        } else {
          setVoiceFeedback({ type: 'error', text: result?.message || 'تعذر تنفيذ الأمر الصوتي.' })
        }
      } catch (err) {
        setVoiceFeedback({ type: 'error', text: err?.response?.data?.message || err?.message || 'تعذر الاتصال بالخادم.' })
      }
    }
    recognition.onerror = () => {
      setVoiceFeedback({ type: 'error', text: 'تعذر التقاط الأمر الصوتي، حاول مرة أخرى.' })
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  const handleConvertInvoice = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setInvoiceFile(file)
    setConvertingInvoice(true)
    try {
      const result = await convertInvoiceToExcel(file)
      const url = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err?.message || 'تعذر تحويل الفاتورة إلى ملف اكسل.')
    } finally {
      setConvertingInvoice(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت تأكد من حذف هذا المنتج؟')) {
      try {
        await deleteProduct(id)
        await loadProducts()
      } catch (err) {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">إدارة الكتالوج والمنتجات</h1>
          <p className="text-sm text-ink-soft">عرض، بحث، والتحكم بالمنتجات المتاحة في قاعدة البيانات.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input ref={invoiceInputRef} type="file" hidden accept=".pdf,.doc,.docx,image/*" onChange={handleConvertInvoice} />
            <button type="button" onClick={() => invoiceInputRef.current?.click()} disabled={convertingInvoice} className="inline-flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-4 py-2 text-xs font-bold text-amber-dark transition hover:bg-amber/20 disabled:opacity-60">
              {convertingInvoice ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />}
              <span>{convertingInvoice ? 'جاري التحليل...' : 'تحويل فاتورة إلى اكسل'}</span>
            </button>
          <Link
            to="/admin/products/import"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>استيراد عبر اكسل</span>
          </Link>
          </div>
          {invoiceFile && !convertingInvoice && <span className="text-[11px] text-ink-soft">آخر ملف: {invoiceFile.name}</span>}
          <button type="button" onClick={handleVoiceCommand} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition ${isListening ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sky-600 hover:bg-sky-700'}`}>
            {isListening ? <Square size={15} /> : <Mic size={15} />}
            <span>{isListening ? 'إيقاف الاستماع' : 'أمر صوتي'}</span>
          </button>
          <div className="inline-flex w-fit rounded-full border border-amber/20 bg-amber/10 px-3 py-1 text-sm font-medium text-amber-dark">
            إجمالي المنتجات المتاحة: {totalCount} منتج
          </div>
        </div>
      </div>

      {(isListening || voiceTranscript || voiceFeedback) && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${voiceFeedback?.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : voiceFeedback?.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
          {isListening && <p className="font-semibold">جاري الاستماع...</p>}
          {voiceTranscript && <p dir="rtl">النص: {voiceTranscript}</p>}
          {voiceFeedback?.text && <p className="mt-1 font-semibold">{voiceFeedback.text}</p>}
        </div>
      )}

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

                {/* أزرار الإجراءات (تعديل + حذف) */}
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="justify-between"
          />
        </div>
      )}

      {/* ========================================== */}
      {/* Modal نافذة تعديل المنتج */}
      {/* ========================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-ink">تعديل بيانات المنتج</h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 text-ink-soft hover:text-rose-600 rounded-lg transition"
              >
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-ink">العدد في الكرتونة</label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.quantityPerCarton}
                    onChange={(e) => setEditFormData({ ...editFormData, quantityPerCarton: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas p-2.5 outline-none focus:border-amber transition"
                  />
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