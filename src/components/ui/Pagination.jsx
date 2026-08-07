import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

function range(start, end) {
  const items = []

  for (let page = start; page <= end; page += 1) {
    items.push(page)
  }

  return items
}

function getPaginationItems(currentPage, totalPages, siblingCount = 1, boundaryCount = 1) {
  if (totalPages <= 0) return []

  const totalPageNumbers = boundaryCount * 2 + siblingCount * 2 + 3

  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages)
  }

  const firstPages = range(1, Math.min(boundaryCount, totalPages))
  const lastPages = range(Math.max(totalPages - boundaryCount + 1, boundaryCount + 1), totalPages)

  const leftSibling = Math.max(currentPage - siblingCount, boundaryCount + 2)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - boundaryCount - 1)

  const items = [...firstPages]

  if (leftSibling > boundaryCount + 2) {
    items.push('ellipsis-left')
  } else {
    items.push(...range(boundaryCount + 1, leftSibling - 1))
  }

  items.push(...range(leftSibling, rightSibling))

  if (rightSibling < totalPages - boundaryCount - 1) {
    items.push('ellipsis-right')
  } else {
    items.push(...range(rightSibling + 1, totalPages - boundaryCount))
  }

  items.push(...lastPages)

  return items.filter((item, index, array) => item !== array[index - 1])
}

function PageButton({ isActive, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? 'border-amber bg-amber/15 text-amber-dark shadow-subtle'
          : 'border-border bg-surface text-ink hover:border-amber/40 hover:bg-amber/5 hover:text-ink'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  siblingCount = 1,
  boundaryCount = 1,
  onPageChange = () => {},
  className = '',
  previousLabel = 'السابق',
  nextLabel = 'التالي',
}) {
  if (totalPages < 1) return null

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const items = getPaginationItems(safeCurrentPage, totalPages, siblingCount, boundaryCount)

  return (
    <nav
      dir="rtl"
      aria-label="تصفح الصفحات"
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}
    >
      <div className="flex flex-1 items-center justify-start sm:justify-end">
        <PageButton
          onClick={() => onPageChange(Math.max(safeCurrentPage - 1, 1))}
          disabled={safeCurrentPage === 1}
          className="gap-2 px-4"
        >
          <ChevronRight size={16} />
          <span>{previousLabel}</span>
        </PageButton>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {items.map((item) => {
          if (item === 'ellipsis-left' || item === 'ellipsis-right') {
            return (
              <span
                key={item}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg border border-dashed border-border bg-canvas px-3 text-sm font-medium text-ink-soft"
                aria-hidden="true"
              >
                <MoreHorizontal size={16} />
              </span>
            )
          }

          const page = item

          return (
            <PageButton
              key={page}
              isActive={page === safeCurrentPage}
              aria-current={page === safeCurrentPage ? 'page' : undefined}
              aria-label={page === safeCurrentPage ? `الصفحة الحالية، ${page}` : `الانتقال إلى الصفحة ${page}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PageButton>
          )
        })}
      </div>

      <div className="flex flex-1 items-center justify-end sm:justify-start">
        <PageButton
          onClick={() => onPageChange(Math.min(safeCurrentPage + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          className="gap-2 px-4"
        >
          <span>{nextLabel}</span>
          <ChevronLeft size={16} />
        </PageButton>
      </div>
    </nav>
  )
}