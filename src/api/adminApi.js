// File: src/api/adminApi.js
import axiosInstance from './axiosInstance'

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

// ==========================================
// 2. إدارة الأقسام والعملاء
// ==========================================

export async function getCategories() {
  return safeGet('/Categories', {}, [])
}

export async function createCategory(categoryData) {
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