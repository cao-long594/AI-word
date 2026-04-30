export function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  disabled,
  children,
  ...props
}) {
  const variants = {
    primary: 'border-[3px] border-black bg-black text-white hover:bg-[#222]',
    subtle: 'border-[3px] border-black bg-white text-black hover:bg-[#f3f3f3]',
    accent: 'border-[3px] border-black bg-white text-black hover:bg-[#f3f3f3]',
    ghost: 'border border-transparent bg-transparent text-black hover:bg-[#f3f3f3]',
  }

  return (
    <Component
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-3 text-[16px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Component>
  )
}
