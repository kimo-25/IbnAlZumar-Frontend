export function normalizeWarrantyFields(source = {}) {
  const hasWarranty = Boolean(source.hasWarranty ?? source.HasWarranty)
  const isLifetimeWarranty = hasWarranty && Boolean(source.isLifetimeWarranty ?? source.IsLifetimeWarranty)
  const rawMonths = source.warrantyMonths ?? source.WarrantyMonths
  const warrantyMonths = hasWarranty && !isLifetimeWarranty && Number(rawMonths) > 0
    ? Number(rawMonths)
    : null

  return { hasWarranty, warrantyMonths, isLifetimeWarranty }
}

export function getWarrantyLabel(item = {}) {
  const warranty = normalizeWarrantyFields(item)
  if (!warranty.hasWarranty) return ''
  if (warranty.isLifetimeWarranty) return 'ضمان مدى الحياة'

  const endDate = item.warrantyEndDate ?? item.WarrantyEndDate
  const endLabel = endDate ? ` — ينتهي ${String(endDate).slice(0, 10)}` : ''
  return warranty.warrantyMonths ? `ضمان ${warranty.warrantyMonths} شهر${endLabel}` : 'ضمان'
}
