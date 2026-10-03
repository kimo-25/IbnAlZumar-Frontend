// File: src/api/ordersAdminApi.js
// كل نقاط الـ API الخاصة بعرض/تعديل الطلبات (مركز العمليات + صفحة العميل) في مكان واحد.
// ⚠️ العقد المفترض مع الباك إند (عدّله هنا فقط لو الـ routes مختلفة):
//   GET  /Orders/{id}          -> تفاصيل الطلب بالأصناف
//   PUT  /Orders/{id}          -> { status, paymentMethod, paidAmount, discountAmount, shippingCost, items:[{productId, productVariantId, quantity, unitPrice}] }
//   PUT  /Orders/{id}/payment  -> { paidAmount }   (السيرفر هو اللي يعدّل رصيد/مديونية العميل بفرق المدفوع)
import axiosInstance from './axiosInstance'

const unwrap = (res) => {
  const d = res?.data
  return d?.data ?? d?.Data ?? d
}

export function extractList(res) {
  if (Array.isArray(res)) return res
  return res?.items || res?.Items || res?.data || res?.Data || []
}

export async function fetchOrderById(id, options = {}) {
  const res = await axiosInstance.get(`/Orders/${id}`, options)
  return unwrap(res)
}

export async function fetchOrders(params = {}, options = {}) {
  const res = await axiosInstance.get('/Orders', { params, ...options })
  return unwrap(res)
}

export async function updateOrder(id, payload) {
  const res = await axiosInstance.put(`/Orders/${id}`, payload)
  return unwrap(res)
}

/** تعديل المبلغ المدفوع فقط. لو الـ route المخصص مش موجود (404/405) نرجع لـ PUT /Orders/{id}. */
export async function updateOrderPayment(id, paidAmount) {
  try {
    const res = await axiosInstance.put(`/Orders/${id}/payment`, { paidAmount })
    return unwrap(res)
  } catch (err) {
    const status = err?.response?.status
    if (status !== 404 && status !== 405) throw err
    const res = await axiosInstance.put(`/Orders/${id}`, { paidAmount })
    return unwrap(res)
  }
}