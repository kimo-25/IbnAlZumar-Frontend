import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Package,
  Clock,
  Truck,
  Check,
  MapPin,
  User,
  Phone,
  Printer,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Card from '../../components/ui/Card'
import axiosInstance from '../../api/axiosInstance'
import { formatCurrency } from '../../utils/catalog'

const TRACKING_STEPS = [
  { step: 1, label: 'قيد المراجعة', description: 'تم استلاستلام طلبك وجاري مراجعته' },
  { step: 2, label: 'تم التأكيد', description: 'تم تأكيد طلبك وقبوله' },
  { step: 3, label: 'جاري التجهيز', description: 'يتم الآن تجهيز المنتجات للتغليف' },
  { step: 4, label: 'في الطريق إليك', description: 'الطلب مع مندوب الشحن حالياً' },
  { step: 5, label: 'تم التوصيل بنجاح', description: 'تم تسليم الشحنة بنجاح' }
]

function getStepNumber(status) {
  if (typeof status === 'number') return status
  const s = String(status || '').toLowerCase()
  if (s.includes('pending') || s.includes('مراجعة')) return 1
  if (s.includes('confirm') || s.includes('تأكيد')) return 2
  if (s.includes('prep') || s.includes('process') || s.includes('تجهيز')) return 3
  if (s.includes('ship') || s.includes('way') || s.includes('طريق')) return 4
  if (s.includes('complet') || s.includes('deliver') || s.includes('تم')) return 5
  return 1
}

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  async function fetchOrderDetails() {
    try {
      setLoading(true)
      try {
        const response = await axiosInstance.get(`/Orders/${orderId}`)

        console.log("API RESPONSE", response.data)

        setOrder(response.data)
        return
      } catch {
        const myOrdersRes = await axiosInstance.get('/Orders/my-orders')
        const list = myOrdersRes.data
        const ordersArray = Array.isArray(list) ? list : (list.$values || list.data || [])
        const found = ordersArray.find(
          (o) => String(o.id) === String(orderId) || o.orderNumber === orderId
        )
        if (found) {
          setOrder(found)
        } else {
          setError('لم نتمكن من العثور على تفاصيل هذا الطلب.')
        }
      }
    } catch (err) {
      console.error(err)
      setError('تعذر الاتصال بالخادم.')
    } finally {
      setLoading(false)
    }
  }

  // دالة طباعة الفاتورة الاحترافية "ابن الزمر" بشكل ذاتي وآمن
  function handlePrintInvoice(order) {
    if (!order) return

    const customerName = order.customerName || order.fullName || 'العميل الكريم'
    const customerEmail = order.customerEmail || order.email || 'customer@example.com'
    const customerPhone = order.phone || order.customerPhone || '-'
    const address = order.shippingAddress || order.address || order.location || order.shippingLocation || order.user?.address || order.customer?.address || 'العنوان غير متوفر'
    const orderNum = order.orderNumber || `ORD-2026-${order.id}`
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')
    const paymentMethod = order.paymentMethod || 'الدفع عند الاستلام (COD)'

    const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orderItems) ? order.orderItems : [])
    const totalAmount = Number(order.totalAmount || order.total || 0)

    const itemsTableRows = items.length > 0
      ? items.map(item => `
          <tr>
            <td>
              <div class="item-title">${item.productName || item.name || 'منتج'}</div>
              <div class="item-id">ID: ${item.sku || item.productId || item.id || '-'}</div>
            </td>
            <td>EGP ${Number(item.unitPrice || item.price || 0).toLocaleString()}</td>
            <td>${item.quantity || 1}</td>
            <td class="font-bold">EGP ${(Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</td>
          </tr>
        `).join('')
      : `
        <tr>
          <td>
            <div class="item-title">مشتريات الطلب رقم #${orderNum}</div>
            <div class="item-id">حالة الطلب: ${order.statusText || order.status || 'مؤكد'}</div>
          </td>
          <td>EGP ${totalAmount.toLocaleString()}</td>
          <td>1</td>
          <td class="font-bold">EGP ${totalAmount.toLocaleString()}</td>
        </tr>
      `

    const subtotal = items.length > 0
      ? items.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0)
      : totalAmount

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة مبيعات - ${orderNum}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Cairo', sans-serif; 
            background-color: #f8fafc; 
            color: #0f172a; 
            padding: 20px;
            direction: rtl;
          }
          .invoice-card {
            max-width: 780px;
            margin: auto;
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            padding: 32px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          .badge {
            background-color: #09090b;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 6px;
            display: inline-block;
            margin-bottom: 8px;
          }
          .meta-info { font-size: 12px; color: #64748b; font-weight: 600; }
          .meta-info span { color: #0f172a; font-weight: 700; }
          .company-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            text-align: left;
          }
          .company-sub {
            font-size: 11px;
            color: #475569;
            text-align: left;
            margin-top: 2px;
          }
          .tax-id {
            font-size: 10px;
            color: #64748b;
            text-align: left;
            margin-top: 4px;
            font-weight: 600;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1.6fr 1fr;
            gap: 16px;
            margin: 24px 0;
          }
          .info-box {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 16px;
            background-color: #fff;
          }
          .box-title {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 8px;
          }
          .customer-name { font-size: 15px; font-weight: 800; color: #0f172a; }
          .customer-detail { font-size: 12px; color: #64748b; margin-top: 3px; }
          .channel-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .payment-tag {
            font-size: 13px;
            font-weight: 800;
            color: #059669;
          }
          .table-section-title {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          th {
            background-color: #09090b;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            padding: 10px 14px;
            text-align: right;
          }
          th:last-child, td:last-child { text-align: left; }
          th:nth-child(2), td:nth-child(2), th:nth-child(3), td:nth-child(3) { text-align: center; }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12.5px;
            color: #1e293b;
          }
          .item-title { font-weight: 700; color: #0f172a; }
          .item-id { font-size: 10px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
          .totals-wrapper {
            display: flex;
            justify-content: flex-start;
            margin-top: 20px;
          }
          .totals-box {
            width: 320px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px 18px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #475569;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .total-row.grand {
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            margin-bottom: 0;
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
          }
          .grand-amount { color: #059669; font-size: 16px; font-weight: 800; }
          .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            align-items: center;
          }
          .signature-box { text-align: center; }
          .signature-title { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 24px; }
          .signature-line { border-bottom: 1px dotted #94a3b8; width: 80%; margin: 0 auto 6px auto; }
          .signature-hint { font-size: 9px; color: #94a3b8; }
          .stamp-container {
            position: relative;
            display: inline-block;
          }
          .stamp {
            width: 85px;
            height: 85px;
            border: 2px dashed #10b981;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: auto;
            transform: rotate(-12deg);
            color: #059669;
            font-size: 8px;
            font-weight: 800;
            text-align: center;
            padding: 4px;
            background: rgba(16, 185, 129, 0.03);
          }
          .stamp-title { font-size: 9px; font-weight: 900; }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 14px;
            text-align: center;
          }
          .footer-main { font-size: 13.5px; font-weight: 800; color: #334155; }
          .footer-sub { font-size: 10px; color: #94a3b8; margin-top: 2px; font-style: italic; }
          @media print {
            body { background: #fff; padding: 0; }
            .invoice-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div>
              <span class="badge">فاتورة مبيعات معتمدة للعميل</span>
              <div class="meta-info">ID: <span>${orderNum}</span></div>
              <div class="meta-info" style="margin-top:2px;">Date: <span>${orderDate}</span></div>
            </div>
            <div>
              <div class="company-title">ابن الزمر للعدد ومستلزمات الورش</div>
              <div class="company-sub">أصالة الجودة وكفاءة الأداء والمعدات الأصلية</div>
              <div class="tax-id">Tax ID: EGY-39481-22A • CR 843912</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="box-title">بيانات العميل</div>
              <div class="customer-name">${customerName}</div>
              <div class="customer-detail">${customerEmail}</div>
              <div class="customer-detail">${customerPhone}</div>
              <div class="customer-detail">${address}</div>
            </div>
            <div class="info-box">
              <div class="box-title">قناة الشراء والدفع</div>
              <div class="channel-badge">🌐 متجر ابن الزمر الإلكتروني</div>
              <div class="box-title" style="margin-top:14px;">حالة وطريقة الدفع</div>
              <div class="payment-tag">${paymentMethod}</div>
            </div>
          </div>

          <div class="table-section-title">تفاصيل المنتجات المطلوبة</div>
          <table>
            <thead>
              <tr>
                <th>السلعة / البيان</th>
                <th>سعر الوحدة</th>
                <th>الكمية</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableRows}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <div class="totals-box">
              <div class="total-row">
                <span>الإجمالي الفرعي:</span>
                <span>EGP ${subtotal.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>تكلفة الشحن:</span>
                <span>EGP 0</span>
              </div>
              <div class="total-row grand">
                <span>الإجمالي الكلي:</span>
                <span class="grand-amount">EGP ${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="signatures-grid">
            <div class="signature-box">
              <div class="signature-title">توقيع العميل / المستلم</div>
              <div class="signature-line"></div>
              <div class="signature-hint">(تم الاستلام والمراجعة وفق الضمان)</div>
            </div>
            <div class="signature-box">
              <div class="signature-title">ختم المركز والاعتماد</div>
              <div class="stamp-container">
                <div class="stamp">
                  <span class="stamp-title">ابن الزمر</span>
                  <span>EBN ELZAMER</span>
                  <span style="font-size:7px; color:#059669; margin-top:2px;">APPROVED</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-main">شكراً لثقتكم واختياركم متجر ابن الزمر لمستلزمات الورش!</div>
            <div class="footer-sub">.Please keep this VAT receipt copy as a reference for official device warranty claims</div>
          </div>
        </div>

        <script>
          window.onload = function() { 
            setTimeout(function() {
              window.print(); 
              window.close(); 
            }, 300);
          };
        </script>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-amber" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center" dir="rtl">
        <AlertCircle size={48} className="mx-auto mb-4 text-danger" />
        <h2 className="text-xl font-bold text-ink">خطأ في عرض الطلب</h2>
        <p className="mt-2 text-sm text-ink-soft">{error || 'الطلب غير موجود'}</p>
        <button
          onClick={() => navigate('/profile')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-graphite-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-graphite-800"
        >
          <ArrowRight size={16} /> العودة إلى البروفايل
        </button>
      </div>
    )
  }
  console.log("ORDER STATE", order)
  const currentStep = getStepNumber(order.status)
  const items = order.items || order.orderItems || []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10" dir="rtl">
      {/* العودة وزر الطباعة الجديد */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-amber transition"
        >
          <ArrowRight size={18} /> العودة لسجل الطلبات
        </Link>
        <button
          onClick={() => handlePrintInvoice(order)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Printer size={16} /> طباعة الفاتورة الرسمية
        </button>
      </div>

      {/* الترويسة الرئيسية */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span className="text-xs text-ink-soft">رقم الطلب</span>
            <h1 className="text-2xl font-bold font-mono text-emerald-600">
              {order.orderNumber || `ORD-2026-${order.id}`}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3.5 py-1.5 text-xs font-bold text-amber-900">
              <Clock size={14} />
              {order.statusText || order.status || 'قيد المراجعة'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div>
            <span className="text-ink-soft block">تاريخ الطلب</span>
            <span className="font-semibold text-ink">
              {new Date(order.createdAt || Date.now()).toLocaleDateString('ar-EG')}
            </span>
          </div>
          <div>
            <span className="text-ink-soft block">طريقة الدفع</span>
            <span className="font-semibold text-ink">الدفع عند الاستلام</span>
          </div>
          <div>
            <span className="text-ink-soft block">عدد المنتجات</span>
            <span className="font-semibold text-ink">{items.length} منتج</span>
          </div>
          <div>
            <span className="text-ink-soft block">المبلغ الإجمالي</span>
            <span className="font-bold text-ink font-mono text-sm">
              {formatCurrency(order.totalAmount || order.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* مخطط التتبع التفاعلي (Stepper) */}
      <Card title="مخطط تتبع حالة الشحنة" className="mb-8">
        <div className="py-4">
          <div className="relative flex items-center justify-between px-4">
            <div className="absolute left-8 right-8 top-4 h-1 bg-border -z-0" />
            <div
              className="absolute right-8 top-4 h-1 bg-emerald-500 transition-all duration-500 -z-0"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />

            {TRACKING_STEPS.map((s) => {
              const isDone = s.step < currentStep
              const isCurrent = s.step === currentStep

              return (
                <div key={s.step} className="relative z-10 flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                      : 'bg-canvas text-ink-soft border border-border'
                    }`}>
                    {isDone ? <Check size={16} /> : s.step}
                  </div>
                  <span className={`mt-3 text-xs font-bold text-center ${isCurrent || isDone ? 'text-ink' : 'text-ink-soft'
                    }`}>
                    {s.label}
                  </span>
                  <span className="mt-1 hidden text-[10px] text-ink-soft text-center sm:block max-w-[90px]">
                    {s.description}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* تفاصيل المنتجات والمشتريات */}
        <div className="lg:col-span-2">
          <Card title="محتويات الشحنة والمنتجات">
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-canvas flex items-center justify-center border border-border shrink-0">
                      <Package size={18} className="text-ink-soft" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{item.productName || item.name || 'منتج'}</p>
                      <p className="text-xs text-ink-soft font-mono">الكمية: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-left font-mono font-bold text-sm text-ink shrink-0">
                    {formatCurrency((item.unitPrice || item.price || 0) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* معلومات التوصيل والعنوان */}
        <div className="lg:col-span-1">
          <Card title="بيانات التوصيل والعميل">
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-2.5">
                <User size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-soft block font-medium">اسم المستلم</span>
                  <span className="font-bold text-ink text-sm">{order.customerName || order.fullName || 'العميل'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-soft block font-medium">رقم الهاتف</span>
                  <span className="font-semibold text-ink font-mono">{order.phone || order.customerPhone || 'غير محدد'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-soft block font-medium">عنوان التوصيل</span>
                  <span className="font-medium text-ink leading-relaxed">
                    {order.shippingAddress || order.address || order.location || order.shippingLocation || order.user?.address || order.customer?.address || '-'}   </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}