import React from 'react'
import {
  Package,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  XCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'

// الفانكشنز المساعدة للعمل بشكل مجرد وثابت
const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString('ar-EG')} ج.م`

const calculateShippingCost = (gov) => {
  if (!gov) return 50
  const lowerGov = gov.toLowerCase()
  if (lowerGov.includes('القاهرة') || lowerGov.includes('الجيزة')) return 40
  if (lowerGov.includes('الإسكندرية') || lowerGov.includes('الاسكندرية')) return 30
  return 60
}

const getStepNumber = (status) => {
  const statusMap = {
    Pending: 1,
    Processing: 2,
    Shipped: 3,
    OutForDelivery: 4,
    Delivered: 5,
    Cancelled: 0
  }
  return statusMap[status] ?? 1
}

const getStatusBadge = (status) => {
  const map = {
    Pending: { label: 'قيد الانتظار', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', iconName: 'clock' },
    Processing: { label: 'جاري التحضير', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', iconName: 'clock' },
    Shipped: { label: 'تم الشحن', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800', iconName: 'clock' },
    Delivered: { label: 'تم التسليم', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', iconName: 'success' },
    Cancelled: { label: 'ملغي', className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800', iconName: 'cancel' },
  }
  return map[status] || { label: status || 'غير معروف', className: 'bg-gray-50 text-gray-700 border-gray-200', iconName: 'clock' }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'تاريخ غير محدد'
  return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OrderCard({
  order,
  isExpanded,
  onToggle,
  onCancel,
  cancelingOrderId,
  onOpenReview,
  userInfo,
  onPrintInvoice
}) {
  const orderId = order?.id ?? order?.orderNumber

  const currentStep = getStepNumber(order?.status)

  const items = order?.items || order?.orderItems || []

  const badge = getStatusBadge(
    order?.statusText || order?.status
  )

  let StatusIcon = Clock

  if (badge?.iconName === 'cancel') {
    StatusIcon = XCircle
  }

  if (badge?.iconName === 'success') {
    StatusIcon = CheckCircle2
  }

  const shippingCost =
    order?.shippingCost ??
    calculateShippingCost(
      order?.governorate || userInfo?.governorate
    )

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-all duration-200 shadow-xs">
      {/* Header Info */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <div>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
              رقم الطلب
            </span>
            <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
              {order?.orderNumber || `#${order?.id}`}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
              التاريخ
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(order?.createdAt || order?.orderDate)}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
              الإجمالي الكلي
            </span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                order?.totalAmount || order?.totalPrice || order?.total || 0
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge?.className}`}
          >
            <StatusIcon size={14} />
            {badge?.label}
          </span>

          <button
            type="button"
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
            aria-label={isExpanded ? 'إغلاق التفاصيل' : 'عرض التفاصيل'}
          >
            {isExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b dark:border-gray-700 pb-4">
            {order?.status === 'Pending' && (
              <button
                type="button"
                onClick={() => onCancel(orderId)}
                disabled={cancelingOrderId === orderId}
                className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition disabled:opacity-50 cursor-pointer"
              >
                {cancelingOrderId === orderId ? 'جاري الإلغاء...' : 'إلغاء الطلب'}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const fullOrderData = {
                  ...order,
                  items,
                  shippingCost
                }

                const fullUserData = {
                  ...userInfo,
                  email: userInfo?.email || order?.email
                }

                onPrintInvoice(fullOrderData, fullUserData)
              }}
              className="flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-gray-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition cursor-pointer shadow-xs mr-auto"
            >
              <Package size={16} />
              عرض واستخراج الفاتورة
            </button>
          </div>

          {items.length > 0 && (
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white mb-3 block">
                منتجات الطلب ({items.length})
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item, idx) => {
                  const itemImage =
                    item.imageUrl ||
                    item.image ||
                    item.productImageUrl ||
                    item.productImage ||
                    item.product?.imageUrl

                  return (
                    <div
                      key={
                        item.id ||
                        item.productId ||
                        `item-${idx}`
                      }
                      className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-700 p-3 border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-600 shrink-0 overflow-hidden">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.productName || item.name || 'منتج'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package
                              size={20}
                              className="text-amber-500"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {item.productName ||
                              item.name ||
                              'منتج'}
                          </p>

                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                            الكمية: {item.quantity || 1} ×{' '}
                            {formatCurrency(
                              item.unitPrice ||
                                item.price ||
                                0
                            )}
                          </p>
                        </div>
                      </div>

                      {/* زر إضافة التقييم متاح فقط عند إتمام التسليم */}
                      {(order?.status === 'Delivered' || currentStep === 5) &&
                        (item.canReview ?? !item.hasReviewed) && (
                          <button
                            type="button"
                            onClick={() => onOpenReview(item)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shrink-0 cursor-pointer"
                          >
                            <Star
                              size={12}
                              className="fill-emerald-600 text-emerald-600"
                            />
                            أضف تقييماً
                          </button>
                        )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white dark:bg-gray-700 p-3.5 flex items-center gap-2 text-xs text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600">
              <MapPin
                size={16}
                className="text-emerald-600 shrink-0"
              />
              <span className="font-bold shrink-0">
                عنوان التوصيل:
              </span>
              <span className="truncate text-gray-500 dark:text-gray-400">
                {order?.shippingAddress ||
                  userInfo?.address ||
                  'العنوان المسجل بالحساب'}
              </span>
            </div>

            <div className="rounded-xl bg-white dark:bg-gray-700 p-3.5 flex items-center justify-between text-xs text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600">
              <span className="font-bold">
                تكلفة الشحن:
              </span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(shippingCost)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}