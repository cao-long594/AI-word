import { forwardRef } from 'react'

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <label htmlFor={htmlFor} className="flex w-full flex-col gap-2">
      <span className="text-[18px] font-semibold text-black">
        {label}
      </span>
      {children}
      {hint ? <span className="text-sm text-[var(--muted)]">{hint}</span> : null}
      {error ? (
        <span aria-live="polite" className="text-sm font-medium text-[var(--accent-deep)]">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export const Input = forwardRef(function Input(props, ref) {
  return (
    <input
      ref={ref}
      className="focus-ring block w-full min-w-0 border-[3px] border-black bg-white px-4 py-3 text-[18px] text-[var(--text)] placeholder:text-[var(--muted)]"
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea(props, ref) {
  return (
    <textarea
      ref={ref}
      className="focus-ring block w-full min-h-[140px] min-w-0 resize-y border-[3px] border-black bg-white px-4 py-3 text-[18px] leading-8 text-[var(--text)] placeholder:text-[var(--muted)]"
      {...props}
    />
  )
})
