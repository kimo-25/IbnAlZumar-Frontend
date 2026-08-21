// File: src/api/inventoryApi.js
import axiosInstance from './axiosInstance'

/** GET /api/Inventory/warehouses */
export async function getWarehouses() {
  try {
    const res = await axiosInstance.get('/Inventory/warehouses')
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch warehouses:', error)
    return []
  }
}

/** GET /api/Inventory/stock-levels?warehouseId=&search= */
export async function getStockLevels({ warehouseId, search } = {}) {
  try {
    const params = {}
    if (warehouseId) params.warehouseId = warehouseId
    if (search) params.search = search
    const res = await axiosInstance.get('/Inventory/stock-levels', { params })
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch stock levels:', error)
    return []
  }
}

/** GET /api/Inventory/low-stock */
export async function getLowStockProducts() {
  try {
    const res = await axiosInstance.get('/Inventory/low-stock')
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch low-stock products:', error)
    return []
  }
}

/** GET /api/Inventory/transactions?productId=&warehouseId=&take= */
export async function getTransactionHistory({ productId, warehouseId, take = 100 } = {}) {
  try {
    const params = { take }
    if (productId) params.productId = productId
    if (warehouseId) params.warehouseId = warehouseId
    const res = await axiosInstance.get('/Inventory/transactions', { params })
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch transaction history:', error)
    return []
  }
}

/** POST /api/Inventory/adjust */
export async function adjustStock({ productId, warehouseId, quantityChange, reason, notes }) {
  const response = await axiosInstance.post('/Inventory/adjust', {
    productId,
    warehouseId,
    quantityChange,
    reason,
    notes
  })
  return response.data
}

/** POST /api/Inventory/transfer */
export async function transferStock({ fromWarehouseId, toWarehouseId, notes, items }) {
  const response = await axiosInstance.post('/Inventory/transfer', {
    fromWarehouseId,
    toWarehouseId,
    notes,
    items
  })
  return response.data
}
