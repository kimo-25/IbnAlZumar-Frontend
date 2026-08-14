// File: src/pages/Customer/CustomerProfilePage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Clock,
  AlertCircle,
  Loader2,
  User,
  Package,
  CheckCircle2,
  Phone,
  MapPin,
  Building2,
  Star,
  Check,
  XCircle,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  RotateCcw,
  Ban
} from 'lucide-react'
import Card from '../../components/ui/Card'
import axiosInstance from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/catalog'
import { useAuth } from '../../context/AuthContext'

// مراحل تتبع الطلب (5 مراحل)
const TRACKING_STEPS = [
  { step: 1, label: 'قيد المراجعة' },
  { step: 2, label: 'تم التأكيد' },
  { step: 3, label: 'جاري التجهيز' },
  { step: 4, label: 'في الطريق إليك' },
  { step: 5, label: 'تم التوصيل بنجاح' }
]

// تحويل حالة الطلب القادمة من الـ Backend إلى رقم المرحلة
function getStepNumber(status) {
  if (status === null || status === undefined) return 1

  if (typeof status === 'number') {
    if (status === -1) return -1
    if (status >= 0 && status <= 4) return status + 1
    if (status >= 1 && status <= 5) return status
    return 1
  }

  const s = String(status).toLowerCase().trim()
  if (s.includes('cancel') || s.includes('ملغ') || s.includes('reject')) return -1
  if (s.includes('pending') || s.includes('مراجعة') || s.includes('انتظار')) return 1
  if (s.includes('confirm') || s.includes('تأكيد') || s.includes('مؤكد')) return 2
  if (s.includes('prep') || s.includes('process') || s.includes('تجهيز')) return 3
  if (s.includes('ship') || s.includes('way') || s.includes('طريق') || s.includes('شحن')) return 4
  if (s.includes('complet') || s.includes('deliver') || s.includes('تم') || s.includes('مكتمل') || s.includes('توصيل')) return 5
  
  return 1
}

// دالة تنسيق حالة الطلب ولونها والشارة الخاصة بها
function getStatusBadge(status) {
  const step = getStepNumber(status)
  if (step === -1) {
    return {
      label: 'تم إلغاء الطلب',
      className: 'bg-rose-50 text-rose-700 border border-rose-200',
      icon: XCircle
    }
  }
  if (step === 5) {
    return {
      label: 'تم التوصيل بنجاح',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: CheckCircle2
    }
  }
  
  const label = TRACKING_STEPS[step - 1]?.label || 'قيد المراجعة'

  return {
    label,
    className: 'bg-amber-50 text-amber-800 border border-amber-200',
    icon: Clock
  }
}

