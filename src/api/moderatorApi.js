// File: src/api/moderatorApi.js
import axiosInstance from './axiosInstance'

/**
 * دالة حماية آمنة لمنع إلقاء أخطاء الـ 404 وتجنب توقف الصفحة
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

// 1. جلب المنتجات للموديريتور
export async function getModeratorProducts(params = {}) {
  return safeGet('/Products', {
    pageNumber: 1,
    pageSize: 1000,
    ...params,
  }, [])
}

// 2. جلب الأقسام
export async function getModeratorCategories() {
  return safeGet('/Categories', {}, [])
}

// 3. إضافة منتج جديد من الكتالوج
export async function createModeratorProduct(productData, imageFile) {
  const formData = new FormData()

  Object.keys(productData).forEach((key) => {
    if (productData[key] !== null && productData[key] !== undefined && productData[key] !== '') {
      formData.append(key, productData[key])
    }
  })

  if (imageFile) {
    formData.append('imageFile', imageFile)
  }

  const response = await axiosInstance.post('/Products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// 4. تعديل منتج من الكتالوج
export async function updateModeratorProduct(id, productData, imageFile) {
  const formData = new FormData()

  formData.append('id', id)
  Object.keys(productData).forEach((key) => {
    if (productData[key] !== null && productData[key] !== undefined && productData[key] !== '') {
      formData.append(key, productData[key])
    }
  })

  if (imageFile) {
    formData.append('imageFile', imageFile)
  }

  const response = await axiosInstance.put(`/Products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// 5. حذف منتج
export async function deleteModeratorProduct(id) {
  const response = await axiosInstance.delete(`/Products/${id}`)
  return response.data
}