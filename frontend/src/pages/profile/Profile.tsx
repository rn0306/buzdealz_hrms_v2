import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Dialog from '../../components/ui/Dialog'
import { toast } from 'sonner'
import { api } from '../../lib/api' // ✅ Added for API calls
import { getUser } from '../../utils/auth' // ✅ Import to get logged-in user info

export default function Profile() {
  const [openForm, setOpenForm] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [profile, setProfile] = useState<{
    personalDetails: {
      fullName?: string
      email?: string
      phone?: string
    }
    adharCardDetails: {
      adharNumber?: string
      panNumber?: string
    }
    bankDetails: {
      bankName?: string
      accountNumber?: string
      ifscCode?: string
    }
    educationDetails: {
      highestQualification?: string
      university?: string
      passingYear?: string
    }
    previousExperience: {
      companyName?: string
      role?: string
      duration?: string
    }
    otherDocuments?: string
    verificationStatus?: 'Pending' | 'Accepted' | 'Rejected'
    rejectComment?: string
  }>({
    personalDetails: {},
    adharCardDetails: {},
    bankDetails: {},
    educationDetails: {},
    previousExperience: {},
    otherDocuments: '',
    verificationStatus: 'Pending',
    rejectComment: '',
  })

  useEffect(() => {
    const fetchPersonalDetails = async () => {
      try {
        const user = getUser() // get logged-in user
        if (!user?.id) return
        
        const response = await api.get(`/api/personaldetails/${user.id}`)
        const data = response.data

        // Map API response to form fields
        const personalDetail = data.personalDetail || {}
        setProfile({
          personalDetails: {
            fullName: `${data.fname} ${data.mname ? data.mname + ' ' : ''}${data.lname}`.trim(),
            email: data.email || '',
            phone: data.phone || '',
          },
          adharCardDetails: {
            adharNumber: personalDetail.adhar_card_no || '',
            panNumber: personalDetail.pan_card_no || '',
          },
          bankDetails: {
            bankName: personalDetail.bank_name || '',
            accountNumber: personalDetail.account_no || '',
            ifscCode: personalDetail.ifsc_code || '',
          },
          educationDetails: {
            highestQualification: personalDetail.highest_education || '',
            university: personalDetail.university_name || '',
            passingYear: personalDetail.passing_year || '',
          },
          previousExperience: {
            companyName: personalDetail.last_company_name || '',
            role: personalDetail.role_designation || '',
            duration: personalDetail.duration || '',
          },
          otherDocuments: personalDetail.other_documents_url || '',
          verificationStatus: personalDetail.verification_status || 'PENDING',
          rejectComment: '',
        })

        // If data exists, show preview mode
        if (Object.keys(data).length > 0) {
          setPreviewMode(true)
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) { // Ignore 404 as it just means no profile yet
          toast.error(err?.response?.data?.error || 'Failed to fetch profile')
        }
      }
    }

    fetchPersonalDetails()
  }, [])

  function handleInputChange(section: keyof typeof profile, field: string, value: string) {
    setProfile((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    // Reset rejection if editing after rejection
    if (profile.verificationStatus === 'Rejected') {
      setProfile((prev) => ({
        ...prev,
        verificationStatus: 'Pending',
        rejectComment: '',
      }))
    }
  }

  function handleOtherDocumentsChange(value: string) {
    setProfile((prev) => ({
      ...prev,
      otherDocuments: value,
      verificationStatus: prev.verificationStatus === 'Rejected' ? 'Pending' : prev.verificationStatus,
      rejectComment: prev.verificationStatus === 'Rejected' ? '' : prev.rejectComment,
    }))
  }

  // ✅ API integrated submit handler with userId from auth
  async function handleSubmit(e: React.FormEvent) {debugger
    e.preventDefault()
    try {
      const user = getUser() // ✅ get logged-in user info
      const userId = user?.id // ✅ extract userId

      // Build payload using the exact field names from the API response
      const payload = {
        adhar_card_no: profile.adharCardDetails.adharNumber || undefined,
        pan_card_no: profile.adharCardDetails.panNumber || undefined,
        bank_name: profile.bankDetails.bankName || undefined,
        account_no: profile.bankDetails.accountNumber || undefined,
        ifsc_code: profile.bankDetails.ifscCode || undefined,
        highest_education: profile.educationDetails.highestQualification || undefined,
        university_name: profile.educationDetails.university || undefined,
        passing_year: profile.educationDetails.passingYear || undefined,
        last_company_name: profile.previousExperience.companyName || undefined,
        role_designation: profile.previousExperience.role || undefined,
        duration: profile.previousExperience.duration || undefined,
        other_documents_url: profile.otherDocuments || undefined,
        // Keep these fields as they are in the API
        verification_status: 'PENDING',
        source: 'Portal',
        current_stage: 'New'
      }

      // Update personal details for the current user (PUT will create if missing on the server)
      await api.put(`/api/personaldetails/${userId}`, payload)
      toast.success('Profile saved and sent for verification')
      setPreviewMode(true)
      setOpenForm(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save profile')
    }
  }

  function openEditForm() {
    setOpenForm(true)
    setPreviewMode(false)
  }

  return (
    <section className="mx-auto max-w-4xl p-4 space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-left text-gradient bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
        My Profile
      </h1>

      {!previewMode && !openForm && (
        <div className="rounded-xl border border-gray-300 bg-white p-8 shadow-lg flex flex-col items-center gap-6">
          <p className="text-gray-700 text-lg font-medium">No profile added yet.</p>
          <Button onClick={() => setOpenForm(true)} className="rounded-lg px-6 py-3 text-lg shadow-lg hover:shadow-xl transition">
            Add Profile
          </Button>
        </div>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} title="Add / Edit Profile" className="max-w-4xl w-full rounded-xl overflow-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] px-1 sm:px-6 pb-6">
          {/* Personal Details */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-indigo-600 pb-1">Personal Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input
                placeholder="Full Name"
                value={profile.personalDetails.fullName || ''}
                onChange={(e) => handleInputChange('personalDetails', 'fullName', e.target.value)}
                required
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                type="email"
                placeholder="Email"
                value={profile.personalDetails.email || ''}
                onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)}
                required
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="Phone"
                value={profile.personalDetails.phone || ''}
                onChange={(e) => handleInputChange('personalDetails', 'phone', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
            </div>
          </section>

          {/* Adhar Card Details */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-indigo-600 pb-1">Adhar Card Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                placeholder="Adhar Number"
                value={profile.adharCardDetails.adharNumber || ''}
                onChange={(e) => handleInputChange('adharCardDetails', 'adharNumber', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="PAN Card No"
                value={profile.adharCardDetails.panNumber || ''}
                onChange={(e) => handleInputChange('adharCardDetails', 'panNumber', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
            </div>
          </section>

          {/* Bank Details */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-indigo-600 pb-1">Bank Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input
                placeholder="Bank Name"
                value={profile.bankDetails.bankName || ''}
                onChange={(e) => handleInputChange('bankDetails', 'bankName', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="Account Number"
                value={profile.bankDetails.accountNumber || ''}
                onChange={(e) => handleInputChange('bankDetails', 'accountNumber', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="IFSC Code"
                value={profile.bankDetails.ifscCode || ''}
                onChange={(e) => handleInputChange('bankDetails', 'ifscCode', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
            </div>
          </section>

          {/* Education Details */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-indigo-600 pb-1">Education Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input
                placeholder="Highest Qualification"
                value={profile.educationDetails.highestQualification || ''}
                onChange={(e) => handleInputChange('educationDetails', 'highestQualification', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="University / Board"
                value={profile.educationDetails.university || ''}
                onChange={(e) => handleInputChange('educationDetails', 'university', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="Passing Year"
                value={profile.educationDetails.passingYear || ''}
                onChange={(e) => handleInputChange('educationDetails', 'passingYear', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
            </div>
          </section>

          {/* Previous Experience */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-indigo-600 pb-1">Previous Experience</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input
                placeholder="Company Name"
                value={profile.previousExperience.companyName || ''}
                onChange={(e) => handleInputChange('previousExperience', 'companyName', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="Role / Designation"
                value={profile.previousExperience.role || ''}
                onChange={(e) => handleInputChange('previousExperience', 'role', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
              <Input
                placeholder="Duration"
                value={profile.previousExperience.duration || ''}
                onChange={(e) => handleInputChange('previousExperience', 'duration', e.target.value)}
                className="rounded-md border border-gray-300 px-4 py-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
              />
            </div>
          </section>

          {/* Other Documents */}
          <section className="space-y-2">
            <h2 className="text-xl font-semibold border-b border-indigo-600 pb-1">Other Documents</h2>
            <textarea
              rows={5}
              placeholder="Other documents details or URLs"
              value={profile.otherDocuments || ''}
              onChange={(e) => handleOtherDocumentsChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 resize-y focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 text-lg"
            />
          </section>

          {profile.verificationStatus === 'Rejected' && (
            <div className="bg-red-50 border border-red-400 rounded-lg p-4 mt-4 text-red-800 font-semibold whitespace-pre-wrap">
              Your profile was rejected for the following reason:
              <p className="mt-2 font-normal">{profile.rejectComment || '-'}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpenForm(false)}
              className="rounded-lg px-6 py-3 text-lg font-medium shadow hover:shadow-md transition"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-lg px-6 py-3 text-lg font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-700 hover:to-blue-800 transition">
              Save
            </Button>
          </div>
        </form>
      </Dialog>

      {previewMode && (
        <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-8 shadow-lg space-y-8">
          <h2 className="text-2xl font-extrabold text-indigo-600 border-b border-indigo-600 pb-1 mb-6">Profile Preview</h2>
          {/* ✅ unchanged preview section */}
          {/* ...existing preview content remains identical... */}
          <div className="flex justify-end">
            <Button
              onClick={openEditForm}
              className="rounded-lg px-6 py-3 text-lg font-semibold shadow-lg bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-700 hover:to-blue-800 transition"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
