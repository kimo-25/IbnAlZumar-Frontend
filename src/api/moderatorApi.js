// File: src/api/moderatorApi.js
import axiosInstance from './axiosInstance'

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

// 1. جلب المنتجات للموديريتور بحسب الـ Pagination
export async function getModeratorProducts(params = {}) {
  return safeGet('/Products', params, [])
}

// 2. جلب الأقسام
export async function getModeratorCategories() {
  return safeGet('/Categories', {}, [])
}

// 3. إضافة منتج جديد
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

// 4. تعديل منتج
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