import type { HTMLAttributes } from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  className?: string
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full border-collapse text-sm ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

interface TheadProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

export function THead({ children, className = '', ...props }: TheadProps) {
  return (
    <thead
      className={`bg-gray-50/75 text-left backdrop-blur-sm supports-[backdrop-filter]:bg-gray-50/50 ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
}

interface TBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

export function TBody({ children, className = '', ...props }: TBodyProps) {
  return (
    <tbody
      className={`divide-y divide-gray-200 bg-white ${className}`}
      {...props}
    >
      {children}
    </tbody>
  )
}

interface TRProps extends HTMLAttributes<HTMLTableRowElement> {
  className?: string
}

export function TR({ children, className = '', ...props }: TRProps) {
  return (
    <tr
      className={`transition-colors hover:bg-gray-50/50 ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

interface THProps extends HTMLAttributes<HTMLTableCellElement> {
  className?: string
}

export function TH({ children, className = '', ...props }: THProps) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

interface TDProps extends HTMLAttributes<HTMLTableCellElement> {
  className?: string
}

export function TD({ children, className = '', ...props }: TDProps) {
  return (
    <td
      className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}


