import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from './Button'

export function Pagination({ page, pageSize, total }) {
  const location = useLocation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (totalPages <= 1) {
    return null
  }

  const buildTarget = (nextPage) => {
    const params = new URLSearchParams(location.search)
    params.set('page', String(nextPage))
    return `${location.pathname}?${params.toString()}`
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-[var(--muted)]">
        Page {page} / {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          as={Link}
          variant="subtle"
          aria-label="Go to previous page"
          to={buildTarget(Math.max(1, page - 1))}
          className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </Button>
        <Button
          as={Link}
          variant="subtle"
          aria-label="Go to next page"
          to={buildTarget(Math.min(totalPages, page + 1))}
          className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
        >
          <ChevronRight aria-hidden="true" size={16} />
        </Button>
      </div>
    </nav>
  )
}
