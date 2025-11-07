import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'danger' }

export default function Button({ variant = 'default', className = '', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
  const styles =
    variant === 'outline'
      ? 'border bg-white hover:bg-gray-50'
      : variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-blue-600 text-white hover:bg-blue-700'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}


