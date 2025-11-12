import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Dialog from '../../components/ui/Dialog'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import { getUser } from '../../utils/auth'

export default function Profile() {
  const [openForm, setOpenForm] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [profile, setProfile] = useState<any>({
    personalDetails: {},
    adharCardDetails: {},
    bankDetails: {},
    educationDetails: {},
    previousExperience: {},
    joining_date: '',
    confirmation_date: '',
    date_of_birth: '',
    otherDocuments: '',
    verificationStatus: 'Pending',
    rejectComment: '',
  })

  useEffect(() => {
    const fetchPersonalDetails = async () => {
      try {
        const user = getUser()
        if (!user?.id) return
        const response = await api.get(`/api/personaldetails/${user.id}`)
        const data = response.data
        const pd = data.personalDetail || {}

        const formattedProfile = {
          personalDetails: {
            fullName: `${data.fname || ''} ${data.lname || ''}`.trim(),
            email: data.email || '',
            phone: data.phone || '',
          },
          adharCardDetails: {
            adharNumber: pd.adhar_card_no || '',
            panNumber: pd.pan_card_no || '',
          },
          bankDetails: {
            bankName: pd.bank_name || '',
            accountNumber: pd.account_no || '',
            ifscCode: pd.ifsc_code || '',
          },
          educationDetails: {
            highestQualification: pd.highest_education || '',
            university: pd.university_name || '',
            passingYear: pd.passing_year || '',
          },
          previousExperience: {
            companyName: pd.last_company_name || '',
            role: pd.role_designation || '',
            duration: pd.duration || '',
          },
          joining_date: data.joining_date || '',
          confirmation_date: data.confirmation_date || '',
          date_of_birth: data.date_of_birth || '',
          otherDocuments: pd.other_documents_url || '',
          verificationStatus: pd.verification_status || 'Pending',
          rejectComment: pd.rejectComment || '',
        }

        setProfile(formattedProfile)
        setPreviewMode(true)
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setPreviewMode(false)
        } else {
          toast.error(err?.response?.data?.error || 'Failed to fetch profile')
        }
      }
    }

    fetchPersonalDetails()
  }, [])

  function handleInputChange(section: keyof typeof profile, field: string, value: string) {
    setProfile((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
  }

  function handleFieldChange(field: string, value: string) {
    setProfile((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const user = getUser()
      const userId = user?.id
      const [fname, ...lnameParts] = (profile.personalDetails.fullName || '').split(' ')
      const lname = lnameParts.join(' ')

      const payload = {
        fname,
        lname,
        email: profile.personalDetails.email || '',
        phone: profile.personalDetails.phone || '',
        joining_date: profile.joining_date || null,
        confirmation_date: profile.confirmation_date || null,
        date_of_birth: profile.date_of_birth || null,
        adhar_card_no: profile.adharCardDetails.adharNumber || '',
        pan_card_no: profile.adharCardDetails.panNumber || '',
        bank_name: profile.bankDetails.bankName || '',
        account_no: profile.bankDetails.accountNumber || '',
        ifsc_code: profile.bankDetails.ifscCode || '',
        highest_education: profile.educationDetails.highestQualification || '',
        university_name: profile.educationDetails.university || '',
        passing_year: profile.educationDetails.passingYear || '',
        last_company_name: profile.previousExperience.companyName || '',
        role_designation: profile.previousExperience.role || '',
        duration: profile.previousExperience.duration || '',
        other_documents_url: profile.otherDocuments || '',
        verification_status: 'PENDING',
        source: 'Portal',
        current_stage: 'New',
      }

      await api.put(`/api/personaldetails/${userId}`, payload)
      toast.success('Profile updated successfully')
      setPreviewMode(true)
      setOpenForm(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save profile')
    }
  }

  return (
    <section className="mx-auto max-w-5xl p-6 space-y-10">
      <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
        My Profile
      </h1>

      {/* If profile exists → show preview */}
      {previewMode && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg space-y-8 transition hover:shadow-xl">
          <h2 className="text-2xl font-semibold text-indigo-700 border-b border-indigo-200 pb-2">
            Profile Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-700">
            <div>
              <p className="font-semibold text-gray-800">Full Name</p>
              <p>{profile.personalDetails.fullName || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Email</p>
              <p>{profile.personalDetails.email || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Phone</p>
              <p>{profile.personalDetails.phone || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Joining Date</p>
              <p>{profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Confirmation Date</p>
              <p>{profile.confirmation_date ? new Date(profile.confirmation_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Date of Birth</p>
              <p>{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Aadhar No</p>
              <p>{profile.adharCardDetails.adharNumber || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">PAN No</p>
              <p>{profile.adharCardDetails.panNumber || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Bank Name</p>
              <p>{profile.bankDetails.bankName || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Qualification</p>
              <p>{profile.educationDetails.highestQualification || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">University</p>
              <p>{profile.educationDetails.university || '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Experience</p>
              <p>{profile.previousExperience.role || '-'}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setOpenForm(true)}
              className="rounded-lg px-6 py-3 text-lg font-semibold shadow-md bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-700 hover:to-blue-800 transition"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      )}

      {/* If no profile exists */}
      {!previewMode && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-md p-10 flex flex-col items-center space-y-6">
          <p className="text-gray-700 text-lg font-medium">No profile added yet.</p>
          <Button
            onClick={() => setOpenForm(true)}
            className="rounded-lg px-6 py-3 text-lg shadow-md bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:from-indigo-700 hover:to-blue-800 transition"
          >
            Add Profile
          </Button>
        </div>
      )}

      {/* Profile Edit Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} title="Add / Edit Profile" className="max-w-5xl w-full rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-2 sm:px-6 pb-6">
          {/* Personal Details */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Personal Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Input placeholder="Full Name" value={profile.personalDetails.fullName || ''} onChange={(e) => handleInputChange('personalDetails', 'fullName', e.target.value)} />
              <Input type="email" placeholder="Email" value={profile.personalDetails.email || ''} onChange={(e) => handleInputChange('personalDetails', 'email', e.target.value)} />
              <Input placeholder="Phone" value={profile.personalDetails.phone || ''} onChange={(e) => handleInputChange('personalDetails', 'phone', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Input type="date" label="Joining Date" value={profile.joining_date || ''} onChange={(e) => handleFieldChange('joining_date', e.target.value)} />
              <Input type="date" label="Confirmation Date" value={profile.confirmation_date || ''} onChange={(e) => handleFieldChange('confirmation_date', e.target.value)} />
              <Input type="date" label="Date of Birth" value={profile.date_of_birth || ''} onChange={(e) => handleFieldChange('date_of_birth', e.target.value)} />
            </div>
          </section>

          {/* Aadhaar & PAN */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Aadhaar & PAN Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input placeholder="Aadhaar Number" value={profile.adharCardDetails.adharNumber || ''} onChange={(e) => handleInputChange('adharCardDetails', 'adharNumber', e.target.value)} />
              <Input placeholder="PAN Number" value={profile.adharCardDetails.panNumber || ''} onChange={(e) => handleInputChange('adharCardDetails', 'panNumber', e.target.value)} />
            </div>
          </section>

          {/* Bank Details */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Bank Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Input placeholder="Bank Name" value={profile.bankDetails.bankName || ''} onChange={(e) => handleInputChange('bankDetails', 'bankName', e.target.value)} />
              <Input placeholder="Account Number" value={profile.bankDetails.accountNumber || ''} onChange={(e) => handleInputChange('bankDetails', 'accountNumber', e.target.value)} />
              <Input placeholder="IFSC Code" value={profile.bankDetails.ifscCode || ''} onChange={(e) => handleInputChange('bankDetails', 'ifscCode', e.target.value)} />
            </div>
          </section>

          {/* Education Details */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Education Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Input placeholder="Highest Qualification" value={profile.educationDetails.highestQualification || ''} onChange={(e) => handleInputChange('educationDetails', 'highestQualification', e.target.value)} />
              <Input placeholder="University / Board" value={profile.educationDetails.university || ''} onChange={(e) => handleInputChange('educationDetails', 'university', e.target.value)} />
              <Input placeholder="Passing Year" value={profile.educationDetails.passingYear || ''} onChange={(e) => handleInputChange('educationDetails', 'passingYear', e.target.value)} />
            </div>
          </section>

          {/* Experience Details */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Experience Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Input placeholder="Company Name" value={profile.previousExperience.companyName || ''} onChange={(e) => handleInputChange('previousExperience', 'companyName', e.target.value)} />
              <Input placeholder="Role / Designation" value={profile.previousExperience.role || ''} onChange={(e) => handleInputChange('previousExperience', 'role', e.target.value)} />
              <Input placeholder="Duration" value={profile.previousExperience.duration || ''} onChange={(e) => handleInputChange('previousExperience', 'duration', e.target.value)} />
            </div>
          </section>

          {/* Other Documents */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 border-b pb-1">Other Documents</h2>
            <textarea
              rows={5}
              placeholder="Other document details or URLs"
              value={profile.otherDocuments || ''}
              onChange={(e) => handleFieldChange('otherDocuments', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 mt-4 resize-y focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300"
            />
          </section>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
              Save
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  )
}
