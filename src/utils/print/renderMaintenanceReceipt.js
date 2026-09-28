// File: src/utils/print/renderMaintenanceReceipt.js
import { escapeHtml, formatMoney, buildDocumentHeader } from './shared'

const CODE128_BARS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
]

function getTicketCode(receipt) {
  const raw = receipt?.ticketNumber || receipt?.number || receipt?.id || receipt?.ticketId || '000001'
  const value = String(raw)
  return value.toUpperCase().startsWith('MNT-') ? value : `MNT-${value.padStart(6, '0')}`
}

function buildBarcodeSvg(value) {
  const source = String(value).replace(/[^\x20-\x7E]/g, '').slice(0, 20) || 'MNT-000001'
  const values = [104, ...Array.from(source, (character) => character.charCodeAt(0) - 32)]
  const checksum = values.slice(1).reduce((sum, code, index) => sum + code * (index + 1), 104) % 103
  const patterns = [...values, checksum, 106].map((code) => CODE128_BARS[code])
  let x = 0
  const bars = []
  patterns.forEach((pattern) => {
    for (let index = 0; index < pattern.length; index += 2) {
      const barWidth = Number(pattern[index])
      const spaceWidth = Number(pattern[index + 1] || 0)
      bars.push(`<rect x="${x}" y="0" width="${barWidth}" height="34" />`)
      x += barWidth + spaceWidth
    }
  })
  return `<svg class="barcode" viewBox="0 0 ${x} 34" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(value)}">${bars.join('')}</svg>`
}

// A5 repair receipt (§4.8: "delivery note, payment voucher, maintenance ticket... print on A5").
// Kept as its own renderer rather than overloading renderA5Document's generic items-table,
// since a repair receipt needs a labor-cost line that isn't a quantity × unit-price row.
export function renderMaintenanceReceipt(receipt) {
  const header = buildDocumentHeader({
    documentTitle: 'إيصال صيانة',
    documentNumber: receipt.ticketNumber,
    createdAt: receipt.createdAt,
  })

  const partRows = (receipt.parts || [])
    .map(
      (part) => `
        <tr>
          <td>${escapeHtml(part.productName)}</td>
          <td class="num">${escapeHtml(part.quantity)}</td>
          <td class="num">${formatMoney(part.unitCostPrice)}</td>
          <td class="num">${formatMoney(part.lineTotal)}</td>
        </tr>
      `
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(receipt.ticketNumber)}</title>
<style>
  @media print {
    @page { size: A5 portrait; margin: 6mm; }
    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
    .receipt-a5-container { width: 100%; max-width: 148mm; font-size: 12px; box-sizing: border-box; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Cairo', Arial, sans-serif; color: #111; background: #fff; font-size: 12px; }
  .doc-header { text-align: center; border-bottom: 1.5px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
  .store-name { font-size: 15px; font-weight: 800; }
  .document-title { font-size: 12px; margin-top: 2px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px; }
  .customer-block { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
  .problem-block { margin-bottom: 10px; padding: 6px 8px; background: #f4f5f7; border-radius: 4px; font-size: 11px; }
  table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.items-table th, table.items-table td { border: 1px solid #ccc; padding: 5px; font-size: 10px; }
  td.num, th.num { text-align: center; }
  .totals-block { width: 220px; margin-inline-start: auto; font-size: 11px; }
  .totals-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .totals-row.grand-total { font-weight: 800; border-top: 1.5px solid #111; padding-top: 4px; }
  .status-badge { display: inline-block; margin-top: 6px; font-size: 10px; font-weight: 700; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body onload="window.focus()">
  <main class="receipt-a5-container">
    ${header}
    <div class="customer-block">
      <span>العميل: <strong>${escapeHtml(receipt.customerName || 'عميل نقدي')}</strong></span>
      <span>الهاتف: ${escapeHtml(receipt.customerPhone || '-')}</span>
    </div>
    <div class="problem-block">
      <strong>وصف العطل:</strong> ${escapeHtml(receipt.problemDescription)}
      <div class="status-badge">الحالة: ${escapeHtml(receipt.statusLabel)}</div>
    </div>
    ${
      partRows
        ? `<table class="items-table">
            <thead><tr><th>قطعة الغيار</th><th class="num">الكمية</th><th class="num">السعر</th><th class="num">الإجمالي</th></tr></thead>
            <tbody>${partRows}</tbody>
          </table>`
        : ''
    }
    <div class="totals-block">
      <div class="totals-row"><span>المصنعية</span><span>${formatMoney(receipt.laborCost)}</span></div>
      <div class="totals-row"><span>قطع الغيار</span><span>${formatMoney(receipt.partsTotal)}</span></div>
      <div class="totals-row grand-total"><span>الإجمالي</span><span>${formatMoney(receipt.total)}</span></div>
    </div>
  </main>
</body>
</html>`
}

export function renderMaintenanceDeviceLabel(ticket) {
  const code = getTicketCode(ticket)
  const receivedAt = ticket?.createdAt || ticket?.receivedAt
  const customerName = ticket?.customerName || ticket?.guestName || 'عميل نقدي'
  const customerPhone = ticket?.customerPhone || ticket?.guestPhone || '-'
  const problem = String(ticket?.problemDescription || ticket?.description || '').trim()
  const receivedDate = receivedAt
    ? new Date(receivedAt).toLocaleDateString('ar-EG')
    : new Date().toLocaleDateString('ar-EG')

  const labelCell = `
    <div class="single-label-cell" dir="rtl">
      <div class="shop-name">ابن الزمر للصيانة</div>
      <div class="ticket-code">${escapeHtml(code)}</div>
      ${buildBarcodeSvg(code)}
      <div class="details">
        <div class="detail">${escapeHtml(customerName)}</div>
        <div class="detail" dir="ltr">${escapeHtml(customerPhone)}</div>
      </div>
      <div class="problem">${escapeHtml(problem || 'جهاز صيانة')}</div>
      <div>${escapeHtml(receivedDate)}</div>
    </div>`

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(code)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { width: 100mm; height: 30mm; margin: 0; padding: 0; background: #fff; }
  body { font-family: 'Cairo', Arial, sans-serif; color: #111; }
  .device-label-container { display: flex; flex-direction: row; width: 100mm; height: 30mm; }
  .single-label-cell { flex: 0 0 50mm; width: 50mm; height: 30mm; padding: 2mm; font-size: 9px; text-align: center; overflow: hidden; }
  .shop-name { font-size: 10px; font-weight: 800; line-height: 1.1; }
  .ticket-code { font-family: monospace; font-size: 12px; font-weight: 800; direction: ltr; line-height: 1; }
  .barcode { display: block; width: 100%; height: 9mm; margin: 1mm 0; fill: #111; }
  .details { display: grid; grid-template-columns: 1fr 1fr; gap: 0 2mm; text-align: right; line-height: 1.2; }
  .detail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .problem { margin-top: 0.5mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  @media print {
    @page { size: 100mm 30mm; margin: 0; }
    html, body { width: 100mm; height: 30mm; margin: 0; padding: 0; }
    .device-label-container { display: flex; flex-direction: row; width: 100mm; height: 30mm; }
    .single-label-cell { width: 50mm; height: 30mm; padding: 2mm; font-size: 9px; text-align: center; overflow: hidden; }
  }
</style>
</head>
<body onload="window.focus()" dir="ltr">
  <main class="device-label-container">
    ${labelCell}
    ${labelCell}
  </main>
</body>
</html>`
}
