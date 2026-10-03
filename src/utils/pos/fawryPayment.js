// File: src/utils/pos/fawryPayment.js
// طريقة الدفع "فوري" (Fawry). معرّفة هنا بدل تعديل paymentOptions.js حتى لا نمس ملف الدفع الحالي.
// لو الـ enum عند الباك إند رقمي (مثلاً Fawry = 5) غيّر serverMethod هنا فقط — مكان واحد.
export const FAWRY_SERVER_METHOD = 'Fawry'

export const FAWRY_OPTION = {
  key: 'fawry',
  label: 'فوري',
  hint: 'Fawry',
  serverMethod: FAWRY_SERVER_METHOD,
  receiptLabel: 'فوري (Fawry)',
}

/** يضيف فوري لقائمة خيارات الدفع لو مش موجود بالفعل. */
export function withFawry(options = []) {
  return options.some((o) => o.key === FAWRY_OPTION.key) ? options : [...options, FAWRY_OPTION]
}

/** بديل لـ PAYMENT_BY_KEY[uiKey] يعرف فوري. */
export function resolvePaymentOption(paymentByKey, uiKey) {
  return paymentByKey?.[uiKey] || (uiKey === FAWRY_OPTION.key ? FAWRY_OPTION : null)
}