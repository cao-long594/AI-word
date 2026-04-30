export function Card({ className = '', children }) {
  return (
    <section
      className={`rounded-[4px] border-[3px] border-black bg-white ${className}`}
    >
      {children}
    </section>
  )
}
