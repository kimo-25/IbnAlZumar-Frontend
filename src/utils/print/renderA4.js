// File: src/utils/print/renderA4.js
import { escapeHtml, buildDocumentHeader, buildItemsTable, buildTotalsBlock } from './shared'

export function renderA4Invoice(invoice, customer, { issuedByName } = {}) {
  const header = buildDocumentHeader({
    documentTitle: 'فاتورة ضريبية',
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
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', Arial, sans-serif; color: #111; background: #fff; }
  .doc-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
  .store-name { font-size: 20px; font-weight: 800; }
  .document-title { font-size: 15px; margin-top: 4px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; }
  .customer-block { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 13px; }
  table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  table.items-table.bordered th, table.items-table.bordered td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
  table.items-table th { background: #f4f5f7; }
  td.num, th.num { text-align: center; }
  .totals-block { width: 280px; margin-inline-start: auto; font-size: 13px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals-row.discount { color: #b91c1c; }
  .totals-row.grand-total { font-weight: 800; font-size: 15px; border-top: 2px solid #111; padding-top: 8px; margin-top: 4px; }
  .signature-area { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; }
  .signature-area div { width: 40%; border-top: 1px solid #999; text-align: center; padding-top: 6px; }
  .page-footer { text-align: center; font-size: 10px; color: #666; margin-top: 24px; }
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
  <div class="signature-area">
    <div>توقيع العميل</div>
    <div>توقيع الموظف المسؤول</div>
  </div>
  <div class="page-footer">ابن الزمر — Ibn Al-Zumar</div>
</body>
</html>`
}
