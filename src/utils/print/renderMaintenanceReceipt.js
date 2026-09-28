// File: src/utils/print/renderMaintenanceReceipt.js
import { escapeHtml, formatMoney, buildDocumentHeader } from './shared'

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
  @page { size: A5; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', Arial, sans-serif; color: #111; background: #fff; font-size: 12px; }
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
</body>
</html>`
}
