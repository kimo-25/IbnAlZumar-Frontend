export const TRACKING_STEPS = [
  { step: 1, label: 'قيد المراجعة' },
  { step: 2, label: 'تم التأكيد' },
  { step: 3, label: 'جاري التجهيز' },
  { step: 4, label: 'في الطريق إليك' },
  { step: 5, label: 'تم التوصيل' }
]

export function calculateShippingCost(governorate) {
  if (!governorate) return 50

  const gov = governorate.trim().toLowerCase()

  if (
    gov.includes('إسكندرية') ||
    gov.includes('alexandria')
  ) {
    return 40
  }

  if (
    gov.includes('قاهرة') ||
    gov.includes('cairo') ||
    gov.includes('جيزة') ||
    gov.includes('giza')
  ) {
    return 50
  }

  return 70
}

export function getStepNumber(status) {
  if (status === null || status === undefined) {
    return 1
  }

  if (typeof status === 'number') {
    if (status === -1 || status === 5) {
      return -1
    }

    if (status >= 0 && status <= 4) {
      return status + 1
    }

    return 1
  }

  const s = String(status).toLowerCase().trim()

  if (
    s.includes('cancel') ||
    s.includes('ملغ') ||
    s.includes('reject')
  ) {
    return -1
  }

  if (
    s.includes('pending') ||
    s.includes('مراجعة') ||
    s.includes('انتظار')
  ) {
    return 1
  }

  if (
    s.includes('confirm') ||
    s.includes('تأكيد') ||
    s.includes('مؤكد')
  ) {
    return 2
  }

  if (
    s.includes('prep') ||
    s.includes('process') ||
    s.includes('تجهيز')
  ) {
    return 3
  }

  if (
    s.includes('ship') ||
    s.includes('way') ||
    s.includes('طريق') ||
    s.includes('شحن')
  ) {
    return 4
  }

  if (
    s.includes('complet') ||
    s.includes('deliver') ||
    s.includes('تم') ||
    s.includes('مكتمل') ||
    s.includes('توصيل')
  ) {
    return 5
  }

  return 1
}

export function getStatusBadge(status) {
  const step = getStepNumber(status)

  if (step === -1) {
    return {
      label: 'تم إلغاء الطلب',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      iconName: 'cancel'
    }
  }

  if (step === 5) {
    return {
      label: 'تم التوصيل بنجاح',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconName: 'success'
    }
  }

  const label =
    TRACKING_STEPS[step - 1]?.label || 'قيد المراجعة'

  return {
    label,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    iconName: 'pending'
  }
}

export function formatDate(dateStr) {
  if (!dateStr) {
    return new Date().toLocaleDateString('ar-EG')
  }

  try {
    const d = new Date(dateStr)

    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
  } catch {
    return dateStr
  }
}