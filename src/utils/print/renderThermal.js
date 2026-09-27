// File: src/utils/print/renderThermal.js
import { escapeHtml, formatMoney, formatCairoTimestamp } from './shared'

// Thermal 80mm / 58mm receipt: monospace, no borders/background colors (thermal printers
// ignore background-color anyway), ≤ 42 chars/line at 80mm (≤ 32 at 58mm), cut-line spacer.
export function renderThermalReceipt(invoice, customer, { widthMm = 80 } = {}) {
  const maxChars = widthMm >= 80 ? 42 : 32

  const itemLines = (invoice.items || [])
    .map((item) => {
      const name = escapeHtml(item.name).slice(0, maxChars)
      const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)
      return `
        <div class="line item-line"><span>${name}</span></div>
        <div class="line item-sub">
          <span>${escapeHtml(item.quantity)} × ${formatMoney(item.unitPrice)}</span>
          <span>${formatMoney(lineTotal)}</span>
        </div>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(invoice.orderNumber)}</title>
<style>
  @page { size: ${widthMm}mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: ${widthMm}mm;
    margin: 0 auto;
    padding: 6px 4px;
    color: #000;
    background: #fff;
    font-size: 12px;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .line { display: flex; justify-content: space-between; gap: 4px; }
  .item-line { font-weight: 700; }
  .item-sub { padding-bottom: 4px; }
  .totals .line { font-weight: 700; }
  .footer { margin-top: 8px; font-size: 10px; }
  .cut-space { height: 18mm; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body onload="window.focus()">
  <div class="center bold">ابن الزمر — Ibn Al-Zumar</div>
  <div class="center">فاتورة نقاط بيع</div>
  <div class="divider"></div>
  <div class="line"><span>رقم الفاتورة</span><span>${escapeHtml(invoice.orderNumber)}</span></div>
  <div class="line"><span>التاريخ</span><span>${escapeHtml(formatCairoTimestamp(invoice.createdAt))}</span></div>
  <div class="line"><span>العميل</span><span>${escapeHtml(customer?.fullName || 'عميل نقدي')}</span></div>
  <div class="line"><span>طريقة الدفع</span><span>${escapeHtml(invoice.paymentMethod)}</span></div>
  <div class="divider"></div>
  ${itemLines}
  <div class="divider"></div>
  <div class="totals">
    <div class="line"><span>المبلغ الجزئي</span><span>${formatMoney(invoice.subtotal)}</span></div>
    ${invoice.discount ? `<div class="line"><span>الخصم</span><span>-${formatMoney(invoice.discount)}</span></div>` : ''}
    <div class="line"><span>الضريبة</span><span>${formatMoney(invoice.tax)}</span></div>
    <div class="line"><span>الإجمالي</span><span>${formatMoney(invoice.total)}</span></div>
  </div>
  <div class="divider"></div>
  <div class="center footer">شكراً لتعاملكم معنا</div>
  <div class="cut-space"></div>
</body>
</html>`
}
