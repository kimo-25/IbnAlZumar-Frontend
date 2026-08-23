// File: src/api/purchasingApi.js
import axiosInstance from './axiosInstance'

// ---------------- Suppliers ----------------

export async function getSuppliers() {
  try {
    const res = await axiosInstance.get('/Purchasing/suppliers')
    return res.data
  } catch (error) {
    console.warn('[Purchasing API] Failed to fetch suppliers:', error)
    return []
  }
}

export async function createSupplier(supplierData) {
  const response = await axiosInstance.post('/Purchasing/suppliers', supplierData)
  return response.data
}

export async function updateSupplier(id, supplierData) {
  const response = await axiosInstance.put(`/Purchasing/suppliers/${id}`, supplierData)
  return response.data
}

export async function deleteSupplier(id) {
  const response = await axiosInstance.delete(`/Purchasing/suppliers/${id}`)
  return response.data
}

// ---------------- Purchase Orders ----------------

export async function getPurchaseOrders() {
  try {
    const res = await axiosInstance.get('/Purchasing/orders')
    return res.data
  } catch (error) {
    console.warn('[Purchasing API] Failed to fetch purchase orders:', error)
    return []
  }
}

export async function createPurchaseOrder(orderData) {
  const response = await axiosInstance.post('/Purchasing/orders', orderData)
  return response.data
}

export async function receivePurchaseOrder(purchaseOrderId, receivedDate = new Date().toISOString()) {
  const response = await axiosInstance.post('/Purchasing/orders/receive', {
    purchaseOrderId,
    receivedDate
  })
  return response.data
}

// ---------------- Supplier Ledger & Payments ----------------

export async function getSupplierDetails(supplierId) {
  try {
    const res = await axiosInstance.get(`/Purchasing/suppliers/${supplierId}`)
    return res.data
  } catch (error) {
    console.warn('[Purchasing API] Failed to fetch supplier details:', error)
    return null
  }
}

export async function getSupplierLedger(supplierId) {
  try {
    const res = await axiosInstance.get(`/Purchasing/suppliers/${supplierId}/ledger`)
    return res.data
  } catch (error) {
    console.warn('[Purchasing API] Failed to fetch supplier ledger:', error)
    return []
  }
}

export async function createSupplierPayment(supplierId, data) {
  const response = await axiosInstance.post(`/Purchasing/suppliers/${supplierId}/payments`, data)
  return response.data
}