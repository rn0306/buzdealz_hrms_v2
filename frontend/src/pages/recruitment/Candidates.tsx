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
  fname?: string
  lname?: string
  email: string
  phone?: string
  source?: string
  current_stage?: string
}


type FormState = Partial<Candidate> & { resume_url?: string }


export default function Candidates() {
  const [rows, setRows] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [editing, setEditing] = useState<Candidate | null>(null)
  const [form, setForm] = useState<FormState>({ full_name: '', email: '' })
  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null)


  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return rows.filter((r) => [r.full_name, r.email, r.phone, r.source].some((v) => (v || '').toLowerCase().includes(q)))
  }, [rows, query])


  async function fetchRows() {
    setLoading(true)
    try {
      const res = await api.get('/api/candidates')
      // Backend may return fname and lname instead of full_name — compute full_name here
      const normalized = (res.data || []).map((r: any) => ({
        ...r,
        // Ensure full_name is available (from fname+lname if missing)
        full_name: r.full_name || `${(r.fname || '').trim()} ${(r.lname || '').trim()}`.trim(),
        // current_stage and source may be stored on personalDetail in backend responses
        current_stage: r.current_stage || r.personalDetail?.current_stage || r.current_stage,
        source: r.source || r.personalDetail?.source || r.source,
      }))
      setRows(normalized)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchRows()
  }, [])


  function openCreate() {
    setEditing(null)
    setForm({ full_name: '', email: '', phone: '', source: 'Portal', resume_url: '' })
    setOpenForm(true)
  }


  function openEdit(row: Candidate) {
    setEditing(row)
    setForm({ ...row })
    setOpenForm(true)
  }


  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editing) {
      
        // If status/current_stage was changed, persist it on the personal details resource
        if (form.current_stage !== undefined) {
          try {
            await api.put(`/api/personaldetails/${editing.id}`, { current_stage: form.current_stage })
          } catch (err: any) {
            // non-fatal: still allow main update to succeed but surface a warning
            toast.warning('Candidate updated but failed to update stage: ' + (err?.response?.data?.error || err.message || ''))
          }
        }
        toast.success('Candidate updated')
      } else {
        // Create via onboarding endpoint
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          resume_url: form.resume_url,
          source: form.source || 'Portal',
        }
        await api.post('/api/onboarding/create-candidate', payload)
        toast.success('Candidate created')
      }
      setOpenForm(false)
      await fetchRows()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Operation failed')
    }
  }


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


  const statusOptions = ['New', 'Shortlisted', 'Rejected', 'On Hold']


  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-left">
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Recruitment Candidate
            </span>
        </h1>
        <Button className="rounded-md px-4 py-2 shadow-md" onClick={openCreate}>
          Add Candidate
        </Button>
      </div>


      <div className="flex items-center gap-3">
        <Input 
          placeholder="Search candidates..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <Button 
          variant="outline" 
          onClick={fetchRows} 
          disabled={loading}
          className="rounded-md border border-gray-300 px-4 py-2 shadow-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>


      <div className="rounded-2xl border border-gray-200 bg-white p-0 shadow-lg overflow-hidden">
        <Table>
          <THead className="bg-blue-50">
            <TR>
              <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Name</TH>
              <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Email</TH>
              <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Phone</TH>
              <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Stage</TH>
              <TH className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((r) => (
              <TR key={r.id} className="hover:bg-blue-50 transition">
                <TD className="px-6 py-3">{r.full_name}</TD>
                <TD className="px-6 py-3">{r.email}</TD>
                <TD className="px-6 py-3">{r.phone || '-'}</TD>
                <TD className="px-6 py-3">{r.current_stage || '-'}</TD>
                <TD className="px-6 py-3">
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-md px-3 py-1 shadow" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button variant="danger" className="rounded-md px-3 py-1 shadow" onClick={() => setOpenDeleteId(r.id)}>
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
            {filtered.length === 0 && (
              <TR>
                <TD colSpan={5} className="text-center py-12 bg-blue-50 text-gray-600">
                  No candidates found.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>


      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} title={editing ? 'Edit Candidate' : 'Add Candidate'}>
        <form className="space-y-4" onSubmit={submitForm}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
            <Input 
              value={form.full_name || ''} 
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
              required 
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <Input 
              type="email" 
              value={form.email || ''} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required 
              className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <Input 
                value={form.phone || ''} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Source</label>
              <Input 
                value={form.source || ''} 
                onChange={(e) => setForm({ ...form, source: e.target.value })} 
                className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Resume URL</label>
              <Input 
                value={form.resume_url || ''} 
                onChange={(e) => setForm({ ...form, resume_url: e.target.value })} 
                className="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          )}
          {editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.current_stage || 'New'}
                onChange={(e) => setForm({ ...form, current_stage: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setOpenForm(false)} className="rounded-md px-4 py-2 shadow-sm">
              Cancel
            </Button>
            <Button type="submit" className="rounded-md px-4 py-2 shadow-md">
              {editing ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>


      {/* Delete Confirmation */}
      <Dialog open={!!openDeleteId} onClose={() => setOpenDeleteId(null)} title="Delete Candidate">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete this candidate? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpenDeleteId(null)} className="rounded-md px-4 py-2 shadow-sm">
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} className="rounded-md px-4 py-2 shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
            Delete
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
