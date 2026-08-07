import Card from '../ui/Card'

const ATTRIBUTE_LABELS = {
  color: 'اللون',
  finish: 'التشطيب',
  size: 'المقاس',
  material: 'الخامة',
}

const ATTRIBUTE_ORDER = ['color', 'finish', 'size', 'material']

function collectOptions(variants, key) {
  return Array.from(
    new Set(
      variants
        .map((variant) => variant?.attributes?.[key])
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
        .map((value) => String(value).trim())
    )
  )
}

export default function ProductVariantSwitcher({ variants = [], selectedAttributes = {}, onChange }) {
  const attributeGroups = ATTRIBUTE_ORDER.map((key) => ({
    key,
    label: ATTRIBUTE_LABELS[key],
    options: collectOptions(variants, key),
  })).filter((group) => group.options.length > 0)

  if (!variants.length || !attributeGroups.length) return null

  return (
    <Card title="المتغيرات">
      <div className="space-y-4">
        {attributeGroups.map((group) => (
          <div key={group.key}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-ink">{group.label}</h3>
              {selectedAttributes[group.key] && <span className="text-xs text-ink-soft">{selectedAttributes[group.key]}</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const active = selectedAttributes[group.key] === option
                return (
                  <button
                    key={option}
                    onClick={() => onChange?.(group.key, option)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-amber bg-amber/10 text-amber-dark'
                        : 'border-border bg-surface text-ink-soft hover:border-amber/60 hover:text-ink'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}