export default function CustomerProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const activeTab = searchParams.get('tab') === 'profile' ? 'profile' : 'orders'

  const handleTabChange = (tab) => {
    setSearchParams({ tab })
  }

  const { user: authUser, updateUser: updateAuthUser } = useAuth()
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    governorate: '',
    address: ''
  })
  
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [ordersError, setOrdersError] = useState(null)
  
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState(null)
  const [expandedOrders, setExpandedOrders] = useState({})
  const [cancelingOrderId, setCancelingOrderId] = useState(null)

  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    item: null,
    rating: 5,
    comment: '',
    submitting: false,
    successMsg: null,
    errorMsg: null
  })

  // جلب بيانات الحساب الشخصي من الـ Backend مباشرة عند التحميل
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await axiosInstance.get('/Auth/profile')
        if (response.data) {
          const fetched = response.data
          setUser({
            fullName: fetched.fullName || fetched.name || authUser?.fullName || '',
            email: fetched.email || authUser?.email || '',
            phone: fetched.phone || authUser?.phone || '',
            governorate: fetched.governorate || authUser?.governorate || '',
            address: fetched.address || authUser?.address || ''
          })
        }
      } catch (err) {
        console.error('فشل جلب بيانات الحساب من الخادم، يتم استخدام البيانات المحلية', err)
        if (authUser) {
          setUser({
            fullName: authUser.fullName || authUser.name || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            governorate: authUser.governorate || '',
            address: authUser.address || ''
          })
        }
      }
    }
    fetchProfile()
  }, [authUser])

  // جلب الطلبات
  useEffect(() => {
    fetchCustomerOrders()
  }, [])

  async function fetchCustomerOrders() {
    setLoadingOrders(true)
    setOrdersError(null)
    try {
      const response = await axiosInstance.get('/Orders/my-orders')
      const data = Array.isArray(response.data) ? response.data : []
      setOrders(data)
      if (data.length > 0) {
        const firstId = data[0].id || data[0].orderNumber
        setExpandedOrders({ [firstId]: true })
      }
    } catch (err) {
      console.error('فشل جلب الطلبات', err)
      setOrdersError('حدث خطأ أثناء تحميل سجل الطلبات. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoadingOrders(false)
    }
  }

  const toggleOrderExpand = (id) => {
    setExpandedOrders(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // إلغاء الطلب (متاح للطلبات قيد المراجعة فقط)
  async function handleCancelOrder(orderId) {
    if (!window.confirm('هل أنت تأكد من رغبتك في إلغاء هذا الطلب؟')) return

    setCancelingOrderId(orderId)
    try {
      await axiosInstance.put(`/Orders/${orderId}/cancel`)
      
      // تحديث الحالة محلياً
      setOrders(prev =>
        prev.map(o => {
          const currentId = o.id || o.orderNumber
          if (currentId === orderId) {
            return { ...o, status: -1, statusText: 'تم إلغاء الطلب' }
          }
          return o;
        })
      )
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر إلغاء الطلب حالياً. يرجى التواصل مع الدعم.')
    } finally {
      setCancelingOrderId(null)
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    try {
      const response = await axiosInstance.put('/Auth/update-profile', user)
      const updatedData = response.data?.user || response.data || { ...user }

      const updatedUserObj = {
        ...user,
        fullName: updatedData.fullName || updatedData.name || user.fullName,
        phone: updatedData.phone || user.phone,
        governorate: updatedData.governorate || user.governorate,
        address: updatedData.address || user.address
      }

      setUser(updatedUserObj)

      const currentStored = JSON.parse(localStorage.getItem('user') || '{}')
      const newStoredData = { ...currentStored, ...updatedUserObj }
      localStorage.setItem('user', JSON.stringify(newStoredData))

      if (typeof updateAuthUser === 'function') {
        updateAuthUser(newStoredData)
      }

      setMessage({ type: 'success', text: 'تم تحديث البيانات وحفظها في الحساب بنجاح!' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'حدث خطأ أثناء التحديث.' })
    } finally {
      setUpdating(false)
    }
  }

  const openReviewModal = (item) => {
    setReviewModal({
      isOpen: true,
      item,
      rating: 5,
      comment: '',
      submitting: false,
      successMsg: null,
      errorMsg: null
    })
  }

  const closeReviewModal = () => {
    setReviewModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewModal(prev => ({ ...prev, submitting: true, errorMsg: null }))

    try {
      await axiosInstance.post('/Reviews', {
        productId: reviewModal.item?.productId || reviewModal.item?.id,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      })

      setReviewModal(prev => ({
        ...prev,
        submitting: false,
        successMsg: 'تم إرسال تقييمك بنجاح! شكراً لمشاركتك.'
      }))

      setTimeout(() => {
        closeReviewModal()
      }, 2000)
    } catch (err) {
      setReviewModal(prev => ({
        ...prev,
        submitting: false,
        errorMsg: err.response?.data?.message || err.message || 'تعذر إرسال التقييم حالياً.'
      }))
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10" dir="rtl">
      {/* Header & Tabs */}
      <div className="mb-6 border-b border-border pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            مرحباً، {user.fullName || 'عزيزنا العميل'} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            يمكنك متابعة حالة طلباتك الحالية والسابقة أو تعديل بيانات حسابك الشخصي.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-canvas p-1.5 rounded-2xl border border-border shrink-0">
          <button
            onClick={() => handleTabChange('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-graphite-900 text-white shadow-xs'
                : 'text-ink-soft hover:text-ink hover:bg-surface'
            }`}
          >
            <ShoppingBag size={15} />
            <span>طلباتي ومتابعة الشحنات</span>
            {orders.length > 0 && (
              <span className="bg-amber text-graphite-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {orders.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-graphite-900 text-white shadow-xs'
                : 'text-ink-soft hover:text-ink hover:bg-surface'
            }`}
          >
            <User size={15} />
            <span>بيانات الحساب</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <Card title="سجل الطلبات وتتبع الحالة">
          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-amber" />
            </div>
          ) : ordersError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-rose-600 space-y-3">
              <AlertCircle size={36} />
              <p>{ordersError}</p>
              <button
                onClick={fetchCustomerOrders}
                className="inline-flex items-center gap-2 bg-surface border border-border px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-canvas transition cursor-pointer"
              >
                <RotateCcw size={14} />
                إعادة المحاولة
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-ink-soft">
              <Package size={48} className="mb-3 text-border" />
              <p className="font-semibold text-base text-ink">لا توجد طلبات سابقة حتى الآن</p>
              <p className="mt-1 text-xs">عند قيامك بالشراء، ستظهر جميع الطلبات وحالاتها هنا لمتابعتها أولاً بأول.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map(order => {
                const orderKey = order.id || order.orderNumber
                const isExpanded = expandedOrders[orderKey]
                const currentStep = getStepNumber(order.status)
                const items = order.items || order.orderItems || []
                const badge = getStatusBadge(order.statusText || order.status)
                const StatusIcon = badge.icon

                return (
                  <div
                    key={orderKey}
                    className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition hover:border-amber/40"
                  >
                    {/* Header Card */}
                    <div 
                      onClick={() => toggleOrderExpand(orderKey)}
                      className="flex flex-wrap items-center justify-between gap-3 bg-canvas/80 p-4 border-b border-border text-xs cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-ink-soft block">رقم الطلب</span>
                          <span className="font-mono font-bold text-emerald-600 text-sm">
                            {order.orderNumber || `ORD-${order.id}`}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-ink-soft block">التاريخ</span>
                          <span className="font-semibold text-ink">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('ar-EG')
                              : new Date().toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <div>
                          <span className="text-ink-soft block">الإجمالي الكلي</span>
                          <span className="font-mono font-bold text-ink text-sm">
                            {formatCurrency(order.totalAmount || order.total || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                          <StatusIcon size={14} />
                          {badge.label}
                        </span>
                        <button className="text-ink-soft hover:text-ink p-1">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Details Accordion */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 space-y-6">
                        {currentStep === -1 ? (
                          <div className="rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2 border border-rose-200">
                            <XCircle size={18} className="shrink-0" />
                            <span>تم إلغاء هذا الطلب. إذا كان لديك استفسار يرجى التواصل مع الدعم الفني.</span>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border/80 bg-canvas/40 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-bold text-ink block">تتبع مراحل الشحنة</span>
                              
                              {/* زر إلغاء الطلب في مرحلة المراجعة فقط */}
                              {currentStep === 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCancelOrder(orderKey)
                                  }}
                                  disabled={cancelingOrderId === orderKey}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer disabled:opacity-50"
                                >
                                  {cancelingOrderId === orderKey ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Ban size={13} />
                                  )}
                                  <span>إلغاء الطلب</span>
                                </button>
                              )}
                            </div>
                            
                            <div className="relative py-2">
                              <div className="absolute top-4 right-6 left-6 h-0.5 bg-border -z-0">
                                <div 
                                  className="h-full bg-emerald-600 transition-all duration-500"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100))}%`
                                  }}
                                />
                              </div>

                              <div className="grid grid-cols-5 gap-2 text-center relative z-10">
                                {TRACKING_STEPS.map((s) => {
                                  const isCompleted = currentStep >= s.step
                                  const isCurrent = currentStep === s.step
                                  return (
                                    <div key={s.step} className="flex flex-col items-center">
                                      <div
                                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                          isCompleted
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-surface text-ink-soft border border-border'
                                        } ${isCurrent ? 'ring-4 ring-emerald-100 ring-offset-1 border-emerald-600 scale-105' : ''}`}
                                      >
                                        {isCompleted ? <Check size={16} /> : s.step}
                                      </div>
                                      <span
                                        className={`mt-2 text-[11px] leading-tight ${
                                          isCompleted ? 'text-emerald-700 font-bold' : 'text-ink-soft'
                                        }`}
                                      >
                                        {s.label}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {items.length > 0 && (
                          <div>
                            <span className="text-xs font-bold text-ink mb-3 block">منتجات الطلب ({items.length})</span>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {items.map((item, idx) => (
                                <div key={item.id || idx} className="flex items-center justify-between gap-3 rounded-xl bg-canvas p-3 border border-border/70">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center border border-border shrink-0">
                                      <Package size={18} className="text-amber" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-ink truncate">{item.productName || item.name || 'منتج'}</p>
                                      <p className="text-[11px] text-ink-soft font-mono mt-0.5">
                                        الكمية: {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}
                                      </p>
                                    </div>
                                  </div>

                                  {currentStep === 5 && (
                                    <button
                                      onClick={() => openReviewModal(item)}
                                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition shrink-0 cursor-pointer"
                                    >
                                      <Star size={12} className="fill-emerald-600 text-emerald-600" />
                                      أضف تقييماً
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="rounded-xl bg-canvas p-3.5 flex items-center gap-2 text-xs text-ink border border-border/60">
                          <MapPin size={16} className="text-emerald-600 shrink-0" />
                          <span className="font-bold text-ink shrink-0">عنوان التوصيل:</span>
                          <span className="truncate text-ink-soft">{order.shippingAddress || user.address || 'العنوان المسجل بالحساب'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto">
          <Card title="بيانات الحساب والملف الشخصي">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {message && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">الاسم الكامل</label>
                <div className="relative">
                  <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    disabled={updating}
                    value={user.fullName}
                    onChange={e => setUser({ ...user, fullName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">البريد الإلكتروني (غير قابل للتعديل)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink-soft opacity-70 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">رقم الهاتف</label>
                <div className="relative">
                  <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="tel"
                    disabled={updating}
                    value={user.phone}
                    onChange={e => setUser({ ...user, phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">المحافظة</label>
                <div className="relative">
                  <Building2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                  <input
                    type="text"
                    disabled={updating}
                    value={user.governorate}
                    onChange={e => setUser({ ...user, governorate: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber transition disabled:opacity-60"
                    placeholder="القاهرة، الإسكندرية..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">العنوان بالتفصيل</label>
                <div className="relative">
                  <MapPin size={16} className="absolute right-3 top-3 text-ink-soft" />
                  <textarea
                    rows={3}
                    disabled={updating}
                    value={user.address}
                    onChange={e => setUser({ ...user, address: e.target.value })}
                    className="w-full rounded-xl border border-border bg-canvas py-2.5 pr-9 pl-3 text-sm text-ink outline-none focus:border-amber resize-none transition disabled:opacity-60"
                    placeholder="تفاصيل العنوان..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-graphite-800 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {updating && <Loader2 size={16} className="animate-spin" />}
                حفظ التعديلات
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div 
          onClick={closeReviewModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" 
          dir="rtl"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
          >
            <button
              onClick={closeReviewModal}
              className="absolute left-4 top-4 text-ink-soft hover:text-ink cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-ink mb-1">إضافة تقييم للمنتج</h3>
            <p className="text-xs text-ink-soft mb-4">
              المنتج: <span className="font-semibold text-ink">{reviewModal.item?.productName || reviewModal.item?.name}</span>
            </p>

            {reviewModal.successMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{reviewModal.successMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewModal.errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{reviewModal.errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink mb-2">تقييمك بالنجوم:</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewModal(prev => ({ ...prev, rating: star }))}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          size={24}
                          className={star <= reviewModal.rating ? 'fill-amber text-amber' : 'text-border'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">تعليقك / رأيك بالمنتج:</label>
                  <textarea
                    rows={3}
                    disabled={reviewModal.submitting}
                    value={reviewModal.comment}
                    onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-canvas p-3 text-sm text-ink outline-none focus:border-amber transition resize-none disabled:opacity-60"
                    placeholder="اكتب انطباعك عن جودة المنتج والتوصيل..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewModal.submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  {reviewModal.submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  إرسال التقييم
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}