// File: src/api/maintenanceWorkflowApi.js
import axiosInstance from './axiosInstance'

export async function getMaintenanceTickets({ status, technicianId, pageNumber = 1, pageSize = 100 } = {}) {
  const response = await axiosInstance.get('/maintenance-workflow', {
    params: { status, technicianId, pageNumber, pageSize },
  })
  return response.data
}

export async function createMaintenanceTicket(payload) {
  const formData = new FormData()

  formData.append('Description', payload.Description)
  formData.append('DeliveryMethod', Number(payload.DeliveryMethod))

  if (payload.Image) formData.append('Image', payload.Image)
  if (payload.Images?.length > 1) {
    payload.Images.forEach((file) => formData.append('Images', file))
  }

  const response = await axiosInstance.post('/Maintenance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function getMaintenanceTicket(id) {
  const response = await axiosInstance.get(`/maintenance-workflow/${id}`)
  return response.data
}

export async function getTechnicians() {
  const response = await axiosInstance.get('/maintenance-workflow/technicians')
  return response.data
}

export async function assignTechnician(id, technicianUserId) {
  const response = await axiosInstance.post(`/maintenance-workflow/${id}/assign-technician`, { technicianUserId })
  return response.data
}

export async function changeMaintenanceStatus(id, newStatus, note) {
  const response = await axiosInstance.post(`/maintenance-workflow/${id}/status`, { newStatus, note })
  return response.data
}

export async function addMaintenanceNote(id, note) {
  const response = await axiosInstance.post(`/maintenance-workflow/${id}/notes`, { note })
  return response.data
}

export async function addMaintenancePartUsage(id, payload) {
  const response = await axiosInstance.post(`/maintenance-workflow/${id}/parts`, payload)
  return response.data
}

export async function removeMaintenancePartUsage(id, partUsageId) {
  const response = await axiosInstance.delete(`/maintenance-workflow/${id}/parts/${partUsageId}`)
  return response.data
}

export async function setMaintenanceLaborCost(id, laborCost) {
  const response = await axiosInstance.post(`/maintenance-workflow/${id}/labor-cost`, { laborCost })
  return response.data
}

export async function getMaintenanceReceipt(id) {
  const response = await axiosInstance.get(`/maintenance-workflow/${id}/receipt`)
  return response.data
}
