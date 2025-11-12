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
  fname?: string
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
  joiningDate?: string
  confirmationDate?: string
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected'
  rejectComment?: string
}

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body_html: string
}

export default function PendingVerification() {
  const [rows, setRows] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [openViewId, setOpenViewId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [confirmationDate, setConfirmationDate] = useState('')

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)

  // ✉️ Mail Dialog States
  const [openMailDialog, setOpenMailDialog] = useState(false)
  const [mailCandidate, setMailCandidate] = useState<Candidate | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [sendingMail, setSendingMail] = useState(false)

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

      const normalized = (res.data || []).map((r: any) => {debugger
        const user = r.user || {}

        return {
          id: user.id || r.user_id,
          full_name: `${user.fname || ''} ${user.mname || ''} ${user.lname || ''}`.trim() || '-',
          fname: user.fname || '',
          email: user.email || '-',
          phone: user.phone || '-',
          source: r.source,
          current_stage: r.current_stage,
          verificationStatus: normalizeVerification(r.verification_status),
          joiningDate: user.joining_date || r.joining_date || null,
          confirmationDate: user.confirmation_date || r.confirmation_date || null,
          personalDetails: {
            fullName: `${user.fname || ''} ${user.mname || ''} ${user.lname || ''}`.trim() || '-',
            email: user.email || '-',
            phone: user.phone || '-',
          },
          adharCardDetails: {
            adharNumber: r.adhar_card_no || '-',
            adharName: user.fname || '-',
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

  function formatToDateTimeLocal(d?: string | null) {
    if (!d) return ''
    try {
      if (d.includes('T')) return d.slice(0, 16)
      if (d.length === 10) return `${d}T00:00`
      return new Date(d).toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  function openView(candidate: Candidate) {
    console.log('joining date', candidate.joiningDate);
    console.log('confirmation date', candidate.confirmationDate);
    setSelectedCandidate(candidate)
    setRejectComment(candidate.rejectComment || '')
    // Prefill joining and confirmation dates if available
    setJoiningDate(candidate.joiningDate ? String(candidate.joiningDate).slice(0, 10) : '')
    setConfirmationDate(formatToDateTimeLocal(candidate.confirmationDate || null))
    setOpenViewId(candidate.id)
    setAction(null)
  }

  function closeView() {
    setOpenViewId(null)
    setSelectedCandidate(null)
    setRejectComment('')
    setJoiningDate('')
    setConfirmationDate('')
    setAction(null)
  }

  async function handleSave() {
    if (!selectedCandidate) return

    if (action === 'reject' && rejectComment.trim() === '') {
      toast.error('Please provide a reason for rejection')
      return
    }

    if (action === 'accept' && !joiningDate) {
      toast.error('Please select joining date')
      return
    }

    try {
      // confirmationDate state is in datetime-local format (YYYY-MM-DDTHH:mm)
      const confirmationToSend = action === 'accept'
        ? (confirmationDate && confirmationDate.includes('T') ? new Date(confirmationDate).toISOString() : new Date().toISOString())
        : null

      await api.post(`/api/onboarding/verify-and-update/${selectedCandidate.id}`, {
        verificationStatus: action === 'accept' ? 'Accepted' : 'Rejected',
        rejectComment: action === 'reject' ? rejectComment.trim() : '',
        joiningDate: action === 'accept' ? joiningDate : null,
        confirmationDate: confirmationToSend,
      })

      // Update local state for the row to avoid full reload
      const updatedCandidate: Candidate = {
        ...selectedCandidate,
        verificationStatus: (action === 'accept' ? 'Accepted' : 'Rejected') as 'Accepted' | 'Rejected' | 'Pending',
        rejectComment: action === 'reject' ? rejectComment.trim() : '',
        joiningDate: action === 'accept' ? joiningDate : selectedCandidate.joiningDate,
        confirmationDate: action === 'accept' ? formatToDateTimeLocal(confirmationToSend || '') : selectedCandidate.confirmationDate,
      }

      setRows(prevRows => prevRows.map(r => r.id === selectedCandidate.id ? updatedCandidate : r))

      toast.success(`Candidate profile ${action === 'accept' ? 'accepted' : 'rejected'}`)
      closeView()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update verification status')
    }
  }

  // 📨 Open mail dialog
  async function openMail(row: Candidate) {
    setMailCandidate(row)
    setOpenMailDialog(true)
    setSelectedTemplateId('')
    setSelectedTemplate(null)
    try {
      const res = await api.get('/api/email-templates')
      setTemplates(res.data.data || [])
    } catch (err: any) {
      toast.error('Failed to load templates')
    }
  }

  // 📨 Handle template change
  function handleTemplateChange(id: string) {
    setSelectedTemplateId(id)
    const t = templates.find((x) => x.id === id) || null
    setSelectedTemplate(t)
  }

  // 📨 Send mail API call
  async function sendMailToCandidate() {
    if (!mailCandidate || !selectedTemplate) {
      toast.error('Please select a template')
      return
    }
    setSendingMail(true)
    try {
      await api.post('/api/email-templates/send', {
        template_id: selectedTemplate.id,
        recipient_email: mailCandidate.email,
        recipient_name: mailCandidate.full_name,
        data: {
          full_name: mailCandidate.full_name,
          email: mailCandidate.email,
          phone: mailCandidate.phone || '',
          password: mailCandidate.fname?.toLocaleLowerCase() + '123$' || '',
        },
      })

      toast.success(`Mail sent to ${mailCandidate.full_name}`)
      setOpenMailDialog(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send email')
    } finally {
      setSendingMail(false)
    }
  }

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-8 bg-gradient-to-br from-white via-gray-50 to-indigo-50 rounded-2xl shadow-md">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Pending Verification
          </h1>
          <p className="mt-1 text-gray-600 text-lg">Review and verify candidate information before onboarding</p>
        </div>
        <div className="flex items-center gap-4">
          
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg overflow-auto">
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
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${r.verificationStatus === 'Verified'
                        ? 'bg-green-100 text-green-800'
                        : r.verificationStatus === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                  >
                    {r.verificationStatus || 'Pending'}
                  </span>
                </TD>
                <TD className="px-6 py-4 flex gap-2">
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

                  <Button
                    variant="outline"
                    onClick={() => openMail(r)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-1 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Mail
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <Dialog
        open={!!openViewId}
        onClose={closeView}
        title={`Candidate Details - ${selectedCandidate?.full_name || ''}`}
        className="max-w-6xl w-full rounded-xl p-6 overflow-y-auto max-h-[85vh]"
      >
        {selectedCandidate && (
          <form className="space-y-6 max-h-[80vh] overflow-y-auto px-2 sm:px-6 pb-6 text-gray-800">
            {/* Personal Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Personal Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Full Name"
                  value={selectedCandidate.personalDetails?.fullName || selectedCandidate.full_name || '-'}
                />
                <Input
                  readOnly
                  type="email"
                  placeholder="Email"
                  value={selectedCandidate.personalDetails?.email || selectedCandidate.email || '-'}
                />
                <Input
                  readOnly
                  placeholder="Phone"
                  value={selectedCandidate.personalDetails?.phone || selectedCandidate.phone || '-'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input
                    readOnly
                    type="date"
                    value={joiningDate || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Date</label>
                  <input
                    readOnly
                    type="datetime-local"
                    value={confirmationDate || ''}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-700"
                  />
                </div>
                <Input
                  readOnly
                  placeholder="Current Stage"
                  value={selectedCandidate.current_stage || '-'}
                />
              </div>
            </section>

            {/* Aadhaar Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Aadhaar Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Aadhaar Number"
                  value={selectedCandidate.adharCardDetails?.adharNumber || '-'}
                />
                <Input
                  readOnly
                  placeholder="Name on Aadhaar"
                  value={selectedCandidate.adharCardDetails?.adharName || '-'}
                />
              </div>
            </section>

            {/* Bank Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Bank Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Bank Name"
                  value={selectedCandidate.bankDetails?.bankName || '-'}
                />
                <Input
                  readOnly
                  placeholder="Account Number"
                  value={selectedCandidate.bankDetails?.accountNumber || '-'}
                />
                <Input
                  readOnly
                  placeholder="IFSC Code"
                  value={selectedCandidate.bankDetails?.ifscCode || '-'}
                />
              </div>
            </section>

            {/* Education Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Education Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Highest Qualification"
                  value={selectedCandidate.educationDetails?.highestQualification || '-'}
                />
                <Input
                  readOnly
                  placeholder="University / Board"
                  value={selectedCandidate.educationDetails?.university || '-'}
                />
                <Input
                  readOnly
                  placeholder="Passing Year"
                  value={selectedCandidate.educationDetails?.passingYear || '-'}
                />
              </div>
            </section>

            {/* Experience Details */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Experience Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <Input
                  readOnly
                  placeholder="Company Name"
                  value={selectedCandidate.previousExperience?.companyName || '-'}
                />
                <Input
                  readOnly
                  placeholder="Role / Designation"
                  value={selectedCandidate.previousExperience?.role || '-'}
                />
                <Input
                  readOnly
                  placeholder="Duration"
                  value={selectedCandidate.previousExperience?.duration || '-'}
                />
              </div>
            </section>

            {/* Other Documents */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Other Documents</h2>
              <textarea
                readOnly
                rows={5}
                placeholder="Other document details or URLs"
                value={selectedCandidate.otherDocuments || '-'}
                className="w-full rounded-md border border-gray-300 px-4 py-3 mt-4 resize-y bg-gray-50 text-gray-700 focus:outline-none"
              />
            </section>

            {/* Verification Section */}
            <section>
              <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Verification Status</h2>
              <div className="flex items-center gap-3 mt-4">
                <span
                  className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${selectedCandidate.verificationStatus === 'Accepted'
                      ? 'bg-green-200 text-green-800'
                      : selectedCandidate.verificationStatus === 'Rejected'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
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

            {/* Admin Action Section */}
            <section className="pt-6 border-t">
              <h2 className="text-lg font-semibold text-indigo-700 mb-4">Admin Action</h2>

              <div className="mb-5">
                <label className="block mb-2 text-sm font-medium text-indigo-700">Action</label>
                <select
                  value={action || ''}
                  onChange={(e) => {
                    const v = e.target.value as 'accept' | 'reject' | ''
                    setAction(v || null)
                    // Prefill confirmation date when moving to accept
                    if (v === 'accept') {
                      if (!joiningDate) setJoiningDate(new Date().toISOString().slice(0, 10))
                      setConfirmationDate(new Date().toISOString().slice(0, 16))
                    }
                  }}
                  className="block w-full rounded-md border border-indigo-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-600"
                >
                  <option value="">-- Select action --</option>
                  <option value="accept">Accept</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              {action === 'accept' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block mb-1 font-semibold text-indigo-700">Joining Date</label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full rounded-md border border-indigo-300 px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-indigo-700">Confirmation Date</label>
                    <input
                      type="datetime-local"
                      readOnly
                      value={confirmationDate ? confirmationDate : new Date().toISOString().slice(0, 16)}
                      className="w-full rounded-md border border-indigo-300 px-4 py-3 text-lg bg-gray-100 text-gray-700"
                    />
                  </div>
                </div>
              )}

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

              <div className="flex justify-end gap-4 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={closeView}
                  className="rounded-lg px-6 py-3 text-indigo-600 font-semibold shadow hover:bg-indigo-50 transition"
                >
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
          </form>
        )}
      </Dialog>

      {/* 📨 Send Mail Dialog */}
      <Dialog open={openMailDialog} onClose={() => setOpenMailDialog(false)} title={`Send Mail to ${mailCandidate?.full_name || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Email Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <div className="p-3 border rounded-md bg-gray-50">
              <h3 className="font-semibold text-blue-900 mb-1">Subject:</h3>
              <p className="text-gray-700 mb-2">{selectedTemplate.subject.replace('{{full_name}}', mailCandidate?.full_name || '')}</p>
              <h3 className="font-semibold text-blue-900 mb-1">Body Preview:</h3>
              <div
                className="text-sm text-gray-800"
                dangerouslySetInnerHTML={{
                  __html: selectedTemplate.body_html.replace('{{full_name}}', mailCandidate?.full_name || '')
                                                    .replace('{{email}}', mailCandidate?.email || '')
                                                    .replace('{{password}}', mailCandidate?.fname?.toLocaleLowerCase() + '123$' || '')
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setOpenMailDialog(false)} className="rounded-md px-4 py-2 shadow-sm">
              Cancel
            </Button>
            <Button onClick={sendMailToCandidate} disabled={sendingMail} className="rounded-md px-4 py-2 shadow-md">
              {sendingMail ? 'Sending...' : 'Send Mail'}
            </Button>
          </div>
        </div>
      </Dialog>

    </section>
  )
}
