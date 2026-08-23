// File: src/pages/Checkout/CheckoutPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, PackageCheck, X, Truck, UserCheck, MapPinPlus } from 'lucide-react'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { createGuestOrder } from '../../api/storefrontApi'
import axiosInstance from '../../api/axiosInstance'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/catalog'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'

function extractErrorMessage(err) {
  if (!err) return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.'
  if (typeof err === 'string') return err

  const responseData = err?.response?.data
  if (!responseData) return err?.message || 'تعذر الاتصال بالسيرفر.'

  if (typeof responseData === 'string') return responseData
  if (responseData?.message) return responseData.message
  if (responseData?.title) return responseData.title

  if (responseData?.errors && typeof responseData.errors === 'object') {
    const messages = Object.values(responseData.errors).flat()
    if (messages.length > 0) return messages.join(' | ')
  }

  return 'تعذر إرسال الطلب، يرجى مراجعة البيانات والمحاولة مرة أخرى.'
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { updateUser: updateAuthUser } = useAuth() || {}

  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    shippingAddress: '',
    deliveryGovernorate: '',
    customGovernorate: '',
  })

  const [isOtherZone, setIsOtherZone] = useState(false)
  const [shippingZones, setShippingZones] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedZonePrice, setSelectedZonePrice] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [error, setError] = useState(null)
  const [orderNumber, setOrderNumber] = useState(null)
  const [completedTotal, setCompletedTotal] = useState(0)

  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const fetchShippingZones = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/ShippingZones')
      const data = res.data
      const zones = Array.isArray(data) ? data : data?.$values || data?.data || []
      setShippingZones(zones)
    } catch (err) {
      console.error('تعذر جلب مناطق الشحن:', err)
    }
  }, [])

  const fetchUserProfile = useCallback(async () => {
    setLoadingProfile(true)
    try {
      const response = await axiosInstance.get('/Auth/profile')
      const data = response.data
      setUser(data)
      setForm((prev) => ({
        ...prev,
        guestName: data.fullName || data.name || prev.guestName,
        guestPhone: data.phone || prev.guestPhone,
        shippingAddress: data.address || prev.shippingAddress,
        deliveryGovernorate: data.governorate || prev.deliveryGovernorate,
      }))
      localStorage.setItem('user', JSON.stringify(data))
    } catch (err) {
      console.error('تعذر جلب بيانات الملف الشخصي:', err)
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  useEffect(() => {
    fetchShippingZones()

    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)
        setForm((prev) => ({
          ...prev,
          guestName: parsed.fullName || parsed.name || '',
          guestPhone: parsed.phone || '',
          shippingAddress: parsed.address || '',
          deliveryGovernorate: parsed.governorate || '',
        }))
      } catch (e) {
        console.error('فشل قراءة البيانات من localStorage:', e)
      }
    }

    if (token) {
      fetchUserProfile()
    }
  }, [fetchShippingZones, fetchUserProfile])

  useEffect(() => {
    if (form.deliveryGovernorate === 'OTHER') {
      setIsOtherZone(true)
      setSelectedZone(null)
      setSelectedZonePrice(0)
    } else if (form.deliveryGovernorate && shippingZones.length > 0) {
      setIsOtherZone(false)
      const found = shippingZones.find(
        (z) => z.name?.trim().toLowerCase() === form.deliveryGovernorate?.trim().toLowerCase()
      )

      setSelectedZone(found || null)
      setSelectedZonePrice(
        found ? Number(found.shippingFee ?? found.shippingCost ?? found.price ?? 0) : 0
      )
    } else {
      setIsOtherZone(false)
      setSelectedZone(null)
      setSelectedZonePrice(0)
    }
  }, [form.deliveryGovernorate, shippingZones])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const grandTotal = subtotal + selectedZonePrice

  async function syncProfileData(token, formData) {
    try {
      await axiosInstance.put('/Auth/update-profile', {
        fullName: formData.guestName,
        phone: formData.guestPhone,
        address: formData.shippingAddress,
        governorate: isOtherZone ? formData.customGovernorate : formData.deliveryGovernorate,
      })
    } catch (e) {
      console.error('فشل تحديث ملف المستخدم في الباك إند:', e)
    }
  }

  async function executeOrderSubmission(overrideToken = null, overrideForm = null) {
    setSubmitting(true)
    setError(null)
    try {
      const currentTotal = grandTotal
      const token = overrideToken || localStorage.getItem('token')
      const formData = overrideForm || form

      const formattedItems = items.map((item) => ({
        productId: Number(item.id || item.productId),
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.price || 0),
      }))

      // فصل العنوان والمحافظة، وإرسال تنبيه مستقل بطلب المنطقة الجديدة
      const orderPayload = {
        customerName: formData.guestName,
        customerPhone: formData.guestPhone,
        shippingAddress: formData.shippingAddress,
        shippingZoneId: isOtherZone ? null : selectedZone?.id,
        isCustomZoneRequested: isOtherZone,
        customZoneName: isOtherZone ? formData.customGovernorate : null,
        notes: isOtherZone
          ? `[طلب منطقة جديدة]: ${formData.customGovernorate}`
          : `المحافظة: ${formData.deliveryGovernorate}`,
        items: formattedItems,
      }

      const order = await createGuestOrder(orderPayload, token)

      if (token) {
        await syncProfileData(token, formData)
      }

      const currentStored = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedUser = {
        ...currentStored,
        fullName: formData.guestName,
        phone: formData.guestPhone,
        address: formData.shippingAddress,
        governorate: isOtherZone ? formData.customGovernorate : formData.deliveryGovernorate,
      }

      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (typeof updateAuthUser === 'function') {
        updateAuthUser(updatedUser)
      }

      setCompletedTotal(currentTotal)
      setOrderNumber(order?.orderNumber || order?.id || 'OK')
      clearCart()
    } catch (err) {
      console.error('Order submission error:', err)
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError(null)
    try {
      const response = await axiosInstance.post('/Auth/google', {
        idToken: credentialResponse.credential,
      })
      const data = response.data

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      setUser(data)

      const updatedForm = {
        ...form,
        guestName: data.fullName || data.name || form.guestName,
        guestPhone: data.phone || form.guestPhone,
        shippingAddress: data.address || form.shippingAddress,
        deliveryGovernorate: data.governorate || form.deliveryGovernorate,
      }

      setForm(updatedForm)
      setShowLoginModal(false)

      await executeOrderSubmission(data.token, updatedForm)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!items.length) {
      setError('السلة فارغة حالياً.')
      return
    }

    if (
      !form.guestName.trim() ||
      !form.guestPhone.trim() ||
      !form.shippingAddress.trim() ||
      !form.deliveryGovernorate.trim() ||
      (isOtherZone && !form.customGovernorate.trim())
    ) {
      setError('يرجى إكمال جميع بيانات التوصيل المحددة.')
      return
    }

    const token = localStorage.getItem('token')
    if (!user || !token) {
      setShowLoginModal(true)
      return
    }

    await executeOrderSubmission()
  }

  if (!items.length && !orderNumber) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12" dir="rtl">
        <EmptyState
          icon={PackageCheck}
          title="لا توجد منتجات لإتمام الطلب"
          description="أضف منتجات إلى السلة أولاً ثم ارجع لهذه الصفحة لإكمال بيانات التوصيل."
          action={
            <Link
              to="/"
              className="rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800"
            >
              العودة للمنتجات
            </Link>
          }
        />
      </div>
    )
  }

  if (orderNumber) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6" dir="rtl">
        <Card>
          <div className="flex flex-col items-center gap-4 px-3 py-6 text-center sm:px-6 sm:py-10">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink">تم استلام طلبك بنجاح</h1>
            <p className="max-w-lg text-sm leading-7 text-ink-soft">
              رقم الطلب <span className="font-mono font-bold text-emerald-600">{orderNumber}</span> تم إرساله إلى النظام.
              {isOtherZone && (
                <span className="block mt-1 font-semibold text-amber-700">
                  ملاحظة: طلبك يتضمن منطقة شحن جديدة قيد المراجعة. يتواصل معك الفريق لتحديد تكلفة الشحن والموافقة.
                </span>
              )}
            </p>
            <div className="rounded-xl border border-border bg-canvas px-6 py-3 my-1">
              <span className="text-xs text-ink-soft block mb-0.5">إجمالي المنتجات:</span>
              <span className="text-lg font-mono font-bold text-ink">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
              <Link
                to="/profile?tab=orders"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 shadow-xs"
              >
                <Truck size={16} />
                متابعة حالة الطلب
              </Link>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-xl bg-graphite-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800 cursor-pointer"
              >
                مواصلة التسوق
              </button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10 relative" dir="rtl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">إتمام الطلب</h1>
        <p className="text-sm text-ink-soft">أدخل بيانات التوصيل وسيتم إرسال الطلب مباشرة إلى النظام.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="بيانات العميل">
          {user && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-amber-700 shrink-0" />
                <span>
                  أهلاً <strong>{user.fullName || user.name}</strong>، يرجى استكمال الهاتف والعنوان وسيتم حفظها لطلباتك القادمة تلقائياً.
                </span>
              </div>
              {loadingProfile && <Loader2 size={14} className="animate-spin text-amber-800 shrink-0" />}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="guestName">
                الاسم الكامل
              </label>
              <input
                id="guestName"
                value={form.guestName}
                onChange={(event) => updateField('guestName', event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="guestPhone">
                رقم الهاتف
              </label>
              <input
                id="guestPhone"
                type="tel"
                value={form.guestPhone}
                onChange={(event) => updateField('guestPhone', event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="shippingAddress">
                العنوان بالتفصيل
              </label>
              <textarea
                id="shippingAddress"
                rows={3}
                value={form.shippingAddress}
                onChange={(event) => updateField('shippingAddress', event.target.value)}
                className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
                placeholder="الشارع، رقم المبنى، الدور، الشقة"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="deliveryGovernorate">
                المنطقة / المحافظة
              </label>
              <select
                id="deliveryGovernorate"
                value={form.deliveryGovernorate}
                onChange={(event) => updateField('deliveryGovernorate', event.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20"
              >
                <option value="">اختر المنطقة أو المحافظة</option>
                {shippingZones.map((zone) => (
                  <option key={zone.id || zone.name} value={zone.name}>
                    {zone.name} {zone.price ? `(${formatCurrency(zone.price)})` : ''}
                  </option>
                ))}
                <option value="OTHER">📍 أخرى (طلب إضافة منطقة جديدة)</option>
              </select>
            </div>

            {isOtherZone && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2 transition-all">
                <label className="block text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <MapPinPlus size={16} className="text-amber-700" />
                  اسم المنطقة أو المحافظة الجديدة:
                </label>
                <input
                  type="text"
                  value={form.customGovernorate}
                  onChange={(e) => updateField('customGovernorate', e.target.value)}
                  placeholder="اكتب اسم المنطقه او المحافظه هنا..."
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  سيتواصل معك فريق الدعم لمراجعة المنطقة، وتحديد تكلفة الشحن المناسبة قبل الإرسال.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-graphite-900 transition hover:bg-amber-dark disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب'}
            </button>
          </form>
        </Card>

        <Card title="ملخص الطلب">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>إجمالي المنتجات</span>
              <span className="font-mono text-base font-semibold text-ink">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>تكلفة الشحن</span>
              <span className="font-mono text-base font-semibold text-ink">
                {isOtherZone ? 'يحدد لاحقاً' : formatCurrency(selectedZonePrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-ink border-t border-border pt-3">
              <span>الإجمالي الكلي</span>
              <span className="font-mono text-lg text-emerald-600">
                {isOtherZone ? `${formatCurrency(subtotal)} + الشحن` : formatCurrency(grandTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-soft">
              <span>طريقة الدفع</span>
              <span className="font-medium text-ink">الدفع عند الاستلام</span>
            </div>
            <div className="rounded-xl border border-border bg-canvas p-4 text-sm leading-7 text-ink-soft">
              بعد إرسال الطلب سيظهر رقم مرجعي، وسيتم التأكيد هاتفيًا قبل الشحن.
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/cart"
                className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm font-semibold text-ink transition hover:border-amber/60"
              >
                العودة إلى السلة
              </Link>
              <Link
                to="/"
                className="rounded-xl bg-graphite-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-graphite-800"
              >
                مواصلة التصفح
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border border-border relative">
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute left-4 top-4 rounded-lg p-1 text-ink-soft hover:text-ink hover:bg-canvas transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="text-center space-y-3 mb-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber/20 text-amber-900 border border-amber/30">
                <UserCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink">تسجيل الدخول مطلوب لإتمام الطلب</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                يرجى تسجيل الدخول باستخدام حساب جوجل الخاص بك ليتم إرسال الطلب باسمك ومتابعة الشحنة بسهولة.
              </p>
            </div>

            <div className="flex justify-center py-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('فشل تسجيل الدخول باستخدام جوجل. حاول مجدداً.')}
                useOneTap
                theme="outline"
                shape="pill"
                locale="ar"
              />
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}