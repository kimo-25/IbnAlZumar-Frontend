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

// ==========================================
// 1. إدارة المنتجات للموديريتور
// ==========================================

export async function getModeratorProducts(params = {}) {
  return safeGet('/Products', params, [])
}

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

export async function deleteModeratorProduct(id) {
  const response = await axiosInstance.delete(`/Products/${id}`)
  return response.data
}

// ==========================================
// 2. إدارة الأقسام للموديريتور
// ==========================================

export async function getModeratorCategories() {
  return safeGet('/Categories', {}, [])
}

export async function createModeratorCategory(categoryData) {
  const response = await axiosInstance.post('/Categories', categoryData)
  return response.data
}

export async function updateModeratorCategory(id, categoryData) {
  const response = await axiosInstance.put(`/Categories/${id}`, categoryData)
  return response.data
}

export async function deleteModeratorCategory(id) {
  const response = await axiosInstance.delete(`/Categories/${id}`)
  return response.data
}