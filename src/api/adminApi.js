// File: src/api/adminApi.js
import axiosInstance from './axiosInstance'
import { validateProduct, validateCustomer, validateCategory } from '../validators/productValidator'

/**
 * دالة حماية فائقة لمنع إلقاء أي أخطاء 404 نهائياً وإعادة قيمة افتراضية آمنة
 */
async function safeGet(url, params = {}, defaultValue = []) {
  try {
    const response = await axiosInstance.get(url, { params })
    return response.data
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`[Safe API Fallback] Endpoint ${url} not found (404). Returning default value.`)
      return defaultValue
    }
    return defaultValue
  }
}

// ==========================================
// 1. إدارة المنتجات (Products)
// ==========================================

export async function getProducts(params = {}) {
  return safeGet('/Products', params, [])
}

export async function getAllProducts(params = {}) {
  return getProducts(params)
}

export async function getProductById(id) {
  const response = await axiosInstance.get(`/Products/${id}`)
  return response.data
}

export async function createProduct(productData, imageFile = null) {
  // فحص صحة وتطهير البيانات بواسطة Zod قبل الإرسال
  const validation = validateProduct({
    ...productData,
    price: Number(productData.sellingPrice) || 0,
    stock: Number(productData.stock) || 0
  })

  if (!validation.success) {
    throw new Error(validation.errors.join(' | '))
  }

  const formData = new FormData()

  formData.append('sku', productData.sku || '')
  if (productData.barcode) formData.append('barcode', productData.barcode)
  formData.append('name', productData.name || '')
  if (productData.nameAr) formData.append('nameAr', productData.nameAr)
  if (productData.description) formData.append('description', productData.description)

  formData.append('sellingPrice', Number(productData.sellingPrice) || 0)
  if (productData.currentCostPrice !== null && productData.currentCostPrice !== undefined) {
    formData.append('currentCostPrice', Number(productData.currentCostPrice) || 0)
  }

  formData.append('quantityPerCarton', Number(productData.quantityPerCarton) || 1)
  formData.append('isActive', Boolean(productData.isActive))
  formData.append('trackInventory', Boolean(productData.trackInventory))
  formData.append('categoryId', Number(productData.categoryId) || 1)

  if (productData.brandId) formData.append('brandId', Number(productData.brandId))

  if (imageFile) {
    formData.append('imageFile', imageFile)
  } else if (productData.imageUrl) {
    formData.append('imageUrl', productData.imageUrl)
  }

  const response = await axiosInstance.post('/Products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function updateProduct(id, productData, imageFile = null) {
  const formData = new FormData()

  formData.append('id', id)
  formData.append('sku', productData.sku || '')
  if (productData.barcode) formData.append('barcode', productData.barcode)
  formData.append('name', productData.name || '')
  if (productData.nameAr) formData.append('nameAr', productData.nameAr)
  if (productData.description) formData.append('description', productData.description)

  formData.append('sellingPrice', Number(productData.sellingPrice) || 0)
  if (productData.currentCostPrice !== null && productData.currentCostPrice !== undefined) {
    formData.append('currentCostPrice', Number(productData.currentCostPrice) || 0)
  }

  formData.append('quantityPerCarton', Number(productData.quantityPerCarton) || 1)
  formData.append('isActive', Boolean(productData.isActive))
  formData.append('trackInventory', Boolean(productData.trackInventory))
  formData.append('categoryId', Number(productData.categoryId) || 1)

  if (productData.brandId) formData.append('brandId', Number(productData.brandId))

  if (imageFile) {
    formData.append('imageFile', imageFile)
  } else if (productData.imageUrl) {
    formData.append('imageUrl', productData.imageUrl)
  }

  const response = await axiosInstance.put(`/Products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function deleteProduct(id) {
  const response = await axiosInstance.delete(`/Products/${id}`)
  return response.data
}

export async function updateProductVisibility(id, isVisible) {
  return updateProduct(id, { isActive: isVisible })
}

/**
 * رفع ملف اكسل (.xlsx / .xls) لاستيراد المنتجات دفعة واحدة (Bulk Import).
 * الباك إند يرجع BulkImportResultDto:
 * { totalRows, successCount, failedCount, importedSkus, errors: [{ rowNumber, sku, errors: [] }] }
 * لا نستخدم safeGet هنا عمداً: عايزين الخطأ الحقيقي يوصل للمكوّن عشان نعرض تفاصيل الصفوف الغلط.
 */
export async function uploadProductsExcel(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post('/Products/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function convertInvoiceToExcel(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axiosInstance.post('/Catalog/convert-invoice-to-excel', formData, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const safeName = file.name.replace(/\.[^.]+$/, '') || 'invoice'
  return { blob: response.data, fileName: `${safeName}_products.xlsx` }
}

// ==========================================
// 2. إدارة الأقسام والعملاء
// ==========================================

export async function getCategories() {
  return safeGet('/Categories', {}, [])
}

export async function createCategory(categoryData) {
  const validation = validateCategory(categoryData)
  if (!validation.success) {
    throw new Error(validation.errors.join(' | '))
  }

  const response = await axiosInstance.post('/Categories', categoryData)
  return response.data
}

export async function updateCategory(id, categoryData) {
  const response = await axiosInstance.put(`/Categories/${id}`, categoryData)
  return response.data
}

export async function deleteCategory(id) {
  const response = await axiosInstance.delete(`/Categories/${id}`)
  return response.data
}

export async function getCustomers(params = {}) {
  return safeGet('/Customers', params, [])
}

export async function createCustomer(customerData) {
  const validation = validateCustomer(customerData)
  if (!validation.success) {
    throw new Error(validation.errors.join(' | '))
  }

  const response = await axiosInstance.post('/Customers', customerData)
  return response.data
}

export async function updateCustomer(id, customerData) {
  const response = await axiosInstance.put(`/Customers/${id}`, customerData)
  return response.data
}

export async function deleteCustomer(id) {
  const response = await axiosInstance.delete(`/Customers/${id}`)
  return response.data
}

// ==========================================
// 3. إدارة الطلبات والعمليات
// ==========================================

export async function getExpenses(params = {}) {
  return safeGet('/Expenses', params, [])
}

export async function createExpense(expenseData) {
  const response = await axiosInstance.post('/Expenses', expenseData)
  return response.data
}

export async function deleteExpense(id) {
  const response = await axiosInstance.delete(`/Expenses/${id}`)
  return response.data
}

export async function getOrders(params = {}) {
  return safeGet('/Orders', params, [])
}

export async function getOnlineOrders(params = {}) {
  try {
    const response = await axiosInstance.get('/Orders', { params })
    return response.data
  } catch (error) {
    return safeGet('/Orders/online', params, [])
  }
}

export async function advanceOnlineOrderStatus(orderId) {
  const response = await axiosInstance.put(`/Orders/${orderId}/advance-status`)
  return response.data
}

export async function getInquiries(params = {}) {
  return safeGet('/Inquiries', params, [])
}

export async function replyToInquiry(inquiryId, replyData) {
  const response = await axiosInstance.post(`/Inquiries/${inquiryId}/reply`, replyData)
  return response.data
}

export async function getShippingZones() {
  return safeGet('/ShippingZones', {}, [])
}

export async function updateShippingZones(zonesData) {
  return axiosInstance.put('/ShippingZones', zonesData).then(r => r.data)
}

export async function getOwnerAnalytics(params = {}) {
  return safeGet('/Analytics/owner', params, {
    totalSales: 0,
    totalExpenses: 0,
    cogs: 0,
    netProfit: 0,
    totalOrders: 0
  })
}

export async function getShifts(params = {}) {
  return safeGet('/Shifts', params, [])
}

// ==========================================
// 4. تنبيهات نقص المخزون وإعادة التموين (Low Stock / Restock)
// ==========================================

/**
 * GET /api/inventory/low-stock
 * ترجع كل المنتجات التي وصلت (أو أقل من) الحد الأدنى المسموح به للمخزون.
 * متاحة للـ Owner و Admin و Moderator على مستوى الـ Back-end.
 */
export async function getLowStockProducts() {
  return safeGet('/Inventory/low-stock', {}, [])
}

/**
 * POST /api/inventory/adjust
 * تعديل سريع لكمية مخزون منتج معين (إضافة كمية جديدة بعد استلام توريد مثلاً).
 */
export async function adjustStock({ productId, quantity, quantityChange, warehouseId = 1, reason = 'إعادة تموين من لوحة التحكم' }) {
  const response = await axiosInstance.post('/Inventory/adjust', {
    productId: Number(productId),
    warehouseId: Number(warehouseId) || 1,
    quantityChange: Number(quantityChange ?? quantity) || 0,
    reason: reason || 'Other'
  })
  return response.data
}

export async function approveOrderCancellation(orderId) {
  const response = await axiosInstance.post(`/Orders/${orderId}/approve-cancel`)
  return response.data
}

// ==========================================
// 5. الحضور والانصراف بالبصمة الصوتية (Voice Biometric Attendance)
// ==========================================

/**
 * تسجيل بصمة صوت الموظف الحالي لأول مرة.
 * audioBlob: Blob قادم من MediaRecorder API.
 */
export async function enrollVoice(audioBlob, fileName = 'enroll.webm', userId = null) {
  const formData = new FormData()
  formData.append('audio', audioBlob, fileName)
  if (userId !== null && userId !== undefined) formData.append('userId', String(userId))

  const response = await axiosInstance.post('/attendance/enroll-voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

/**
 * إرسال تسجيل صوتي لتسجيل حضور أو انصراف الموظف صاحب الصوت.
 * الباك إند هو من يحدد إن كانت العملية Check-In أو Check-Out تلقائياً.
 */
export async function processVoiceAttendance(audioBlob, notes = '', fileName = 'attendance.webm') {
  const formData = new FormData()
  formData.append('audio', audioBlob, fileName)
  if (notes) {
    formData.append('notes', notes)
  }

  const response = await axiosInstance.post('/attendance/voice-check', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

/**
 * سجل الحضور والانصراف الكامل — متاح للأدمن فقط.
 * params: { from, to } بصيغة ISO date.
 */
export async function getAttendanceLogs(params = {}) {
  return safeGet('/attendance/logs', params, [])
}

export async function getEmployeeProfileSummary(userId, params = {}) {
  const response = await axiosInstance.get(`/Users/${userId}/profile-summary`, { params })
  return response.data
}

export async function updateEmployeeHourlyRate(userId, hourlyRate) {
  const response = await axiosInstance.patch(`/Users/${userId}/hourly-rate`, { hourlyRate: Number(hourlyRate) })
  return response.data
}

// ==========================================
// 6. الرواتب (Payroll) — للأدمن فقط
// ==========================================

/**
 * ملخص الرواتب لكل الموظفين خلال فترة زمنية محددة.
 * params: { startDate, endDate } بصيغة ISO date.
 */
export async function getPayrollSummary(params = {}) {
  return safeGet('/payroll/summary', params, [])
}

// ==========================================
// 7. الأوامر الصوتية (AI Voice Commands - فواتير وإدخال بيانات بالصوت)
// ==========================================

/**
 * يرسل نص الأمر الصوتي (بعد تحويله من صوت لنص عبر Web Speech API في المتصفح)
 * للباك إند ليقوم بتحليله وتنفيذه فعلياً (إنشاء فاتورة / إضافة منتج).
 * لا نستخدم safeGet هنا عمداً: عايزين رسالة الخطأ الحقيقية (مثلاً "منتج غير معروف")
 * توصل للمكوّن عشان نعرضها للكاشير.
 */
export async function sendVoiceCommand(text) {
  const response = await axiosInstance.post('/ai/voice-command', { text })
  return response.data
}