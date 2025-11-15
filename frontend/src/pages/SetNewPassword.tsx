import React, { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@heroicons/react/solid'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'   // <-- update path if needed
import { toast } from 'sonner'

const SetNewPassword = () => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const navigate = useNavigate()
  const { id } = useParams()
  const query = new URLSearchParams(useLocation().search)
  const token = query.get("token")

  const checks = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  }

  const validatePassword = (password: string) => {
    if (!checks.minLength) return 'Password must be at least 8 characters.'
    if (!checks.uppercase) return 'Password must include at least one uppercase letter.'
    if (!checks.lowercase) return 'Password must include at least one lowercase letter.'
    if (!checks.number) return 'Password must include at least one number.'
    if (!checks.specialChar) return 'Password must include at least one special character.'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setError(validationError)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!id || !token) {
      setError("Invalid reset link")
      return
    }

    try {
      await api.post(`/api/onboarding/set-password/${id}?token=${token}`, {
        new_password: newPassword
      })


      toast.success("Password reset successfully!")
      navigate("/login")

    } catch (err: any) {
      console.log(err)
      setError(err?.response?.data?.message || "Something went wrong")
    }
  }

  const renderCheck = (condition: boolean, label: string) => (
    <li className={`flex items-center space-x-2 text-sm ${condition ? 'text-green-600' : 'text-red-600'}`}>
      <span>{condition ? '✔️' : '✖️'}</span>
      <span>{label}</span>
    </li>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Set New Password
          </h2>
          <p className="mt-2 text-gray-600">Create a new password for your account</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-gray-900/5 p-8">

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 flex items-start gap-3 text-red-700">
              <span>⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="relative mt-1">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-600"
                >
                  {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <ul className="mb-4 space-y-1">
              {renderCheck(checks.minLength, 'At least 8 characters')}
              {renderCheck(checks.uppercase, 'At least one uppercase letter')}
              {renderCheck(checks.lowercase, 'At least one lowercase letter')}
              {renderCheck(checks.number, 'At least one number')}
              {renderCheck(checks.specialChar, 'At least one special character')}
            </ul>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-600"
                >
                  {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg"
            >
              Reset Password
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default SetNewPassword
