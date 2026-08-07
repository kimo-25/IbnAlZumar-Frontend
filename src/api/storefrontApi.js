// File: src/api/storefrontApi.js
import axiosInstance from './axiosInstance'

/**
 * جلب قائمة المنتجات مع إمكانية التصفية والبحث
 * @param {Object} params - معاملات البحث والتصنيف والفلترة
 */
export async function getProducts(params = {}) {
  const response = await axiosInstance.get('/Products', { params })
  return response.data
}

/**
 * جلب تفاصيل منتج محدد عبر معرف الصنف (ID)
 * @param {Number|String} id 
 */
export async function getProductById(id) {
  const response = await axiosInstance.get(`/Products/${id}`)
  return response.data
}

/**
 * جلب قائمة التصنيفات والأقسام المتاحة بالمتجر
 */
export async function getCategories() {
  const response = await axiosInstance.get('/Categories')
  return response.data
}

/**
 * إنشاء وإرسال طلب جديد (للعملاء والزوار)
 * @param {Object} orderData - بيانات الطلب والمنتجات وعنوان الشحن
 * @param {String} [token] - توكن المصادقة اختياري (JWT)
 */
export async function createGuestOrder(orderData, token = null) {
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await axiosInstance.post('/Orders', orderData, { headers })
  return response.data
}