// File: src/hooks/usePosKeyboardShortcuts.js
import { useEffect } from 'react';

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}

/**
 * اختصارات لوحة المفاتيح لشاشة الكاشير.
 * - F1 / Ctrl+K  : فوكس على البحث
 * - F2           : دفع نقدي سريع
 * - F3           : فوكس على بحث العملاء
 * - F4           : فوكس على حقل الخصم
 * - F8           : تعليق الطلب
 * - F9           : أمر صوتي (فاتورة صوتية)
 * - ArrowUp/Down : التنقل بين سطور السلة (خارج حقول الإدخال)
 * - + / -        : زيادة/تقليل كمية السطر المحدد
 * - Delete       : حذف السطر المحدد
 */
export default function usePosKeyboardShortcuts({
  enabled = true,
  onFocusSearch,
  onCashCheckout,
  onSelectCustomer,
  onFocusDiscount,
  onHoldOrder,
  onVoiceOrder,
  onCartNavigate,
  onQuantityDelta,
  onRemoveSelected,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (e) => {
      const key = e.key;

      // منع المتصفح من عمل reload / help على أزرار F
      if (/^F\d+$/.test(key)) e.preventDefault();

      if ((e.ctrlKey || e.metaKey) && (key === 'k' || key === 'K')) {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      switch (key) {
        case 'F1': onFocusSearch?.(); return;
        case 'F2': onCashCheckout?.(); return;
        case 'F3': onSelectCustomer?.(); return;
        case 'F4': onFocusDiscount?.(); return;
        case 'F8': onHoldOrder?.(); return;
        case 'F9': onVoiceOrder?.(); return;

        case 'ArrowUp':
          if (!isTypingTarget(e.target)) {
            e.preventDefault();
            onCartNavigate?.(-1);
          }
          return;

        case 'ArrowDown':
          if (!isTypingTarget(e.target)) {
            e.preventDefault();
            onCartNavigate?.(1);
          }
          return;

        case '+':
        case '=':
          if (!isTypingTarget(e.target)) {
            e.preventDefault();
            onQuantityDelta?.(1);
          }
          return;

        case '-':
        case '_':
          if (!isTypingTarget(e.target)) {
            e.preventDefault();
            onQuantityDelta?.(-1);
          }
          return;

        case 'Delete':
          if (!isTypingTarget(e.target)) {
            e.preventDefault();
            onRemoveSelected?.();
          }
          return;

        default:
          return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    enabled,
    onFocusSearch,
    onCashCheckout,
    onSelectCustomer,
    onFocusDiscount,
    onHoldOrder,
    onVoiceOrder,
    onCartNavigate,
    onQuantityDelta,
    onRemoveSelected,
  ]);
}