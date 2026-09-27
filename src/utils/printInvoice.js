// File: src/utils/printInvoice.js
// Kept for backward compatibility with existing `import { printInvoice } from '../../utils/printInvoice'`
// call sites. The real implementation now lives in src/utils/print/ (format-aware: thermal80/58,
// A4, A5) — see ARCHITECTURE.md §4.8. New code should import from '../../utils/print' directly.
export { printInvoice, PRINT_FORMAT, PRINT_FORMAT_LABELS } from './print/index'
