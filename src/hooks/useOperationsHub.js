import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getOnlineOrders, getLowStockProducts, adjustStock } from '../api/adminApi'
import axiosInstance from '../api/axiosInstance'
import { printInvoice } from '../utils/printInvoice'

export function useOperationsHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'orders'
  const [activeTab, setActiveTab] = useState(initialTab)

  // ---------- Orders ----------
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  // ---------- Maintenance requests ----------
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)
  const [maintenanceError, setMaintenanceError] = useState(null)
  const [selectedMaintenanceRequest, setSelectedMaintenanceRequest] = useState(null)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [maintenanceSaveError, setMaintenanceSaveError] = useState(null)

  // ---------- Shipping ----------
  const [shippingZones, setShippingZones] = useState([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [newZone, setNewZone] = useState({ name: '', price: '', estimatedDays: '' })
  const [addingZone, setAddingZone] = useState(false)

  // ---------- Pending custom zone requests ----------
  const [pendingZoneRequests, setPendingZoneRequests] = useState([])
  const [loadingZoneRequests, setLoadingZoneRequests] = useState(false)
  const [zoneRequestsError, setZoneRequestsError] = useState(null)
  const [processingZoneRequestId, setProcessingZoneRequestId] = useState(null)

  // ---------- Products & Pagination ----------
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage] = useState(1)
  const [productTotalPages, setProductTotalPages] = useState(1)
  const pageSize = 20

  // ---------- Restock ----------
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loadingLowStock, setLoadingLowStock] = useState(false)
  const [lowStockError, setLowStockError] = useState(null)
  const [restockingId, setRestockingId] = useState(null)

  // ---------- Toast ----------
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  // ================= Fetchers =================
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      setOrdersError(null)
      const data = await getOnlineOrders()
      const ordersList = Array.isArray(data) ? data : (data.$values || data.data || [])
      setOrders(ordersList)
    } catch (err) {
      console.error('فشل جلب الطلبات:', err)
      setOrdersError('حدث خطأ أثناء جلب قائمة الطلبات والعمليات.')
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      setLoadingMaintenance(true)
      setMaintenanceError(null)
      const res = await axiosInstance.get('/Maintenance')
      const list = Array.isArray(res.data) ? res.data : (res.data?.$values || res.data?.data || [])
      setMaintenanceRequests(list)
    } catch (err) {
      console.error('تعذر جلب طلبات الصيانة:', err)
      setMaintenanceError('حدث خطأ أثناء جلب طلبات الصيانة.')
    } finally {
      setLoadingMaintenance(false)
    }
  }, [])

  const fetchShippingZones = useCallback(async () => {
    try {
      setLoadingZones(true)
      const res = await axiosInstance.get('/ShippingZones')
      const data = res.data
      setShippingZones(Array.isArray(data) ? data : (data.$values || data.data || []))
    } catch (err) {
      console.error('فشل جلب مناطق الشحن:', err)
    } finally {
      setLoadingZones(false)
    }
  }, [])

  const fetchPendingZoneRequests = useCallback(async () => {
    try {
      setLoadingZoneRequests(true)
      setZoneRequestsError(null)
      const res = await axiosInstance.get('/ShippingZones/pending-requests')
      const data = res.data
      setPendingZoneRequests(Array.isArray(data) ? data : (data.$values || data.data || []))
    } catch (err) {
      console.error('فشل جلب طلبات المناطق الجديدة:', err)
      setZoneRequestsError('حدث خطأ أثناء جلب طلبات المناطق الجديدة.')
    } finally {
      setLoadingZoneRequests(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      const params = {
        pageNumber: productPage,
        pageSize: pageSize,
      }
      if (productSearch.trim()) {
        params.searchTerm = productSearch.trim()
      }

      const res = await axiosInstance.get('/Products', { params })
      const data = res.data
      const list = Array.isArray(data) ? data : (data.items || data.Items || data.$values || [])
      const total = Number(
        Array.isArray(data)
          ? data.length
          : (data.totalCount ?? data.TotalCount ?? data.count ?? list.length)
      )

      setProducts(list)
      setProductTotalPages(Math.max(1, Math.ceil(total / pageSize)))
    } catch (err) {
      console.error('فشل جلب المنتجات:', err)
      setProducts([])
      setProductTotalPages(1)
    } finally {
      setLoadingProducts(false)
    }
  }, [productPage, productSearch])

  const fetchLowStock = useCallback(async () => {
    try {
      setLoadingLowStock(true)
      setLowStockError(null)
      const data = await getLowStockProducts()
      const list = Array.isArray(data) ? data : (data?.$values || data?.data || [])
      setLowStockProducts(list)
    } catch (err) {
      console.error('فشل جلب تنبيهات نقص المخزون:', err)
      setLowStockError('حدث خطأ أثناء جلب قائمة المنتجات الناقصة.')
    } finally {
      setLoadingLowStock(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
    else if (activeTab === 'inquiries') fetchMaintenanceRequests()
    else if (activeTab === 'shipping') { fetchShippingZones(); fetchPendingZoneRequests() }
    else if (activeTab === 'products') fetchProducts()
    else if (activeTab === 'restock') fetchLowStock()
  }, [activeTab, fetchOrders, fetchMaintenanceRequests, fetchShippingZones, fetchPendingZoneRequests, fetchProducts, fetchLowStock])

  function handleTabChange(tab) {
    setActiveTab(tab)
    setSearchParams(tab !== 'orders' ? { tab } : {}, { replace: true })
  }

  function refreshActiveTab() {
    if (activeTab === 'orders') fetchOrders()
    else if (activeTab === 'inquiries') fetchMaintenanceRequests()
    else if (activeTab === 'shipping') { fetchShippingZones(); fetchPendingZoneRequests() }
    else if (activeTab === 'products') fetchProducts()
    else if (activeTab === 'restock') fetchLowStock()
  }

  // ================= Orders handlers =================
  async function handleUpdateStatus(orderId, newStatusValue) {
    if (!newStatusValue) return
    try {
      setProcessingId(orderId)
      const statusInt = parseInt(newStatusValue)
      try {
        await axiosInstance.put(`/Orders/${orderId}/status?status=${statusInt}`)
      } catch {
        await axiosInstance.put(`/Orders/${orderId}/status`, { status: statusInt })
      }
      await fetchOrders()
    } catch (err) {
      console.error('خطأ أثناء تغيير حالة الطلب:', err)
      alert('حدث خطأ أثناء تعديل حالة الطلب، يرجى إعادة المحاولة.')
    } finally {
      setProcessingId(null)
    }
  }

  function handlePrintInvoice(order) {
    if (!order) return
    const customerObj = order.customer || order.user || {
      fullName: order.customerName || order.fullName,
      phone: order.phone || order.customerPhone,
      email: order.customerEmail || order.email
    }
    printInvoice(order, customerObj, true)
  }

  // ================= Maintenance handlers =================
  function openMaintenanceReview(request) {
    setSelectedMaintenanceRequest(request)
    setMaintenanceSaveError(null)
    setIsMaintenanceModalOpen(true)
  }

  function closeMaintenanceReview() {
    setIsMaintenanceModalOpen(false)
    setSelectedMaintenanceRequest(null)
    setMaintenanceSaveError(null)
  }

  async function saveMaintenanceResponse(requestId, payload) {
    try {
      setSavingMaintenance(true)
      setMaintenanceSaveError(null)
      await axiosInstance.put(`/Maintenance/${requestId}/respond`, payload)
      closeMaintenanceReview()
      await fetchMaintenanceRequests()
      showToast('تم تحديث طلب الصيانة وإشعار العميل بنجاح.', 'success')
    } catch (err) {
      console.error('فشل تحديث طلب الصيانة:', err)
      const msg = err?.response?.data?.message || err?.message || 'حدث خطأ أثناء حفظ رد الصيانة.'
      setMaintenanceSaveError(msg)
      showToast(msg, 'error')
    } finally {
      setSavingMaintenance(false)
    }
  }

  // ================= Shipping handlers =================
  async function handleAddZone(e) {
    e.preventDefault()
    if (!newZone.name || !newZone.price) {
      alert('يرجى إدخال اسم المنطقة وسعر الشحن على الأقل.')
      return
    }
    try {
      setAddingZone(true)
      const costValue = parseFloat(newZone.price) || 0
      await axiosInstance.post('/ShippingZones', {
        name: newZone.name,
        governorate: newZone.name,
        shippingCost: costValue,
        shippingFee: costValue,
        estimatedDays: parseInt(newZone.estimatedDays || 1),
        isActive: true
      })
      setNewZone({ name: '', price: '', estimatedDays: '' })
      await fetchShippingZones()
    } catch (err) {
      console.error('فشل إضافة منطقة الشحن:', err)
      alert('حدث خطأ أثناء إضافة المنطقة.')
    } finally {
      setAddingZone(false)
    }
  }

  async function handleDeleteZone(id) {
    if (!window.confirm('هل أنت متأكد من حذف منطقة الشحن هذه؟')) return
    try {
      await axiosInstance.delete(`/ShippingZones/${id}`)
      await fetchShippingZones()
    } catch (err) {
      console.error('فشل حذف منطقة الشحن:', err)
      alert('حدث خطأ أثناء الحذف.')
    }
  }

  async function handleAcceptZoneRequest(orderId, zoneData) {
    try {
      setProcessingZoneRequestId(orderId)
      await axiosInstance.post(`/ShippingZones/requests/${orderId}/accept`, zoneData)
      await Promise.all([fetchShippingZones(), fetchPendingZoneRequests()])
      showToast('تم إنشاء منطقة الشحن وربطها بالطلب بنجاح.', 'success')
    } catch (err) {
      console.error('فشل قبول طلب المنطقة:', err)
      showToast(err?.message || 'حدث خطأ أثناء قبول طلب المنطقة.', 'error')
    } finally {
      setProcessingZoneRequestId(null)
    }
  }

  async function handleRejectZoneRequest(orderId, reason) {
    if (!window.confirm('هل أنت متأكد من رفض طلب المنطقة هذا؟')) return
    try {
      setProcessingZoneRequestId(orderId)
      await axiosInstance.post(`/ShippingZones/requests/${orderId}/reject`, { reason })
      await fetchPendingZoneRequests()
      showToast('تم رفض طلب المنطقة.', 'success')
    } catch (err) {
      console.error('فشل رفض طلب المنطقة:', err)
      showToast(err?.message || 'حدث خطأ أثناء رفض طلب المنطقة.', 'error')
    } finally {
      setProcessingZoneRequestId(null)
    }
  }

  // ================= Products handlers =================
  async function handleToggleProductVisibility(productId, newVisibility) {
    try {
      try {
        await axiosInstance.put(`/Products/${productId}/visibility`, { isPublished: newVisibility })
      } catch {
        await axiosInstance.patch(`/Products/${productId}`, { isPublished: newVisibility })
      }
      await fetchProducts()
    } catch (err) {
      console.error('فشل تعديل حالة ظهور المنتج:', err)
      alert('حدث خطأ أثناء تعديل حالة ظهور المنتج.')
    }
  }

  // ================= Restock handlers =================
  async function handleQuickRestock(productId, addedQuantity) {
    try {
      setRestockingId(productId)
      await adjustStock({
        productId,
        quantity: addedQuantity,
        reason: 'إعادة تموين سريع من مركز العمليات'
      })
      await fetchLowStock()
    } catch (err) {
      console.error('فشل تحديث كمية المخزون:', err)
      alert('حدث خطأ أثناء تحديث الكمية، يرجى إعادة المحاولة.')
    } finally {
      setRestockingId(null)
    }
  }

  return {
    activeTab, handleTabChange, refreshActiveTab,

    orders, loadingOrders, ordersError, processingId, handleUpdateStatus, handlePrintInvoice,

    maintenanceRequests, loadingMaintenance, maintenanceError,
    selectedMaintenanceRequest, isMaintenanceModalOpen, savingMaintenance, maintenanceSaveError,
    openMaintenanceReview, closeMaintenanceReview, saveMaintenanceResponse,

    shippingZones, loadingZones, newZone, setNewZone, addingZone, handleAddZone, handleDeleteZone,

    pendingZoneRequests, loadingZoneRequests, zoneRequestsError, processingZoneRequestId,
    handleAcceptZoneRequest, handleRejectZoneRequest,

    products, loadingProducts, productSearch, setProductSearch, handleToggleProductVisibility,
    productPage, setProductPage, productTotalPages,

    lowStockProducts, loadingLowStock, lowStockError, fetchLowStock, handleQuickRestock, restockingId,

    toast
  }
}