export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--line)] bg-white/55 p-8">
      <h2 className="text-balance text-lg font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-2 max-w-[54ch] text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function InlineLoader({ label = 'Loading…' }) {
  return <p className="text-sm text-[var(--muted)]">{label}</p>
}

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
    </div>
  )
}
