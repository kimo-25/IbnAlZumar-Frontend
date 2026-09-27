// File: src/utils/print/renderA5.js
import { escapeHtml, buildDocumentHeader, buildItemsTable, buildTotalsBlock } from './shared'

export function renderA5Document(invoice, customer, { documentTitle = 'إذن تسليم', issuedByName } = {}) {
  const header = buildDocumentHeader({
    documentTitle,
    documentNumber: invoice.orderNumber,
    issuedByName,
    createdAt: invoice.createdAt,
  })

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(invoice.orderNumber)}</title>
<style>
  @page { size: A5; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', Arial, sans-serif; color: #111; background: #fff; font-size: 12px; }
  .doc-header { text-align: center; border-bottom: 1.5px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
  .store-name { font-size: 15px; font-weight: 800; }
  .document-title { font-size: 12px; margin-top: 2px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px; }
  .customer-block { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; }
  table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.items-table.bordered th, table.items-table.bordered td { border: 1px solid #ccc; padding: 5px; font-size: 10px; }
  td.num, th.num { text-align: center; }
  .totals-block { width: 220px; margin-inline-start: auto; font-size: 11px; }
  .totals-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .totals-row.grand-total { font-weight: 800; border-top: 1.5px solid #111; padding-top: 4px; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body onload="window.focus()">
  ${header}
  <div class="customer-block">
    <span>العميل: <strong>${escapeHtml(customer?.fullName || 'عميل نقدي')}</strong></span>
    <span>الهاتف: ${escapeHtml(customer?.phone || '-')}</span>
  </div>
  ${buildItemsTable(invoice.items)}
  ${buildTotalsBlock(invoice)}
</body>
</html>`
}
