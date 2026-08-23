// File: src/pages/Products/AddProduct.jsx
// Requires: npm install xlsx   (SheetJS — used only to generate the downloadable template client-side)
import { useState, useRef, useCallback } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  X,
  RotateCcw,
  ListChecks
} from 'lucide-react'
import * as XLSX from 'xlsx'
import Card from '../../components/ui/Card'
import { uploadProductsExcel } from '../../api/adminApi'

// أعمدة القالب — بنفس أسماء حقول CreateProductDto بالظبط عشان الباك إند يقرأها صح
const TEMPLATE_COLUMNS = [
  'SKU',
  'Barcode',
  'Name',
  'NameAr',
  'Description',
  'SellingPrice',
  'CurrentCostPrice',
  'QuantityPerCarton',
  'IsActive',
  'TrackInventory',
  'CategoryId',
  'BrandId',
  'ImageUrl'
]

const SAMPLE_ROW = [
  'HW-0001',
  '6221234567890',
  'Cordless Drill 18V',
  'مفك كهربائي لاسلكي 18 فولت',
  'مفك كهربائي احترافي بطارية ليثيوم',
  1250,
  950,
  1,
  true,
  true,
  1,
  1,
  ''
]

function downloadTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS, SAMPLE_ROW])
  worksheet['!cols'] = TEMPLATE_COLUMNS.map((c) => ({ wch: Math.max(c.length + 4, 16) }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
  XLSX.writeFile(workbook, 'ibn-alzumar-products-template.xlsx')
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls']

function isAcceptedFile(file) {
  if (!file) return false
  const lowerName = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

export default function AddProduct() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null) // BulkImportResultDto من الباك إند
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFileSelected = useCallback((file) => {
    setResult(null)
    setError(null)

    if (!isAcceptedFile(file)) {
      setError('صيغة الملف غير مدعومة. من فضلك اختر ملف بصيغة .xlsx أو .xls فقط.')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
  }, [])

  function handleInputChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFileSelected(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelected(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function clearSelection() {
    setSelectedFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleUpload() {
    if (!selectedFile) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const data = await uploadProductsExcel(selectedFile)
      setResult(data)
    } catch (err) {
      console.error('فشل استيراد المنتجات:', err)
      setError(err?.message || 'حدث خطأ أثناء استيراد المنتجات، يرجى إعادة المحاولة.')
    } finally {
      setUploading(false)
    }
  }

  const hasErrors = result?.errors?.length > 0 || result?.Errors?.length > 0
  const importErrors = result?.errors ?? result?.Errors ?? []
  const successCount = result?.successCount ?? result?.SuccessCount ?? 0
  const failedCount = result?.failedCount ?? result?.FailedCount ?? importErrors.length
  const totalRows = result?.totalRows ?? result?.TotalRows ?? successCount + failedCount

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">استيراد منتجات جماعي عبر ملف اكسل</h1>
          <p className="text-xs text-ink-soft mt-1">
            ارفع ملف اكسل يحتوي على عدة منتجات دفعة واحدة بدلاً من إضافتهم يدوياً واحداً تلو الآخر
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
        >
          <Download size={14} className="text-emerald-600" />
          <span>تحميل قالب الاكسل</span>
        </button>
      </div>

      <Card title="رفع ملف المنتجات">
        <div className="space-y-4 pt-2">
          {!selectedFile ? (
            <label
              htmlFor="excel-upload-input"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-border bg-canvas hover:border-emerald-300 hover:bg-emerald-50/20'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <UploadCloud size={26} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-ink">اسحب وأفلت ملف الاكسل هنا</p>
                <p className="text-xs text-ink-soft mt-1">أو اضغط لاختيار ملف من جهازك (.xlsx أو .xls)</p>
              </div>
              <input
                id="excel-upload-input"
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-canvas px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-ink truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-ink-soft font-mono mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} كيلوبايت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                disabled={uploading}
                className="p-2 rounded-lg text-ink-soft hover:bg-surface hover:text-rose-600 transition cursor-pointer shrink-0 disabled:opacity-50"
                title="إزالة الملف"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 p-4 text-rose-700 text-xs border border-rose-200 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              <span>{uploading ? 'جاري الاستيراد...' : 'استيراد المنتجات الآن'}</span>
            </button>

            {(selectedFile || result) && !uploading && (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface border border-border px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-canvas transition cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>البدء من جديد</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                <ListChecks size={15} />
                <span>إجمالي الصفوف</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-ink font-mono">{totalRows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>تم استيرادها بنجاح</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-700 font-mono">{successCount}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                <XCircle size={15} />
                <span>صفوف بها أخطاء</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-rose-700 font-mono">{failedCount}</p>
            </div>
          </div>

          {!hasErrors && successCount > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-600" />
              <p className="font-bold text-sm text-emerald-800">تم استيراد جميع المنتجات بنجاح بدون أي أخطاء</p>
            </div>
          )}

          {hasErrors && (
            <Card title="تفاصيل الصفوف التي بها أخطاء">
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-right text-xs">
                  <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
                    <tr>
                      <th className="p-3">رقم الصف بالاكسل</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">تفاصيل الخطأ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importErrors.map((rowError, idx) => {
                      const rowNumber = rowError.rowNumber ?? rowError.RowNumber
                      const sku = rowError.sku ?? rowError.SKU
                      const errors = rowError.errors ?? rowError.Errors ?? []
                      return (
                        <tr key={`${rowNumber}-${idx}`} className="hover:bg-canvas/50 transition">
                          <td className="p-3 font-mono font-bold text-rose-600">#{rowNumber}</td>
                          <td className="p-3 font-mono text-ink">{sku || '—'}</td>
                          <td className="p-3">
                            <ul className="space-y-1">
                              {errors.map((msg, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-rose-700">
                                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                  <span>{msg}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}