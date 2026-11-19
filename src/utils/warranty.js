export function normalizeWarrantyFields(source = {}) {
  const hasWarranty = Boolean(source.hasWarranty ?? source.HasWarranty)
  const isLifetimeWarranty = hasWarranty && Boolean(source.isLifetimeWarranty ?? source.IsLifetimeWarranty)
  const rawMonths = source.warrantyMonths ?? source.WarrantyMonths
  const warrantyMonths = hasWarranty && !isLifetimeWarranty && Number(rawMonths) > 0
    ? Number(rawMonths)
    : null

  return { hasWarranty, warrantyMonths, isLifetimeWarranty }
}

export function appendWarrantyFormData(formData, source = {}) {
  const warranty = normalizeWarrantyFields(source)
  formData.append('hasWarranty', String(warranty.hasWarranty))
  formData.append('warrantyMonths', warranty.warrantyMonths === null ? '' : String(warranty.warrantyMonths))
  formData.append('isLifetimeWarranty', String(warranty.isLifetimeWarranty))
}

export function getApiErrorMessage(error, fallback = 'حدث خطأ أثناء حفظ المنتج.') {
  const data = error?.response?.data
  const message = data?.message || error?.message
  const details = data?.errors ?? error?.errors

  if (Array.isArray(details)) {
    const messages = details
      .map((item) => typeof item === 'string' ? item : item?.message || item?.Message || Object.values(item || {}).flat().join('، '))
      .filter(Boolean)
    if (messages.length > 0) return `${message ? `${message}: ` : ''}${messages.join('؛ ')}`
  } else if (details && typeof details === 'object') {
    const messages = Object.values(details).flat().filter(Boolean)
    if (messages.length > 0) return `${message ? `${message}: ` : ''}${messages.join('؛ ')}`
  }

  return message || fallback
}

export function getWarrantyLabel(item = {}) {
  const warranty = normalizeWarrantyFields(item)
  if (!warranty.hasWarranty) return ''
  if (warranty.isLifetimeWarranty) return 'ضمان مدى الحياة'

  const endDate = item.warrantyEndDate ?? item.WarrantyEndDate
  const endLabel = endDate ? ` — ينتهي ${String(endDate).slice(0, 10)}` : ''
  return warranty.warrantyMonths ? `ضمان ${warranty.warrantyMonths} شهر${endLabel}` : 'ضمان'
}
