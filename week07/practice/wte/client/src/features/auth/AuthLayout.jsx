import { Link } from 'react-router-dom'

export function AuthLayout({ children, footer }) {
  return (
    <div className="grain min-h-screen bg-[var(--bg)] px-6 py-8 sm:px-10 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[760px] items-center justify-center">
        <section className="w-full rounded-[8px] border border-[var(--line)] bg-[var(--panel)] px-8 py-10 shadow-[var(--shadow)] sm:px-12 sm:py-12">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="mb-10 inline-flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/75 text-lg font-semibold text-[var(--accent)]">
                W
              </span>
              <span>
                <strong className="block text-2xl tracking-[0.09em] text-[var(--accent)]">WTE</strong>
                <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Writers Talk Exchange</span>
              </span>
            </Link>
            {children}
            <div className="mt-8 text-sm text-[var(--muted)]">{footer}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
