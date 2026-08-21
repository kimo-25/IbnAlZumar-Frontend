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
  // استخدام التوكن المُمرر أو جلبه تلقائياً من الـ localStorage كاحتياطي إضافي
  const activeToken = token || localStorage.getItem('token')
  const headers = {}
  
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`
  }

  const response = await axiosInstance.post('/Orders', orderData, { headers })
  return response.data
}

/**
 * إرسال طلب إلغاء لطلب معين
 * @param {Number|String} orderId - معرف الطلب المراد إلغاؤه
 * @param {String} reason - سبب الإلغاء
 */
export async function requestOrderCancellation(orderId, reason) {
  console.log('REQUEST-CANCEL CALLED')
  
  const response = await axiosInstance.post(
    `/Orders/${orderId}/request-cancel`,
    JSON.stringify(reason),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  )
  
  return response.data
}