// File: src/pages/Shop/ShopPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { Filter, Loader2, PackageSearch, Search, Wrench } from 'lucide-react'
import ProductCard from '../../components/storefront/ProductCard'
import ProductFiltersPanel from '../../components/storefront/ProductFiltersPanel'
import Pagination from '../../components/ui/Pagination'
import { getCategories, getProducts } from '../../api/storefrontApi'
import { useStorefrontSearch } from '../../context/StorefrontSearchContext'
import { collectUniqueValues, normalizeCategoriesResponse, normalizeProductsResponse } from '../../utils/catalog'

export default function ShopPage() {
  const { searchInput, setSearchInput } = useStorefrontSearch()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(20)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({
    categoryId: null,
    brand: '',
    material: '',
    finish: '',
    minPrice: '',
    maxPrice: '',
  })
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, filters.categoryId, filters.brand, filters.material, filters.finish, filters.minPrice, filters.maxPrice])

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(normalizeCategoriesResponse(data))
      })
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let isActive = true

    setIsLoading(true)
    setError(null)

    const requestParams = {
      search: debouncedSearch || undefined,
      categoryId: filters.categoryId ?? undefined,
      brand: filters.brand.trim() || undefined,
      material: filters.material.trim() || undefined,
      finish: filters.finish.trim() || undefined,
      minPrice: filters.minPrice !== '' ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice !== '' ? filters.maxPrice : undefined,
      pageNumber: currentPage,
      pageSize,
    }

    getProducts(requestParams)
      .then((data) => {
        if (!isActive) return

        const items = data?.items ?? data?.Items ?? data?.data?.items ?? data?.Data?.Items ?? data
        const total = Number(data?.totalCount ?? data?.TotalCount ?? data?.count ?? data?.Count ?? (Array.isArray(items) ? items.length : 0))
        const nextTotalPages = Math.max(1, Math.ceil(total / pageSize))

        const normalized = normalizeProductsResponse(items)
        setProducts(normalized)
        setTotalPages(nextTotalPages)

        if (currentPage > nextTotalPages) {
          setCurrentPage(nextTotalPages)
        }
      })
      .catch((err) => {
        if (!isActive) return

        setError(err?.message || 'تعذر تحميل المنتجات')
        setProducts([])
        setTotalPages(1)
      })
      .finally(() => {
        if (!isActive) return

        setIsLoading(false)
      })
    return () => {
      isActive = false
    }
  }, [currentPage, pageSize, debouncedSearch, filters])

  const safeProducts = Array.isArray(products) ? products : []
  const safeCategories = Array.isArray(categories) ? categories : []

  const brandOptions = useMemo(() => collectUniqueValues(safeProducts, 'brand'), [safeProducts])
  const materialOptions = useMemo(() => collectUniqueValues(safeProducts, 'material'), [safeProducts])
  const finishOptions = useMemo(() => collectUniqueValues(safeProducts, 'finish'), [safeProducts])

  const visibleProducts = safeProducts

  const activeFilterCount =
    (filters.categoryId ? 1 : 0) +
    (filters.brand.trim() ? 1 : 0) +
    (filters.material.trim() ? 1 : 0) +
    (filters.finish.trim() ? 1 : 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (searchInput.trim() ? 1 : 0)

  function handleFilterChange(updater) {
    const currentSnapshot = { searchInput, ...filters }
    const next = typeof updater === 'function' ? updater(currentSnapshot) : updater

    if (Object.prototype.hasOwnProperty.call(next, 'searchInput')) {
      setSearchInput(next.searchInput)
    }

    setFilters((current) => {
      const { searchInput: _searchInput, ...rest } = next
      return { ...current, ...rest }
    })
  }

  function resetFilters() {
    setSearchInput('')
    setDebouncedSearch('')
    setFilters({ categoryId: null, brand: '', material: '', finish: '', minPrice: '', maxPrice: '' })
    setCurrentPage(1)
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-graphite-900 text-white">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">متجر الأدوات · الخامات · التشطيبات</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl" dir="auto">
            اكتشف المنتجات، فلتر بدقة، واختر المتغير المناسب لاحتياجك.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/70" dir="auto">
            تصفح الكتالوج بالعربية، استخدم الفلاتر المتقدمة حسب البراند أو الخامة أو التشطيب، ثم أكمل الشراء من السلة أو صفحة الدفع.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xl">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="ابحث باسم المنتج أو الكود"
                className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-amber focus:bg-white/15 focus:ring-2 focus:ring-amber/20"
              />
            </div>

            <button
              onClick={() => setIsFiltersOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:border-amber/50 hover:bg-white/15 lg:hidden"
            >
              <Filter size={18} />
              الفلاتر
              {activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-semibold text-graphite-900">{activeFilterCount}</span>}
            </button>
          </div>
        </div>
        <div className="receipt-tear relative opacity-20" />
      </section>

      {/* سكشن استفسارات الورش والصيانة الجديد */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6" dir="rtl">
        <div className="rounded-2xl border border-amber/35 bg-gradient-to-r from-amber/10 via-surface to-surface p-5 sm:p-6 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-graphite-900 text-amber shrink-0 shadow-subtle">
              <Wrench size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-semibold text-ink">هل تواجه مشكلة في معدة أو تحتاج صيانة خاصة؟</h2>
              <p className="text-xs text-ink-soft mt-0.5">ارفع صورة المشكلة، صف حالتها، واختار طريقة الاستلام (مندوب أو زيارة الورشة).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('سيتم فتح نموذج استفسارات الصيانة والورش قريباً!')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-graphite-900 px-5 py-3 text-xs font-semibold text-amber shadow-subtle hover:bg-graphite-800 transition shrink-0 w-full sm:w-auto"
          >
            طلب صيانة واستفسار ورشة
          </button>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5 shadow-subtle">
              <ProductFiltersPanel
                categories={safeCategories}
                filters={{ searchInput, ...filters }}
                onChange={handleFilterChange}
                onReset={resetFilters}
                brands={brandOptions}
                materials={materialOptions}
                finishes={finishOptions}
              />
            </div>
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm text-ink-soft">
                {activeFilterCount > 0 ? `تم تطبيق ${activeFilterCount} فلتر` : 'لا توجد فلاتر نشطة'}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-sm font-medium text-amber-dark">
                  مسح الكل
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-ink-soft">
                <Loader2 className="animate-spin" size={18} />
                جاري تحميل المنتجات...
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                <PackageSearch size={32} className="text-ink-soft/50" />
                <p className="text-sm text-ink-soft">لا توجد منتجات تطابق هذه المعايير.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        </div>
      </section>

      {isFiltersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-graphite-950/50"
            onClick={() => setIsFiltersOpen(false)}
            aria-label="إغلاق الفلاتر"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl">
            <ProductFiltersPanel
              categories={safeCategories}
              filters={{ searchInput, ...filters }}
              onChange={(filterNameChange) => handleFilterChange((filter) => ({ ...filter, ...filterNameChange }))}
              onReset={resetFilters}
              onClose={() => setIsFiltersOpen(false)}
              brands={brandOptions}
              materials={materialOptions}
              finishes={finishOptions}
            />
          </div>
        </div>
      )}
    </div>
  )
}