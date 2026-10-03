// File: src/utils/pos/scanInput.js
// Clean a code coming from a barcode / QR scanner (they type like a keyboard and end with Enter).

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXT_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/**
 * - strips control characters (CR/LF/TAB/NUL some scanners add as prefix/suffix)
 * - converts Arabic-Indic digits to 0-9 — with the Windows "Arabic (101)" layout active a scanner types
 *   ٠١٢٣… instead of 0123…, and only when the WHOLE code is digits (a product name keeps its characters)
 */
export function normalizeScanTerm(raw) {
  const s = String(raw ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!/^[0-9٠-٩۰-۹.\-/]+$/.test(s)) return s;
  return s.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC.indexOf(ch);
    return String(a >= 0 ? a : EXT_ARABIC_INDIC.indexOf(ch));
  });
}
