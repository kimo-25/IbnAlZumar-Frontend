// File: src/api/debtApi.js
import axiosInstance from './axiosInstance'

export async function getDebtDashboard({ pageNumber = 1, pageSize = 30 } = {}) {
  const response = await axiosInstance.get('/customer-debt', { params: { pageNumber, pageSize } })
  return response.data
}

export async function sendDebtReminderNow(customerId) {
  const response = await axiosInstance.post(`/customer-debt/${customerId}/send-reminder`)
  return response.data
}
