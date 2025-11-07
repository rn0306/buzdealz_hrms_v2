import { useState } from 'react'
import { Plus } from 'lucide-react'

interface Extension {
  id: string
  internName: string
  currentEndDate: string
  requestedEndDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function Extensions() {
  const [extensions] = useState<Extension[]>([
    {
      id: '1',
      internName: 'John Doe',
      currentEndDate: '2025-12-31',
      requestedEndDate: '2026-06-30',
      reason: 'Project continuation and skill development',
      status: 'pending'
    },
    // Add more sample data as needed
  ])

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Extension Requests</h1>
          <p className="mt-1 text-sm text-gray-500">Manage internship extension requests</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Intern Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Current End Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Requested End Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {extensions.map((extension) => (
                <tr key={extension.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {extension.internName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {extension.currentEndDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {extension.requestedEndDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {extension.reason}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium
                      ${extension.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        extension.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'}`}>
                      {extension.status.charAt(0).toUpperCase() + extension.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-700">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


