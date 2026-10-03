// File: src/hooks/usePosScannerFocus.js
import { useEffect } from "react";

const EDITABLE = ["INPUT", "TEXTAREA", "SELECT"];
const isEditable = (el) => !!el && (EDITABLE.includes(el.tagName) || el.isContentEditable);

/**
 * Focus trap for hands-free barcode / QR scanning. A scanner "types" into whatever has focus, so the
 * search box must be the default target:
 *   • click on dead space (focus falls to <body>)      → search box gets focus back
 *   • window regains focus (e.g. after the print dialog) → search box gets focus back
 *   • a printable key arrives while focus is on a button / body (the scanner started typing) →
 *     focus moves to the search box BEFORE the character lands, so the scan is read in full
 * Fields the cashier is typing in (qty, discount, customer, modals) are never hijacked.
 * `suspended` turns the trap off while a modal is open.
 */
export default function usePosScannerFocus(searchRef, { suspended = false } = {}) {
  useEffect(() => {
    if (suspended) return undefined;
    const focusSearch = () => searchRef.current?.focus({ preventScroll: true });

    const onFocusOut = (e) => {
      if (e.relatedTarget) return;
      setTimeout(() => {
        const a = document.activeElement;
        if (!a || a === document.body) focusSearch();
      }, 0);
    };
    const onWindowFocus = () => {
      const a = document.activeElement;
      if (!a || a === document.body) focusSearch();
    };
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const a = document.activeElement;
      if (a === searchRef.current || isEditable(a)) return;
      if (a && (a.tagName === "BUTTON" || a.tagName === "A") && e.key === " ") return; // Space activates buttons
      focusSearch();
    };

    window.addEventListener("focusout", onFocusOut);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [searchRef, suspended]);
}
