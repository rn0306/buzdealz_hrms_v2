import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

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
  const [interns, setInterns] = useState<Intern[]>([
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

  const [viewInternId, setViewInternId] = useState<string | null>(null)
  const [editInternId, setEditInternId] = useState<string | null>(null)

  const [editForm, setEditForm] = useState<Partial<Intern> & {
    employmentStatus?: 'Extension' | 'Termination' | ''
    newEndDate?: string
    remark?: string
  }>({})

  function openView(id: string) {
    setViewInternId(id)
    setEditInternId(null)
  }

  function closeView() {
    setViewInternId(null)
  }

  function openEdit(id: string) {
    const intern = interns.find((i) => i.id === id)
    if (intern) {
      setEditForm({
        ...intern,
        employmentStatus: '', // default empty, must select
        newEndDate: '',
        remark: '',
      })
      setEditInternId(id)
      setViewInternId(null)
    }
  }

  function closeEdit() {
    setEditInternId(null)
    setEditForm({})
  }

  function handleInputChange(field: keyof typeof editForm, value: any) {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }))
    // If Termination selected, auto set endDate to current date
    if (field === 'employmentStatus' && value === 'Termination') {
      const today = new Date().toISOString().slice(0, 10)
      setEditForm((prev) => ({
        ...prev,
        endDate: today,
        newEndDate: '',
        remark: '',
      }))
    }
    // If Extension selected, clear endDate override
    if (field === 'employmentStatus' && value === 'Extension') {
      setEditForm((prev) => ({
        ...prev,
        endDate: interns.find(i => i.id === editInternId)?.endDate || '',
      }))
    }
  }

  function saveEdit() {
    if (!editInternId) return
    // Update intern in list
    setInterns((prev) =>
      prev.map((intern) => {
        if (intern.id === editInternId) {
          let updatedEndDate = intern.endDate
          if (editForm.employmentStatus === 'Extension' && editForm.newEndDate) {
            updatedEndDate = editForm.newEndDate
          } else if (editForm.employmentStatus === 'Termination') {
            updatedEndDate = editForm.endDate || intern.endDate
          }
          return {
            ...intern,
            name: editForm.name || intern.name,
            department: editForm.department || intern.department,
            startDate: editForm.startDate || intern.startDate,
            endDate: updatedEndDate,
            supervisor: editForm.supervisor || intern.supervisor,
            status: editForm.employmentStatus === 'Termination' ? 'terminated' : intern.status,
          }
        }
        return intern
      })
    )
    closeEdit()
  }

  const currentEditIntern = interns.find((i) => i.id === editInternId)
  const currentViewIntern = interns.find((i) => i.id === viewInternId)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Active Interns</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and monitor active internships</p>
        </div>
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{intern.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{intern.department}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{intern.startDate}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{intern.endDate}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{intern.supervisor}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        intern.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : intern.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {intern.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 space-x-2">
                    <button
                      onClick={() => openView(intern.id)}
                      className="text-blue-600 hover:text-blue-700 underline"
                      type="button"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(intern.id)}
                      className="text-indigo-600 hover:text-indigo-700 underline"
                      type="button"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Form */}
      {viewInternId && currentViewIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">{currentViewIntern.name} - Details</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Department:</strong> {currentViewIntern.department}</p>
              <p><strong>Start Date:</strong> {currentViewIntern.startDate}</p>
              <p><strong>End Date:</strong> {currentViewIntern.endDate}</p>
              <p><strong>Supervisor:</strong> {currentViewIntern.supervisor}</p>
              <p><strong>Status:</strong> {currentViewIntern.status}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeView}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editInternId && currentEditIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveEdit()
            }}
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg space-y-6"
          >
            <h2 className="text-xl font-bold">{currentEditIntern.name} - Edit Intern</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="flex flex-col">
                <span className="mb-1 font-semibold text-gray-700">Name</span>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="mb-1 font-semibold text-gray-700">Department</span>
                <input
                  type="text"
                  value={editForm.department || ''}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="mb-1 font-semibold text-gray-700">Start Date</span>
                <input
                  type="date"
                  value={editForm.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="mb-1 font-semibold text-gray-700">End Date</span>
                <input
                  type="date"
                  value={editForm.endDate || ''}
                  readOnly={editForm.employmentStatus === 'Termination'}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`rounded-md border px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 ${
                    editForm.employmentStatus === 'Termination' ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                  required
                />
              </label>
              <label className="flex flex-col">
                <span className="mb-1 font-semibold text-gray-700">Supervisor</span>
                <input
                  type="text"
                  value={editForm.supervisor || ''}
                  onChange={(e) => handleInputChange('supervisor', e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                  required
                />
              </label>
            </div>

            <div>
              <label className="flex flex-col">
                <span className="mb-1 font-semibold text-gray-700">Employment Status</span>
                <select
                  value={editForm.employmentStatus || ''}
                  onChange={(e) => handleInputChange('employmentStatus', e.target.value as any)}
                  className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                  required
                >
                  <option value="">Select status</option>
                  <option value="Extension">Extension</option>
                  <option value="Termination">Termination</option>
                </select>
              </label>
            </div>

            {editForm.employmentStatus === 'Extension' && (
              <>
                <div>
                  <label className="flex flex-col">
                    <span className="mb-1 font-semibold text-gray-700">New End Date</span>
                    <input
                      type="date"
                      value={editForm.newEndDate || ''}
                      onChange={(e) => handleInputChange('newEndDate', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label className="flex flex-col">
                    <span className="mb-1 font-semibold text-gray-700">Remark</span>
                    <textarea
                      rows={3}
                      value={editForm.remark || ''}
                      onChange={(e) => handleInputChange('remark', e.target.value)}
                      className="resize-y rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                      placeholder="Add remark for extension"
                      required
                    />
                  </label>
                </div>
              </>
            )}

            {editForm.employmentStatus === 'Termination' && (
              <div>
                <label className="flex flex-col">
                  <span className="mb-1 font-semibold text-gray-700">Remark (Termination Reason)</span>
                  <textarea
                    rows={3}
                    value={editForm.remark || ''}
                    onChange={(e) => handleInputChange('remark', e.target.value)}
                    className="resize-y rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
                    placeholder="Add remark for termination"
                    required
                  />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editForm.employmentStatus === '' || (['Extension', 'Termination'].includes(editForm.employmentStatus || '') && !editForm.remark)}
                className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
