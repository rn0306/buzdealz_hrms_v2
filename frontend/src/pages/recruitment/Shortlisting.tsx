import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Dialog from '../../components/ui/Dialog'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { toast } from 'sonner'

type Candidate = {
  id: string
  full_name: string
  email: string
  phone?: string
  source?: string
  current_stage?: string
}

export default function Shortlisting() {
  const [rows, setRows] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)

  // Filter rows based on query
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone, r.source].some((v) => (v || '').toLowerCase().includes(q))
    )
  }, [rows, query])

  // Fetch candidates from backend
  async function fetchRows() {
    setLoading(true)
    try {
      const res = await api.get('/api/candidates')
      setRows(res.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [])

  // Confirm delete candidate
  async function confirmDelete() {
    if (!openDeleteId) return
    try {
      await api.delete(`/api/candidates/${openDeleteId}`)
      toast.success('Candidate deleted')
      setOpenDeleteId(null)
      await fetchRows()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Delete failed')
    }
  }

  // Handles candidate status update (shortlist, reject, on hold)
  async function updateStatus(candidateId: string, status: string) {
    try {
      await api.put(`/api/candidates/${candidateId}/status`, { current_stage: status })
      toast.success(`Candidate status updated to ${status}`)
      await fetchRows()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update status')
    }
  }

  const statusOptions = ['New', 'Shortlisted', 'Rejected', 'On Hold']

  return (
    <section className="space-y-6">
      {/* Header container: made left-aligned and visually presentive */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-bold tracking-tight text-left">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Recruitment Board
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 text-left">
            Manage and track candidate applications through different stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-blue-50 px-4 py-2 shadow border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 tracking-wide">
              {filtered.length} Candidates
            </div>
          </div>
        </div>
      </div>

      {/* Search and Refresh controls: improved spacing */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Input 
            placeholder="Search candidates..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-md border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchRows} 
          disabled={loading}
          className="w-full sm:w-auto rounded-md border-gray-300 px-4 py-2 shadow"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </span>
          )}
        </Button>
      </div>

      {/* Table container: more rounded, more shadow */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <THead className="bg-blue-50">
              <TR>
                <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Name</TH>
                <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Email</TH>
                <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Phone</TH>
                <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Stage</TH>
                <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Update Status</TH>
                <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((r) => (
                <TR key={r.id} className="hover:bg-blue-50 transition">
                  <TD className="font-medium text-gray-900 px-6 py-3">{r.full_name}</TD>
                  <TD className="px-6 py-3">{r.email}</TD>
                  <TD className="px-6 py-3">{r.phone || '-'}</TD>
                  <TD className="px-6 py-3">
                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                      ${r.current_stage === 'Shortlisted' ? 'bg-green-100 text-green-700' :
                        r.current_stage === 'Rejected' ? 'bg-red-100 text-red-700' :
                        r.current_stage === 'On Hold' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'}`
                    }>
                      {r.current_stage || 'New'}
                    </div>
                  </TD>
                  <TD className="px-6 py-3">
                    <select
                      className="block w-full rounded-lg border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={r.current_stage || 'New'}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </TD>
                  <TD className="px-6 py-3">
                    <div className="flex gap-2">
                      <Button 
                        variant="danger" 
                        onClick={() => setOpenDeleteId(r.id)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 shadow"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
              {filtered.length === 0 && (
                <TR>
                  <TD colSpan={6} className="text-center py-12 bg-blue-50">
                    <div className="flex flex-col items-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!openDeleteId} onClose={() => setOpenDeleteId(null)} title={
        <div className="flex items-center gap-2 text-red-600">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Delete Candidate
        </div>
      }>
        <div className="mt-2 space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this candidate? This action cannot be undone and will permanently remove the candidate's data from our system.
          </p>
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-800">Warning: This action is irreversible</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpenDeleteId(null)}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              className="min-w-[100px] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  )
}
