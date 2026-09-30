// File: src/api/invoicesApi.js
import axiosInstance from './axiosInstance'

export async function generateOrderInvoice(orderId, printFormat = 'a4') {
  const response = await axiosInstance.post('/invoices/from-order', { orderId, printFormat })
  return response.data
}

export async function generateMaintenanceInvoice(maintenanceRequestId, printFormat = 'a5') {
  const response = await axiosInstance.post('/invoices/from-maintenance', { maintenanceRequestId, printFormat })
  return response.data
}

export async function getInvoice(id) {
  const response = await axiosInstance.get(`/invoices/${id}`)
  return response.data
}

export async function shareInvoice(id, { viaWhatsApp = true, viaEmail = false } = {}) {
  const response = await axiosInstance.post(`/invoices/${id}/share`, { viaWhatsApp, viaEmail })
  return response.data
}

/** Authenticated download/view URL for the invoice's PDF — distinct from the token-signed public link WhatsApp/email fetch instead. */
export function getInvoiceDownloadUrl(id) {
  return `${axiosInstance.defaults.baseURL}/invoices/${id}/pdf`
}
