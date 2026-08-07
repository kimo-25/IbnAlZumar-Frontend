import Card from '../../components/ui/Card'

const SPEC_KEY_TRANSLATIONS = {
  'handle material': 'مادة اليد',
  'max pull': 'أقصى قوة سحب',
  'cup diameter': 'قطر العين / الكأس',
  unit: 'الوحدة',
  'catalog qty/carton': 'الكمية في الكرتونة',
  material: 'الخامة',
  length: 'الطول',
}

function normalizeSpecKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function translateSpecKey(key) {
  const normalizedKey = normalizeSpecKey(key)
  return SPEC_KEY_TRANSLATIONS[normalizedKey] || key
}

export default function ProductSpecTable({ specs = [] }) {
  if (!specs.length) {
    return (
      <Card title="المواصفات">
        <p className="text-sm text-ink-soft">لا توجد مواصفات إضافية لهذا المنتج حالياً.</p>
      </Card>
    )
  }

  return (
    <Card title="المواصفات">
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {specs.map((spec, index) => (
          <div key={`${spec.key || spec.label || index}`} className="grid grid-cols-[1fr_1.4fr] gap-3 px-4 py-3 text-sm">
            <dt className="font-medium text-ink">{translateSpecKey(spec.key || spec.label)}</dt>
            <dd className="text-ink-soft" dir="auto">
              {spec.value}
            </dd>
          </div>
        ))}
      </div>
    </Card>
  )
}