// File: src/utils/print/index.js
import { openPrintWindow, openPrintFrame } from './shared'
import { renderThermalReceipt } from './renderThermal'
import { renderA4Invoice } from './renderA4'
import { renderA5Document } from './renderA5'

export const PRINT_FORMAT = {
  THERMAL_80: 'thermal80',
  THERMAL_58: 'thermal58',
  A4: 'a4',
  A5: 'a5',
}

export const PRINT_FORMAT_LABELS = {
  [PRINT_FORMAT.THERMAL_80]: 'حراري 80مم',
  [PRINT_FORMAT.THERMAL_58]: 'حراري 58مم',
  [PRINT_FORMAT.A4]: 'A4',
  [PRINT_FORMAT.A5]: 'A5',
}

/**
 * Backward-compatible signature: printInvoice(invoice, customer, isPosOrOptions).
 *  - Legacy callers pass a boolean (`true` => POS thermal receipt, `false`/absent => A4) —
 *    exactly what every existing call site in the repo already does.
 *  - New callers pass an options object `{ format, issuedByName, silent }` to pick A4/A5/thermal58
 *    explicitly (see PosCheckoutPage.jsx's print-format selector).
 */
export function printInvoice(invoice, customer, isPosOrOptions) {
  let format = PRINT_FORMAT.A4
  let issuedByName
  let silent = false

  if (typeof isPosOrOptions === 'boolean') {
    format = isPosOrOptions ? PRINT_FORMAT.THERMAL_80 : PRINT_FORMAT.A4
  } else if (isPosOrOptions && typeof isPosOrOptions === 'object') {
    format = isPosOrOptions.format || format
    issuedByName = isPosOrOptions.issuedByName
    silent = Boolean(isPosOrOptions.silent) // POS: print in a hidden iframe, keep focus in the terminal
  }

  let html
  switch (format) {
    case PRINT_FORMAT.THERMAL_80:
      html = renderThermalReceipt(invoice, customer, { widthMm: 80 })
      break
    case PRINT_FORMAT.THERMAL_58:
      html = renderThermalReceipt(invoice, customer, { widthMm: 58 })
      break
    case PRINT_FORMAT.A5:
      html = renderA5Document(invoice, customer, { issuedByName, documentTitle: 'فاتورة كاشير' })
      break
    case PRINT_FORMAT.A4:
    default:
      html = renderA4Invoice(invoice, customer, { issuedByName })
      break
  }

  if (silent) openPrintFrame(html)
  else openPrintWindow(html)
}
