// File: src/utils/print/shared.js
export function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatMoney(value) {
  const number = Number(value) || 0
  return `${number.toFixed(2)} EGP`
}

export function formatCairoTimestamp(isoString) {
  const date = isoString ? new Date(isoString) : new Date()
  return date.toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' })
}

export function buildDocumentHeader({ storeName = 'ابن الزمر — Ibn Al-Zumar', documentTitle, documentNumber, issuedByName, createdAt }) {
  return `
    <div class="doc-header">
      <div class="store-name">${escapeHtml(storeName)}</div>
      <div class="document-title">${escapeHtml(documentTitle)}</div>
      <div class="meta-row">
        <span>رقم: <strong>${escapeHtml(documentNumber)}</strong></span>
        <span>${escapeHtml(formatCairoTimestamp(createdAt))}</span>
      </div>
      ${issuedByName ? `<div class="meta-row"><span>بواسطة: ${escapeHtml(issuedByName)}</span></div>` : ''}
    </div>
  `
}

export function buildItemsTable(items) {
  const rows = (items || [])
    .map((item) => {
      const lineTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)
      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${formatMoney(item.unitPrice)}</td>
          <td class="num">${formatMoney(lineTotal)}</td>
        </tr>
      `
    })
    .join('')

  return `
    <table class="items-table bordered">
      <thead>
        <tr>
          <th>الصنف</th>
          <th class="num">الكمية</th>
          <th class="num">السعر</th>
          <th class="num">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

export function buildTotalsBlock({ subtotal, discount, tax, shippingCost, total }) {
  return `
    <div class="totals-block">
      <div class="totals-row"><span>المبلغ الجزئي</span><span>${formatMoney(subtotal)}</span></div>
      ${discount ? `<div class="totals-row discount"><span>الخصم</span><span>- ${formatMoney(discount)}</span></div>` : ''}
      ${shippingCost ? `<div class="totals-row"><span>الشحن</span><span>${formatMoney(shippingCost)}</span></div>` : ''}
      <div class="totals-row"><span>الضريبة</span><span>${formatMoney(tax)}</span></div>
      <div class="totals-row grand-total"><span>الإجمالي النهائي</span><span>${formatMoney(total)}</span></div>
    </div>
  `
}

export function openPrintWindow(html) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    alert('الرجاء السماح بالنوافذ المنبثقة (Pop-ups) لطباعة الفاتورة.')
    return
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    printWindow.print()
  }
}
