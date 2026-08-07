// File: src/api/reportsApi.js
import axiosInstance from './axiosInstance'

/** GET /api/Reports/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD */
export async function getSalesReport({ startDate, endDate }) {
  try {
    const res = await axiosInstance.get('/Reports/sales', { params: { startDate, endDate } })
    return res.data
  } catch (error) {
    console.warn('[Reports API] Failed to fetch sales report:', error)
    return []
  }
}

/** GET /api/Reports/inventory-status */
export async function getInventoryStatus() {
  try {
    const res = await axiosInstance.get('/Reports/inventory-status')
    return res.data
  } catch (error) {
    console.warn('[Reports API] Failed to fetch inventory status:', error)
    return []
  }
}