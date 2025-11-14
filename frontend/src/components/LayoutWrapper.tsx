import type { PropsWithChildren } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import type { Role } from '../config/menus'

type LayoutWrapperProps = PropsWithChildren<{ role: Role; username?: string; onLogout?: () => void }>

export default function LayoutWrapper({ children, role, username, onLogout }: LayoutWrapperProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header username={username} onLogout={onLogout} />
        <main className="flex-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
              {children}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}


