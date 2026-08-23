// File: src/pages/Operations/OperationsHubPage.jsx
import { Link } from 'react-router-dom'
import { RefreshCw, Package, HelpCircle, Truck, Eye, AlertTriangle, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react'
import { useOperationsHub } from '../../hooks/useOperationsHub'
import OrdersTab from '../../components/operations/OrdersTab'
import MaintenanceInquiriesTab from '../../components/operations/MaintenanceInquiriesTab'
import MaintenanceResponseModal from '../../components/operations/MaintenanceResponseModal'
import ShippingTab from '../../components/operations/ShippingTab'
import ProductsVisibilityTab from '../../components/operations/ProductsVisibilityTab'
import RestockTab from '../../components/operations/RestockTab'

export default function OperationsHubPage() {
  const hub = useOperationsHub()

  return (
    <div className="space-y-6 p-4 sm:p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">مركز عمليات متجر ابن الزمر</h1>
          <p className="text-xs text-ink-soft mt-1">
            إدارة الطلبات المباشرة، طلبات الصيانة، ومناطق الشحن والظهور
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products/import"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>استيراد منتجات بالإكسيل</span>
          </Link>
          <button
            type="button"
            onClick={hub.refreshActiveTab}
            className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => hub.handleTabChange('orders')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            hub.activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Package size={15} />
          <span>الطلبات والأونلاين</span>
        </button>

        <button
          type="button"
          onClick={() => hub.handleTabChange('inquiries')}
          className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            hub.activeTab === 'inquiries' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <HelpCircle size={15} />
          <span>طلبات الصيانة</span>
        </button>

        <button
          type="button"
          onClick={() => hub.handleTabChange('shipping')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            hub.activeTab === 'shipping' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Truck size={15} />
          <span>إدارة مناطق الشحن</span>
        </button>

        <button
          type="button"
          onClick={() => hub.handleTabChange('products')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            hub.activeTab === 'products' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <Eye size={15} />
          <span>ظهور المنتجات</span>
        </button>

        <button
          type="button"
          onClick={() => hub.handleTabChange('restock')}
          className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            hub.activeTab === 'restock' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          <AlertTriangle size={15} />
          <span>تنبيهات النواقص والتموين</span>
          {hub.lowStockProducts.length > 0 && (
            <span
              className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                hub.activeTab === 'restock' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {hub.lowStockProducts.length}
            </span>
          )}
        </button>
      </div>

      {hub.activeTab === 'orders' && (
        <OrdersTab
          orders={hub.orders}
          loading={hub.loadingOrders}
          error={hub.ordersError}
          processingId={hub.processingId}
          onUpdateStatus={hub.handleUpdateStatus}
          onPrintInvoice={hub.handlePrintInvoice}
        />
      )}

      {hub.activeTab === 'inquiries' && (
        <MaintenanceInquiriesTab
          requests={hub.maintenanceRequests}
          loading={hub.loadingMaintenance}
          error={hub.maintenanceError}
          onReview={hub.openMaintenanceReview}
        />
      )}

      {hub.activeTab === 'shipping' && (
        <ShippingTab
          zones={hub.shippingZones}
          loading={hub.loadingZones}
          adding={hub.addingZone}
          newZone={hub.newZone}
          setNewZone={hub.setNewZone}
          onAddZone={hub.handleAddZone}
          onDeleteZone={hub.handleDeleteZone}
        />
      )}

      {hub.activeTab === 'products' && (
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

      {hub.activeTab === 'restock' && (
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

      {hub.toast && (
        <div
          className={`fixed bottom-6 left-6 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl ${
            hub.toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {hub.toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{hub.toast.message}</span>
        </div>
      )}
    </div>
  )
}