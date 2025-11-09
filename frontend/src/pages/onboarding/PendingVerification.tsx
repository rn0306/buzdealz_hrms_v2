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

 async function fetchRows() {
  setLoading(true)
  try {
    const res = await api.get('/api/personaldetails/filled')

    const normalizeVerification = (v: any) => {
      if (v === undefined || v === null) return undefined
      const s = String(v).trim()
      if (!s) return undefined
      const up = s.toUpperCase()
      if (up.includes('ACCEPT')) return 'Accepted'
      if (up.includes('REJECT')) return 'Rejected'
      if (up.includes('PEND')) return 'Pending'
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    }

    const normalized = (res.data || []).map((r: any) => {
      const user = r.user || {}

      return {
        id: user.id || r.user_id, // ✅ Use user.id for modal etc.
        full_name: `${user.fname || ''} ${user.mname || ''} ${user.lname || ''}`.trim() || '-',
        email: user.email || '-',
        phone: user.phone || '-',
        source: r.source,
        current_stage: r.current_stage,
        verificationStatus: normalizeVerification(r.verification_status),
        // ✅ Map details for the dialog
        personalDetails: {
          fullName: `${user.fname || ''} ${user.mname || ''} ${user.lname || ''}`.trim() || '-',
          email: user.email || '-',
          phone: user.phone || '-',
        },
        adharCardDetails: {
          adharNumber: r.adhar_card_no || '-',
          adharName: user.fname || '-', // or another field if backend has it
        },
        bankDetails: {
          bankName: r.bank_name || '-',
          accountNumber: r.account_no || '-',
          ifscCode: r.ifsc_code || '-',
        },
        educationDetails: {
          highestQualification: r.highest_education || '-',
          university: r.university_name || '-',
          passingYear: r.passing_year || '-',
        },
        previousExperience: {
          companyName: r.last_company_name || '-',
          role: r.role_designation || '-',
          duration: r.duration || '-',
        },
        otherDocuments: r.other_documents_url || '-',
      }
    })

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
            Pending Verification
          </h1>
          <p className="mt-1 text-gray-600 text-lg">Review and verify candidate information before onboarding</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-1.5 shadow">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-yellow-700 text-sm">Awaiting Verification</span>
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
              <TH className="px-6 py-3 text-left text-sm font-semibold text-indigo-700">Status</TH>
              <TH className="px-6 py-3 text-left text-sm font-semibold text-indigo-700">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 && (
              <TR>
                <TD colSpan={5} className="text-center py-16 text-gray-500 bg-indigo-50 font-medium">
                  No candidates awaiting verification.
                </TD>
              </TR>
            )}
            {rows.map((r) => (
              <TR key={r.id} className="hover:bg-indigo-100 transition cursor-pointer">
                <TD className="px-8 py-4 font-semibold">{r.full_name}</TD>
                <TD className="px-6 py-4">{r.email}</TD>
                <TD className="px-6 py-4">{r.phone || '-'}</TD>
                <TD className="px-6 py-4 font-medium">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      r.verificationStatus === 'Accepted'
                        ? 'bg-green-100 text-green-800'
                        : r.verificationStatus === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {r.verificationStatus || 'Pending'}
                  </span>
                </TD>
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

      <Dialog open={!!openViewId} onClose={closeView} title={`Candidate Details - ${selectedCandidate?.full_name || ''}`} className="max-w-7xl w-full rounded-xl p-6 overflow-y-auto max-h-[80vh]">
        {selectedCandidate && (
          <div className="space-y-8 text-gray-800">
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Personal Details</h3>
                <p><strong>Full Name:</strong> {selectedCandidate.personalDetails?.fullName || selectedCandidate.full_name || '-'}</p>
                <p><strong>Email:</strong> {selectedCandidate.personalDetails?.email || selectedCandidate.email || '-'}</p>
                <p><strong>Phone:</strong> {selectedCandidate.personalDetails?.phone || selectedCandidate.phone || '-'}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Adhar Card Details</h3>
                <p><strong>Adhar Number:</strong> {selectedCandidate.adharCardDetails?.adharNumber || '-'}</p>
                <p><strong>Name on Card:</strong> {selectedCandidate.adharCardDetails?.adharName || '-'}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Bank Details</h3>
                <p><strong>Bank Name:</strong> {selectedCandidate.bankDetails?.bankName || '-'}</p>
                <p><strong>Account Number:</strong> {selectedCandidate.bankDetails?.accountNumber || '-'}</p>
                <p><strong>IFSC Code:</strong> {selectedCandidate.bankDetails?.ifscCode || '-'}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Education Details</h3>
                <p><strong>Highest Qualification:</strong> {selectedCandidate.educationDetails?.highestQualification || '-'}</p>
                <p><strong>University / Board:</strong> {selectedCandidate.educationDetails?.university || '-'}</p>
                <p><strong>Passing Year:</strong> {selectedCandidate.educationDetails?.passingYear || '-'}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Previous Experience</h3>
                <p><strong>Company:</strong> {selectedCandidate.previousExperience?.companyName || '-'}</p>
                <p><strong>Role:</strong> {selectedCandidate.previousExperience?.role || '-'}</p>
                <p><strong>Duration:</strong> {selectedCandidate.previousExperience?.duration || '-'}</p>
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Other Documents</h3>
                <p className="whitespace-pre-wrap">{selectedCandidate.otherDocuments || '-'}</p>
              </div>
            </section>

            {/* Verification Status */}
            <section>
              <h3 className="text-lg font-bold text-indigo-700 border-b border-indigo-400 pb-1 mb-3">Verification Status</h3>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${
                    selectedCandidate.verificationStatus === 'Accepted'
                      ? 'bg-green-200 text-green-800'
                      : selectedCandidate.verificationStatus === 'Rejected'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'}`
                  }
                >
                  {selectedCandidate.verificationStatus || 'Pending'}
                </span>
              </div>
              {selectedCandidate.verificationStatus === 'Rejected' && (
                <p className="mt-3 p-3 rounded-lg bg-red-100 text-red-700 whitespace-pre-wrap font-semibold">
                  Reject Comment: {selectedCandidate.rejectComment || '-'}
                </p>
              )}
            </section>

            {/* Admin Action */}
            <section className="mt-8 border-t border-indigo-300 pt-6">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">Admin Action</h3>

              <div className="flex gap-6 mb-5">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="admin-action"
                    checked={action === 'accept'}
                    onChange={() => setAction('accept')}
                    className="cursor-pointer"
                  />
                  <span className="font-medium text-indigo-800">Accept</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="admin-action"
                    checked={action === 'reject'}
                    onChange={() => setAction('reject')}
                    className="cursor-pointer"
                  />
                  <span className="font-medium text-indigo-800">Reject</span>
                </label>
              </div>

              {action === 'reject' && (
                <div className="mb-6">
                  <label className="block mb-2 font-semibold text-indigo-700">Reject Comment</label>
                  <textarea
                    rows={4}
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Provide reason for rejection"
                    className="w-full rounded-md border border-indigo-300 px-4 py-3 text-lg resize-y focus:ring-2 focus:ring-indigo-400 focus:border-indigo-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={closeView} className="rounded-lg px-6 py-3 text-indigo-600 font-semibold shadow hover:bg-indigo-50 transition">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={action === null || (action === 'reject' && rejectComment.trim() === '')}
                  className="rounded-lg px-6 py-3 font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-700 hover:to-blue-800 transition"
                >
                  Save
                </Button>
              </div>
            </section>
          </div>
        )}
      </Dialog>
    </section>
  )
}
