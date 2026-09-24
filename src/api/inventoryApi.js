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

/**
 * Sheet 1: same rows as getWarehouses(), but guaranteed to carry Tier/ParentWarehouseId in a
 * parent-first order so the frontend can build the MainCentral -> RegionalBranch -> PosShelfLocation
 * tree without extra sorting.
 * GET /api/Inventory/warehouses/hierarchy
 */
export async function getWarehouseHierarchy() {
  try {
    const res = await axiosInstance.get('/Inventory/warehouses/hierarchy')
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch warehouse hierarchy:', error)
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

// ================= Sheet 1: Product Batches & FEFO =================

/**
 * Registers a new incoming batch and increases stock atomically (purchase receipt,
 * or an "Opening Balance" legacy stock entry when supplierId = 999999).
 * POST /api/Inventory/batches/receive
 * @param {{ productId:number, warehouseId:number, batchNumber:string, supplierId?:number|null,
 *   productionDate?:string|null, expiryDate:string, quantity:number, costPrice:number,
 *   transactionType?:string, referenceType?:string|null, referenceId?:number|null, notes?:string }} dto
 */
export async function receiveBatch(dto) {
  const response = await axiosInstance.post('/Inventory/batches/receive', dto)
  return response.data
}

/**
 * Consumes stock FEFO (First-Expired-First-Out) across whatever batches exist for the
 * product/warehouse. Returns an array of BatchConsumptionResultDto — one row per batch drawn from.
 * POST /api/Inventory/batches/consume-fefo
 * @param {{ productId:number, warehouseId:number, quantity:number, transactionType?:string,
 *   referenceType?:string|null, referenceId?:number|null, notes?:string }} dto
 */
export async function consumeBatchFefo(dto) {
  const response = await axiosInstance.post('/Inventory/batches/consume-fefo', dto)
  return response.data
}

/**
 * GET /api/Inventory/batches?productId=&warehouseId=&includeDepleted=
 * @param {{ productId?:number, warehouseId?:number, includeDepleted?:boolean }} params
 */
export async function getBatches({ productId, warehouseId, includeDepleted = false } = {}) {
  try {
    const params = { includeDepleted }
    if (productId) params.productId = productId
    if (warehouseId) params.warehouseId = warehouseId
    const res = await axiosInstance.get('/Inventory/batches', { params })
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch batches:', error)
    return []
  }
}

/**
 * GET /api/Inventory/batches/expiring?withinDays=&warehouseId=
 * @param {number} withinDays defaults to 30 (matches the backend's own default)
 * @param {number|null} warehouseId optional filter
 */
export async function getExpiringBatches(withinDays = 30, warehouseId = null) {
  try {
    const params = { withinDays }
    if (warehouseId) params.warehouseId = warehouseId
    const res = await axiosInstance.get('/Inventory/batches/expiring', { params })
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch expiring batches:', error)
    return []
  }
}

// ================= Sheet 1: Unit Conversion (piece/box/carton) =================
// ⚠ ASSUMPTION: these two endpoints do NOT exist in the backend yet — Sheet 1's backend delivery
// only added the `UnitConversion` entity + EF configuration, no controller/service. Add, on the
// server, something like:
//   GET /api/products/{productId}/unit-conversions      -> List<UnitConversionDto>
//   PUT /api/products/{productId}/unit-conversions       -> replaces the full set, body: UnitConversionDto[]
// `ProductUnitConversionModal` below is written to work without them too (parent-owned local state),
// so the UI isn't blocked on this — wire these up once the backend exists, or delete them if you
// decide unit conversions should be saved as part of the regular product create/update payload instead.

/** GET /api/Products/{productId}/unit-conversions */
export async function getProductUnitConversions(productId) {
  try {
    const res = await axiosInstance.get(`/Products/${productId}/unit-conversions`)
    return res.data
  } catch (error) {
    console.warn('[Inventory API] Failed to fetch unit conversions:', error)
    return []
  }
}

/**
 * PUT /api/Products/{productId}/unit-conversions
 * @param {number} productId
 * @param {{ fromUnit:string, toUnit:string, factor:number, isBaseUnit:boolean }[]} conversions
 */
export async function saveProductUnitConversions(productId, conversions) {
  const response = await axiosInstance.put(`/Products/${productId}/unit-conversions`, conversions)
  return response.data
}