import { Hash } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Card } from '../../shared/ui/Card'

export function TopicList({ topics }) {
  const location = useLocation()

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Topics</p>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            to={`/topics/${topic.id}`}
            className={`focus-ring grid grid-cols-[1fr_auto] gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/60 ${
              location.pathname === `/topics/${topic.id}` ? 'bg-[var(--accent-soft)]' : ''
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Hash aria-hidden="true" size={14} className="text-[var(--accent)]" />
                <h2 className="truncate text-base font-semibold text-[var(--text)]">{topic.name}</h2>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">{topic.description}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[var(--text)]">{topic.post_count}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Posts</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
