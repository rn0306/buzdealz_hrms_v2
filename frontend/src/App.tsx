import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import LayoutWrapper from './components/LayoutWrapper'
import type { Role } from './config/menus'
import { flattenPathsForRole } from './config/menus'
import Login from './pages/Login'
import { getUser, clearUser } from './utils/auth'

// Import all page components
import Dashboard from './pages/Dashboard'
import Candidates from './pages/recruitment/Candidates'
import Shortlisting from './pages/recruitment/Shortlisting'

import PendingVerification from './pages/onboarding/PendingVerification'
import Verified from './pages/onboarding/Verified'
import OfferLetters from './pages/onboarding/OfferLetters'
import ActiveInterns from './pages/interns/ActiveInterns'
import Extensions from './pages/interns/Extensions'
import Terminations from './pages/interns/Terminations'

import Verification from './pages/subscriptions/Verification'
import Targets from './pages/performance/Targets'
import DailyLogs from './pages/performance/DailyLogs'
import Evaluation from './pages/performance/Evaluation'
import Settings from './pages/Settings'
import Profile from './pages/profile/Profile'

function Protected({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const user = getUser()
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />
  return children as JSX.Element
}

export default function App() {
  const user = getUser()
  const role: Role | undefined = user?.role as Role | undefined
  const paths = role ? flattenPathsForRole(role) : []

  const handleLogout = () => {
    clearUser()
    window.location.href = '/login'
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <LayoutWrapper role={role || 'admin'} username={user?.username} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Recruitment Routes */}
                <Route path="/recruitment/candidates" element={<Candidates />} />
                <Route path="/recruitment/board" element={<Shortlisting />} />
                
                {/* Onboarding Routes */}
                <Route path="/onboarding/pending" element={<PendingVerification />} />
                <Route path="/onboarding/verified" element={<Verified />} />
                <Route path="/onboarding/offer-letters" element={<OfferLetters />} />
                
                {/* Intern Management Routes */}
                <Route path="/interns/active" element={<ActiveInterns />} />
                <Route path="/interns/extensions" element={<Extensions />} />
                <Route path="/interns/terminations" element={<Terminations />} />
                
                {/* Subscription Routes */}
                <Route path="/subscriptions/verify" element={<Verification />} />
                
                {/* Performance Routes */}
                <Route path="/performance/targets" element={<Targets />} />
                <Route path="/performance/daily" element={<DailyLogs />} />
                <Route path="/performance/evaluation" element={<Evaluation />} />
                
                {/* Other Routes */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                
                <Route path="*" element={
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
                      <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
                    </div>
                  </div>
                } />
              </Routes>
            </LayoutWrapper>
          </Protected>
        }
      />
    </Routes>
  )
}
