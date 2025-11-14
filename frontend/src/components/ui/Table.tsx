import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { useState } from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  className?: string
  children: React.ReactNode
}

export function Table({ children, className = '', ...props }: TableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Extract rows from children (assuming children is a single TBody with TRs)
  const tbody = Array.isArray(children) ? children.find((child) => child?.type === TBody) : null
  const rows = tbody?.props.children || []
  const totalRows = Array.isArray(rows) ? rows.length : 1
  const totalPages = Math.ceil(totalRows / rowsPerPage)

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = Array.isArray(rows) ? rows.slice(startIndex, endIndex) : rows

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const maxVisiblePages = 5
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`flex items-center justify-center w-10 h-10 rounded-md ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } transition-colors`}
        >
          {i}
        </button>
      )
    }

    return (
      <nav className="flex justify-center mt-4 mb-4 space-x-2">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          &lt;
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          &gt;
        </button>
      </nav>
    )
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full border-collapse text-sm ${className}`} {...props}>
        {Array.isArray(children)
          ? children.map((child) =>
              child?.type === TBody
                ? { ...child, props: { ...child.props, children: currentRows } }
                : child
            )
          : children}
      </table>
      {renderPagination()}
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

interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
  className?: string
}

export function TH({ children, className = '', ...props }: THProps) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ${className}`}
      {...props}
    >
      {children}
    </th>
  )
}

interface TDProps extends TdHTMLAttributes<HTMLTableCellElement> {
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
