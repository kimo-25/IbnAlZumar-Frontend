// File: src/utils/print/barcodePrinter.js
// طباعة ملصقات باركود المنتجات (Code128) على نفس رول ملصقات الأجهزة: 100mm × 30mm، ملصقين جنب بعض (50×30 لكل ملصق).
// الطباعة صامتة عبر iframe مخفي (openPrintFrame) علشان الفوكس يفضل على شاشة الكاشير.
import { escapeHtml, formatMoney, openPrintFrame } from './shared'
import { buildBarcodeSvg } from './renderMaintenanceReceipt'

export const MAX_LABEL_COPIES = 500
export const LABEL_WIDTH_MM = 50
export const LABEL_HEIGHT_MM = 30
export const STORE_LABEL_NAME = 'ابن الزمر'

/** يحوّل الأرقام العربية/الفارسية إلى 0-9 ويشيل أي حرف خارج ASCII المطبوع (Code128-B). */
export function normalizeBarcodeValue(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
}

export function clampCopies(value) {
  const n = Math.floor(Number(value))
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, MAX_LABEL_COPIES)
}

function buildLabelCell({ name, code, price, showPrice }) {
  return `
    <div class="label-cell">
      <div class="shop">${escapeHtml(STORE_LABEL_NAME)}</div>
      <div class="name">${escapeHtml(name)}</div>
      ${buildBarcodeSvg(code)}
      <div class="code">${escapeHtml(code)}</div>
      ${showPrice && price !== undefined && price !== null && price !== '' ? `<div class="price">${formatMoney(price)}</div>` : ''}
    </div>`
}

/**
 * @param {{name: string, barcode: string, price?: number}} entry
 * @param {{copies?: number, columns?: 1|2, showPrice?: boolean}} options
 */
export function renderProductBarcodeLabels(entry, { copies = 1, columns = 2, showPrice = true } = {}) {
  const code = normalizeBarcodeValue(entry?.barcode)
  if (!code) throw new Error('لا يوجد باركود صالح للطباعة لهذا المنتج.')

  const total = clampCopies(copies)
  const cols = columns === 1 ? 1 : 2
  const pageWidth = cols * LABEL_WIDTH_MM
  const cell = buildLabelCell({ name: entry.name || '', code, price: entry.price, showPrice })
  const empty = '<div class="label-cell"></div>'

  const rows = []
  for (let printed = 0; printed < total; printed += cols) {
    const inRow = Math.min(cols, total - printed)
    rows.push(`<section class="label-row">${cell.repeat(inRow)}${empty.repeat(cols - inRow)}</section>`)
  }

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(code)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: ${pageWidth}mm ${LABEL_HEIGHT_MM}mm; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; width: ${pageWidth}mm; }
  body { font-family: 'Cairo', Arial, sans-serif; color: #111; }
  .label-row { display: flex; flex-direction: row; direction: ltr; width: ${pageWidth}mm; height: ${LABEL_HEIGHT_MM}mm; overflow: hidden; page-break-after: always; break-after: page; }
  .label-row:last-child { page-break-after: auto; break-after: auto; }
  .label-cell { flex: 0 0 ${LABEL_WIDTH_MM}mm; width: ${LABEL_WIDTH_MM}mm; height: ${LABEL_HEIGHT_MM}mm; padding: 1.6mm 2mm; text-align: center; overflow: hidden; direction: rtl; }
  .shop { font-size: 8px; font-weight: 800; line-height: 1.1; }
  .name { font-size: 9px; font-weight: 700; line-height: 1.15; max-height: 2.3em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .barcode { display: block; width: 100%; height: 8mm; margin: 0.8mm 0; fill: #111; }
  .code { font-family: monospace; font-size: 10px; font-weight: 700; direction: ltr; line-height: 1; letter-spacing: 0.5px; }
  .price { font-size: 11px; font-weight: 800; line-height: 1.2; margin-top: 0.6mm; }
</style>
</head>
<body onload="window.focus()">
  ${rows.join('\n')}
</body>
</html>`
}

/** يبعت ملصقات الباركود مباشرة للطابعة. يرجّع {copies, code} أو يرمي Error لو مفيش باركود. */
export function printProductBarcodeLabels(entry, options = {}) {
  const html = renderProductBarcodeLabels(entry, options)
  openPrintFrame(html)
  return { copies: clampCopies(options.copies), code: normalizeBarcodeValue(entry.barcode) }
}