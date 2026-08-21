// File: src/api/reportsApi.js
import axiosInstance from './axiosInstance'

/** GET /api/Reports/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD */
export async function getSalesReport({ startDate, endDate } = {}) {
  try {
    const res = await axiosInstance.get('/Reports/sales', { params: { startDate, endDate } })
    return res.data
  } catch (error) {
    console.warn('[Reports API] Failed to fetch sales report:', error)
    return null
  }
}

/** GET /api/Reports/inventory-status */
export async function getInventoryStatus() {
  try {
    const res = await axiosInstance.get('/Reports/inventory-status')
    return res.data
  } catch (error) {
    console.warn('[Reports API] Failed to fetch inventory status:', error)
    return null
  }
}

/** GET /api/Reports/financial?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD */
export async function getFinancialReport({ startDate, endDate } = {}) {
  try {
    const res = await axiosInstance.get('/Reports/financial', { params: { startDate, endDate } })
    return res.data
  } catch (error) {
    console.warn('[Reports API] Failed to fetch financial report:', error)
    return null
  }
}

/** GET /api/Reports/top-sellers?startDate=&endDate=&take= */
export async function getTopSellers({ startDate, endDate, take = 10 } = {}) {
  try {
    const res = await axiosInstance.get('/Reports/top-sellers', { params: { startDate, endDate, take } })
    return res.data
  } catch (error) {
    console.warn('[Reports API] Failed to fetch top sellers:', error)
    return []
  }
}
