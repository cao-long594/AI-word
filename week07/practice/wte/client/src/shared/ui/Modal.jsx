import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previous = document.activeElement
    panelRef.current?.querySelector('input, textarea, button')?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.08)] px-6">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-[470px] overflow-hidden rounded-[34px] border-[3px] border-black bg-white"
      >
        <div className="border-b-[3px] border-dashed border-[#9ca3af] px-8 py-5 text-center">
          <h2 id="modal-title" className="text-[22px] font-semibold text-black">
            {title}
          </h2>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
