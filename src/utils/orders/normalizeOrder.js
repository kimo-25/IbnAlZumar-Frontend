// File: src/utils/orders/normalizeOrder.js
// يوحّد شكل الطلب القادم من الـ API (camelCase / PascalCase / أسماء بديلة) في شكل واحد للواجهة.
import { PAYMENT_OPTIONS } from '../pos/paymentOptions'
import { withFawry } from '../pos/fawryPayment'

const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k]
  }
  return undefined
}
const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v))

export const ORDER_SOURCE_IN_STORE = 2 // نفس قيمة الكاشير (PosCheckoutPage)

// ⚠️ طابق القيم دي مع enum الحالة في الباك إند (والـ select هيضيف الحالة الحالية تلقائيًا لو مش في القائمة)
export const ORDER_STATUS_OPTIONS = [
  { value: 'Pending', label: 'قيد الانتظار' },
  { value: 'Processing', label: 'قيد التجهيز' },
  { value: 'Shipped', label: 'تم الشحن' },
  { value: 'Delivered', label: 'تم التسليم' },
  { value: 'Completed', label: 'مكتمل' },
  { value: 'Cancelled', label: 'ملغي' },
]

// قيم طرق الدفع من نفس مصدر الكاشير (serverMethod) + فوري
export const PAYMENT_METHOD_OPTIONS = withFawry(PAYMENT_OPTIONS).map((o) => ({
  value: o.serverMethod,
  label: o.label,
}))

export function fmtMoney(value) {
  const n = Number(value) || 0
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** YYYY-MM-DD بتوقيت القاهرة */
export function cairoDay(value) {
  const d = value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
}

export function cairoTime(value) {
  const d = value ? new Date(value) : null
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })
}

function detectPos(raw, orderNumber) {
  const src = pick(raw, 'orderSource', 'OrderSource', 'source', 'Source', 'orderSourceText', 'OrderSourceText')
  if (src !== undefined) {
    if (Number(src) === ORDER_SOURCE_IN_STORE) return true
    if (typeof src === 'string' && /in.?store|pos|store|cashier|كاشير|محل/i.test(src)) return true
    return false
  }
  return /^POS/i.test(String(orderNumber || ''))
}

export function normalizeOrderItem(it, index = 0) {
  return {
    key: String(pick(it, 'id', 'Id', 'orderItemId', 'OrderItemId') ?? `i${index}-${pick(it, 'productId', 'ProductId') ?? ''}`),
    productId: pick(it, 'productId', 'ProductId'),
    productVariantId: pick(it, 'productVariantId', 'ProductVariantId', 'variantId') ?? null,
    name:
      pick(it, 'productNameAr', 'nameAr', 'productName', 'ProductName', 'name', 'Name') ||
      pick(it.product || it.Product || {}, 'nameAr', 'name', 'NameAr', 'Name') ||
      'صنف',
    quantity: Number(pick(it, 'quantity', 'Quantity') ?? 1) || 0,
    unitPrice: Number(pick(it, 'unitPrice', 'UnitPrice', 'price', 'Price') ?? 0) || 0,
  }
}

export function normalizeOrder(raw) {
  const o = raw || {}
  const orderNumber = pick(o, 'orderNumber', 'OrderNumber')
  const rawItems = pick(o, 'items', 'Items', 'orderItems', 'OrderItems', 'lines', 'Lines')
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeOrderItem) : []

  const total = num(pick(o, 'totalAmount', 'TotalAmount', 'total', 'Total', 'amount', 'Amount')) ?? 0
  const paid = num(pick(o, 'paidAmount', 'PaidAmount', 'amountPaid', 'AmountPaid', 'paid', 'Paid', 'amountReceived'))
  const remainingRaw = num(pick(o, 'remainingAmount', 'RemainingAmount', 'remaining', 'Remaining', 'balanceDue', 'BalanceDue'))
  const remaining = remainingRaw ?? (paid !== null ? round2(total - paid) : null)

  const statusRaw = pick(o, 'status', 'Status')
  return {
    raw: o,
    id: pick(o, 'id', 'Id'),
    orderNumber: orderNumber ?? pick(o, 'id', 'Id'),
    createdAt: pick(o, 'orderDate', 'OrderDate', 'createdAt', 'CreatedAt', 'date'),
    customerId: pick(o, 'customerId', 'CustomerId') ?? pick(o.customer || o.Customer || {}, 'id', 'Id'),
    customerName: pick(o, 'customerName', 'CustomerName') || pick(o.customer || o.Customer || {}, 'fullName', 'FullName', 'name') || '',
    customerPhone: pick(o, 'customerPhone', 'CustomerPhone', 'phone', 'Phone') || pick(o.customer || o.Customer || {}, 'phone', 'Phone', 'phoneNumber') || '',
    isPos: detectPos(o, orderNumber),
    status: statusRaw,
    statusLabel: pick(o, 'statusText', 'StatusText') || statusRaw,
    paymentMethod: pick(o, 'paymentMethod', 'PaymentMethod'),
    paymentLabel: pick(o, 'paymentMethodText', 'PaymentMethodText') || pick(o, 'paymentMethod', 'PaymentMethod'),
    subtotal: num(pick(o, 'subTotal', 'SubTotal', 'subtotal')) ?? 0,
    discount: num(pick(o, 'discountAmount', 'DiscountAmount', 'discount')) ?? 0,
    tax: num(pick(o, 'taxAmount', 'TaxAmount', 'tax')) ?? 0,
    shipping: num(pick(o, 'shippingCost', 'ShippingCost')) ?? 0,
    total,
    paid,
    remaining,
    items,
  }
}

export function isCancelledStatus(status) {
  return /cancel|ملغ|ملغي/i.test(String(status ?? ''))
}

/** شكل الفاتورة المتوقع من printInvoice */
export function toPrintableInvoice(order) {
  return {
    invoice: {
      orderNumber: String(order.orderNumber ?? ''),
      createdAt: order.createdAt,
      paymentMethod: order.paymentLabel || '',
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      shippingCost: order.shipping,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    },
    customer: { fullName: order.customerName || 'عميل نقدي', phone: order.customerPhone || '-' },
  }
}