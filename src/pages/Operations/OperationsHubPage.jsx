// File: src/pages/Operations/OperationsHubPage.jsx  (ضعه مكان الملف الحالي)
import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Package, HelpCircle, Truck, Eye, AlertTriangle, CheckCircle2, XCircle, Store, Globe } from 'lucide-react'
import { useOperationsHub } from '../../hooks/useOperationsHub'
import OrdersTab from '../../components/operations/OrdersTab'
import OrdersByDayTab from '../../components/operations/OrdersByDayTab'
import MaintenanceInquiriesTab from '../../components/operations/MaintenanceInquiriesTab'
import MaintenanceResponseModal from '../../components/operations/MaintenanceResponseModal'
import ShippingTab from '../../components/operations/ShippingTab'
import ProductsVisibilityTab from '../../components/operations/ProductsVisibilityTab'
import RestockTab from '../../components/operations/RestockTab'

function TabButton({ active, onClick, icon: Icon, label, tone = 'emerald', badge }) {
  const activeBg = tone === 'rose' ? 'bg-rose-600' : 'bg-emerald-600'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
        active ? `${activeBg} text-white shadow-xs` : 'bg-surface text-ink-soft hover:text-ink'
      }`}
    >
      <Icon size={15} />
      <span>{label}</span>
      {badge > 0 && (
        <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function OperationsHubPage() {
  const hub = useOperationsHub()

  // 'pos' | 'online' = تبويبات الطلبات الجديدة (مستقلة بتاريخها)، 'hub' = باقي التبويبات القديمة اللي يديرها useOperationsHub
  const [view, setView] = useState('pos')
  const [refreshKey, setRefreshKey] = useState(0)
  const [localToast, setLocalToast] = useState(null)
  const toastTimer = useRef(null)

  const showLocalToast = useCallback((type, message) => {
    setLocalToast({ type, message })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setLocalToast(null), 4000)
  }, [])

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), [])

  const openHubTab = (tab) => {
    setView('hub')
    hub.handleTabChange(tab)
  }
  const isHubTab = (tab) => view === 'hub' && hub.activeTab === tab

  const handleRefresh = () => {
    if (view === 'hub') hub.refreshActiveTab()
    else setRefreshKey((n) => n + 1)
  }

  const toast = localToast || hub.toast

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">مركز عمليات متجر ابن الزمر</h1>
          <p className="text-xs text-ink-soft mt-1">إدارة طلبات المحل والأونلاين، طلبات الصيانة، ومناطق الشحن والظهور</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <TabButton active={view === 'pos'} onClick={() => setView('pos')} icon={Store} label="طلبات المحل (الكاشير)" />
        <TabButton active={view === 'online'} onClick={() => setView('online')} icon={Globe} label="طلبات الأونلاين والتوصيل" />
        {/* التبويب القديم محفوظ كاحتياطي — احذفه بعد التأكد من التبويبين الجديدين */}
        <TabButton active={isHubTab('orders')} onClick={() => openHubTab('orders')} icon={Package} label="كل الطلبات (السابق)" />
        <TabButton active={isHubTab('inquiries')} onClick={() => openHubTab('inquiries')} icon={HelpCircle} label="طلبات الصيانة" />
        <TabButton active={isHubTab('shipping')} onClick={() => openHubTab('shipping')} icon={Truck} label="إدارة مناطق الشحن" />
        <TabButton active={isHubTab('products')} onClick={() => openHubTab('products')} icon={Eye} label="ظهور المنتجات" />
        <TabButton
          active={isHubTab('restock')}
          onClick={() => openHubTab('restock')}
          icon={AlertTriangle}
          label="تنبيهات النواقص والتموين"
          tone="rose"
          badge={hub.lowStockProducts.length}
        />
      </div>

      {view === 'pos' && <OrdersByDayTab key="pos" kind="pos" refreshKey={refreshKey} onToast={showLocalToast} />}
      {view === 'online' && <OrdersByDayTab key="online" kind="online" refreshKey={refreshKey} onToast={showLocalToast} />}

      {isHubTab('orders') && (
        <OrdersTab
          orders={hub.orders}
          loading={hub.loadingOrders}
          error={hub.ordersError}
          processingId={hub.processingId}
          onUpdateStatus={hub.handleUpdateStatus}
          onPrintInvoice={hub.handlePrintInvoice}
        />
      )}

      {isHubTab('inquiries') && (
        <MaintenanceInquiriesTab
          requests={hub.maintenanceRequests}
          loading={hub.loadingMaintenance}
          error={hub.maintenanceError}
          onReview={hub.openMaintenanceReview}
        />
      )}

      {isHubTab('shipping') && (
        <ShippingTab
          zones={hub.shippingZones}
          loading={hub.loadingZones}
          adding={hub.addingZone}
          newZone={hub.newZone}
          setNewZone={hub.setNewZone}
          onAddZone={hub.handleAddZone}
          onDeleteZone={hub.handleDeleteZone}
          pendingZoneRequests={hub.pendingZoneRequests}
          loadingZoneRequests={hub.loadingZoneRequests}
          processingZoneRequestId={hub.processingZoneRequestId}
          onAcceptRequest={hub.handleAcceptZoneRequest}
          onRejectRequest={hub.handleRejectZoneRequest}
        />
      )}

      {isHubTab('products') && (
        <ProductsVisibilityTab
          products={hub.products}
          loading={hub.loadingProducts}
          searchTerm={hub.productSearch}
          setSearchTerm={hub.setProductSearch}
          onToggleVisibility={hub.handleToggleProductVisibility}
          currentPage={hub.productPage}
          totalPages={hub.productTotalPages}
          onPageChange={hub.setProductPage}
        />
      )}

      {isHubTab('restock') && (
        <RestockTab
          products={hub.lowStockProducts}
          loading={hub.loadingLowStock}
          error={hub.lowStockError}
          onRefresh={hub.fetchLowStock}
          onQuickRestock={hub.handleQuickRestock}
          restockingId={hub.restockingId}
        />
      )}

      {hub.isMaintenanceModalOpen && (
        <MaintenanceResponseModal
          request={hub.selectedMaintenanceRequest}
          onClose={hub.closeMaintenanceReview}
          onSave={hub.saveMaintenanceResponse}
          saving={hub.savingMaintenance}
          error={hub.maintenanceSaveError}
        />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-[80] flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}