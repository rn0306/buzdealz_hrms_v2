import { Bell, Search, LogOut, UserCircle } from 'lucide-react'

type HeaderProps = { username?: string; onLogout?: () => void }

export default function Header({ username, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent lg:text-2xl hidden sm:block">
            Human Resource and Management System
          </span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:hidden">
            HRMS
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {username && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <UserCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{username}</span>
            </div>
          )}
          <button className="relative inline-flex items-center justify-center rounded-full h-10 w-10 border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-blue-600 hover:shadow-md">
            <Bell size={18} />
            <span className="absolute right-2 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}


