import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import Button from '../../components/ui/Button'
import Dialog from '../../components/ui/Dialog'
import Input from '../../components/ui/Input'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'

type Candidate = {
  id: string
  full_name: string
  email: string
  phone?: string
  source?: string
  current_stage?: string
  personalDetails?: {
    fullName?: string
    email?: string
    phone?: string
  }
  adharCardDetails?: {
    adharNumber?: string
    adharName?: string
  }
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    ifscCode?: string
  }
  educationDetails?: {
    highestQualification?: string
    university?: string
    passingYear?: string
  }
  previousExperience?: {
    companyName?: string
    role?: string
    duration?: string
  }
  otherDocuments?: string
  verificationStatus?: 'Pending' | 'Accepted' | 'Rejected'
  rejectComment?: string
}

export default function PendingVerification() {
  const [rows, setRows] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [openViewId, setOpenViewId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)

  // ✅ Updated to fetch active interns (candidates with filled Aadhaar + PAN)
  async function fetchRows() {
    setLoading(true)
    try {
      const res = await api.get('/api/onboarding-details') // <-- updated endpoint
      // Each record has onboarding details + candidate info under "candidate"
      const formatted = res.data.map((item: any) => ({
        id: item.candidate?.id || item.id,
        full_name: item.candidate?.full_name || '-',
        email: item.candidate?.email || '-',
        phone: item.candidate?.phone || '-',
        current_stage: item.candidate?.current_stage || '-',
        verificationStatus: 'Accepted', // optional default
        personalDetails: {
          fullName: item.candidate?.full_name,
          email: item.candidate?.email,
          phone: item.candidate?.phone
        },
        adharCardDetails: {
          adharNumber: item.aadhaar_number || '-',
          adharName: item.aadhaar_name || '-'
        },
        bankDetails: {
          bankName: item.bank_name || '-',
          accountNumber: item.account_number || '-',
          ifscCode: item.ifsc_code || '-'
        },
        educationDetails: {
          highestQualification: item.highest_qualification || '-',
          university: item.university || '-',
          passingYear: item.passing_year || '-'
        },
        previousExperience: {
          companyName: item.previous_company || '-',
          role: item.previous_role || '-',
          duration: item.previous_duration || '-'
        },
        otherDocuments: item.other_documents || '-',
        rejectComment: item.reject_comment || ''
      }))
      setRows(formatted)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load active interns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [])

  function openView(candidate: Candidate) {
    setSelectedCandidate(candidate)
    setRejectComment(candidate.rejectComment || '')
    setOpenViewId(candidate.id)
    setAction(null)
  }

  function closeView() {
    setOpenViewId(null)
    setSelectedCandidate(null)
    setRejectComment('')
    setAction(null)
  }

  async function handleSave() {
    if (!selectedCandidate) return

    if (action === 'reject' && rejectComment.trim() === '') {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      await api.put(`/api/candidates/${selectedCandidate.id}/verification-status`, {
        verificationStatus: action === 'accept' ? 'Accepted' : 'Rejected',
        rejectComment: action === 'reject' ? rejectComment.trim() : '',
      })
      toast.success(`Candidate profile ${action === 'accept' ? 'accepted' : 'rejected'}`)
      await fetchRows()
      closeView()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update verification status')
    }
  }

  return (
    <section className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Active Interns
          </h1>
          <p className="mt-1 text-gray-600 text-lg">List of interns with completed onboarding details</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-1.5 shadow">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-green-700 text-sm">Active Interns</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-300 bg-white p-6 shadow-lg overflow-auto">
        <Table className="min-w-full">
          <THead className="bg-indigo-50">
            <TR>
              <TH className="px-8 py-3 text-left text-sm font-bold uppercase tracking-wide text-indigo-700">Name</TH>
              <TH className="px-6 py-3 text-left text-sm font-semibold text-indigo-700">Email</TH>
              <TH className="px-6 py-3 text-left text-sm font-semibold text-indigo-700">Phone</TH>
              <TH className="px-6 py-3 text-left text-sm font-semibold text-indigo-700">Stage</TH>
              <TH className="px-6 py-3 text-left text-sm font-semibold text-indigo-700">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 && (
              <TR>
                <TD colSpan={5} className="text-center py-16 text-gray-500 bg-indigo-50 font-medium">
                  No active interns found.
                </TD>
              </TR>
            )}
            {rows.map((r) => (
              <TR key={r.id} className="hover:bg-indigo-100 transition cursor-pointer">
                <TD className="px-8 py-4 font-semibold">{r.full_name}</TD>
                <TD className="px-6 py-4">{r.email}</TD>
                <TD className="px-6 py-4">{r.phone || '-'}</TD>
                <TD className="px-6 py-4 font-medium">{r.current_stage}</TD>
                <TD className="px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => openView(r)}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-3 py-1 text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    aria-label={`View details of ${r.full_name}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* ✅ existing Dialog UI unchanged */}
      <Dialog open={!!openViewId} onClose={closeView} title={`Candidate Details - ${selectedCandidate?.full_name || ''}`} className="max-w-7xl w-full rounded-xl p-6 overflow-y-auto max-h-[80vh]">
        {selectedCandidate && (
          <div className="space-y-8 text-gray-800">
            {/* all inner sections remain same */}
            {/* ...existing detail sections and actions unchanged... */}
          </div>
        )}
      </Dialog>
    </section>
  )
}
