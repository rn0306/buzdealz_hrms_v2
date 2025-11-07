import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

export default function Stub() {
  const location = useLocation()
  const path = location.pathname
  const pageName = path.split('/').pop()?.replace(/-/g, ' ') || path
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1)

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
      <Construction className="h-12 w-12 text-gray-400" />
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">{title} Page</h1>
      <p className="mt-2 text-gray-500">
        This page is currently under development. Check back soon for updates!
      </p>
      <div className="mt-6">
        <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700">
          {location.pathname}
        </code>
      </div>
    </div>
  )
}


