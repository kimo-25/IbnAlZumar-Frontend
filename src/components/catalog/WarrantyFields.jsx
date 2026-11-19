import { normalizeWarrantyFields } from '../../utils/warranty'

export default function WarrantyFields({ value, onChange }) {
  const warranty = normalizeWarrantyFields(value)

  const updateWarranty = (changes) => {
    onChange({
      ...value,
      ...changes,
    })
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-3">
      <label className="flex items-center gap-2 font-bold text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={warranty.hasWarranty}
          onChange={(event) => updateWarranty(event.target.checked
            ? { hasWarranty: true }
            : { hasWarranty: false, warrantyMonths: null, isLifetimeWarranty: false })}
        />
        يشمل ضمان
      </label>

      {warranty.hasWarranty && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-ink cursor-pointer">
            <input
              type="radio"
              name="warranty-type"
              checked={warranty.isLifetimeWarranty}
              onChange={() => updateWarranty({ isLifetimeWarranty: true, warrantyMonths: null })}
            />
            ضمان مدى الحياة
          </label>
          <label className="flex items-center gap-2 text-ink cursor-pointer">
            <input
              type="radio"
              name="warranty-type"
              checked={!warranty.isLifetimeWarranty}
              onChange={() => updateWarranty({ isLifetimeWarranty: false })}
            />
            ضمان بالشهور
            <input
              type="number"
              min="1"
              required={!warranty.isLifetimeWarranty}
              value={warranty.warrantyMonths ?? ''}
              disabled={warranty.isLifetimeWarranty}
              onChange={(event) => updateWarranty({ warrantyMonths: event.target.value })}
              className="w-20 rounded-lg border border-border bg-surface p-1.5 font-mono disabled:opacity-50"
            />
          </label>
        </div>
      )}
    </div>
  )
}
