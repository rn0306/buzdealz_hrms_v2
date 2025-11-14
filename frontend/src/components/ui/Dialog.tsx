import { PropsWithChildren } from 'react'

type DialogProps = PropsWithChildren<{ 
  open: boolean; 
  onClose: () => void; 
  title?: string;
  className?: string;
}>

export default function Dialog({ open, onClose, title, children, className }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-4xl rounded-lg border bg-white p-4 shadow-lg overflow-y-auto ${className || ''}`}>
        {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  )
}


