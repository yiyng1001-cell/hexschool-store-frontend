export type PaginationItem =
  | { readonly kind: 'page'; readonly page: number }
  | { readonly kind: 'ellipsis'; readonly key: string }

const SIBLING_PAGES = 2

export function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (!Number.isInteger(currentPage) || !Number.isInteger(totalPages) || totalPages < 0) {
    throw new RangeError('currentPage and totalPages must be integers, totalPages >= 0')
  }
  const windowStart = Math.max(1, currentPage - SIBLING_PAGES)
  const windowEnd = Math.min(totalPages, currentPage + SIBLING_PAGES)
  const pages = new Set<number>()
  if (totalPages >= 1) pages.add(1)
  for (let page = windowStart; page <= windowEnd; page += 1) pages.add(page)
  if (totalPages >= 1) pages.add(totalPages)
  // An ellipsis that would hide a single page is pointless: show that page instead.
  const singlePageGaps = [...pages].filter((page) => pages.has(page + 2) && !pages.has(page + 1))
  singlePageGaps.forEach((page) => pages.add(page + 1))

  return [...pages]
    .sort((left, right) => left - right)
    .flatMap((page, index, sorted): PaginationItem[] => {
      const previous = sorted[index - 1]
      const gap: PaginationItem[] =
        previous !== undefined && page - previous > 1
          ? [{ kind: 'ellipsis', key: `gap-after-${previous}` }]
          : []
      return [...gap, { kind: 'page', page }]
    })
}
