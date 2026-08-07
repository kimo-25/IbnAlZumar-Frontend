import { X } from 'lucide-react'

const CATEGORY_ALL = { id: null, name: 'كل المنتجات' }

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink shadow-subtle outline-none transition focus:border-amber focus:ring-2 focus:ring-amber/20 ${props.className || ''}`}
    />
  )
}

export default function ProductFiltersPanel({
  categories = [],
  filters,
  onChange,
  onReset,
  onClose,
  brands = [],
  materials = [],
  finishes = [],
}) {
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">الفلاتر المتقدمة</p>
          <p className="text-xs text-ink-soft">اعثر على المنتج المناسب بسرعة</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-full border border-border p-2 text-ink-soft transition hover:text-ink" aria-label="إغلاق الفلاتر">
            <X size={16} />
          </button>
        )}
      </div>

      <Field label="بحث سريع">
        <Input
          type="search"
          value={filters.searchInput}
          onChange={(event) => update('searchInput', event.target.value)}
          placeholder="ابحث بالاسم أو الكود"
        />
      </Field>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-ink">التصنيفات</span>
        <div className="flex flex-wrap gap-2">
          {[CATEGORY_ALL, ...categories].map((category) => {
            const active = String(filters.categoryId ?? '') === String(category.id ?? '')
            return (
              <button
                key={category.id ?? 'all'}
                onClick={() => update('categoryId', category.id ?? null)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? 'border-amber bg-amber/10 text-amber-dark'
                    : 'border-border bg-surface text-ink-soft hover:border-amber/60 hover:text-ink'
                }`}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      <Field label="البراند">
        <Input
          list="brands-list"
          value={filters.brand}
          onChange={(event) => update('brand', event.target.value)}
          placeholder="مثال: Bosch"
        />
        <datalist id="brands-list">
          {brands.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
      </Field>

      <Field label="الخامة">
        <Input
          list="materials-list"
          value={filters.material}
          onChange={(event) => update('material', event.target.value)}
          placeholder="مثال: MDF"
        />
        <datalist id="materials-list">
          {materials.map((material) => (
            <option key={material} value={material} />
          ))}
        </datalist>
      </Field>

      <Field label="التشطيب">
        <Input
          list="finishes-list"
          value={filters.finish}
          onChange={(event) => update('finish', event.target.value)}
          placeholder="مثال: Matte"
        />
        <datalist id="finishes-list">
          {finishes.map((finish) => (
            <option key={finish} value={finish} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="السعر من">
          <Input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => update('minPrice', event.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="السعر إلى">
          <Input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => update('maxPrice', event.target.value)}
            placeholder="9999"
          />
        </Field>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-amber/60"
        >
          إعادة ضبط
        </button>
      </div>
    </div>
  )
}