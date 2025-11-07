import { useState } from 'react'
import { Search, Filter, UserPlus } from 'lucide-react'

interface Intern {
  id: string
  name: string
  department: string
  startDate: string
  endDate: string
  supervisor: string
  status: 'active' | 'completed' | 'terminated'
}

export default function ActiveInterns() {
  const [interns] = useState<Intern[]>([
    {
      id: '1',
      name: 'John Doe',
      department: 'Engineering',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      supervisor: 'Jane Smith',
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      department: 'Marketing',
      startDate: '2025-02-01',
      endDate: '2025-08-31',
      supervisor: 'Mike Johnson',
      status: 'active'
    }
  ])

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Active Interns</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and monitor active internships</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <UserPlus className="h-4 w-4" />
          Add Intern
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search interns..."
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Start Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  End Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Supervisor
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
              {interns.map((intern) => (
                <tr key={intern.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {intern.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {intern.department}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {intern.startDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {intern.endDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {intern.supervisor}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      {intern.status}
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


