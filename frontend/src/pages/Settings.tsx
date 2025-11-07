export default function Settings() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              System Settings
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your application preferences and system settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-blue-50 px-3 py-1">
            <div className="text-xs font-medium text-blue-600">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">General Settings</h3>
              <p className="mt-1 text-sm text-gray-500">Configure basic application preferences</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-200 group-hover:scale-100" style={{ transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>

        <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">User Management</h3>
              <p className="mt-1 text-sm text-gray-500">Manage user roles and permissions</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transition-transform duration-200 group-hover:scale-100" style={{ transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>

        <div className="group relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors duration-200 group-hover:bg-purple-600 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Security</h3>
              <p className="mt-1 text-sm text-gray-500">Configure security and access settings</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 transition-transform duration-200 group-hover:scale-100" style={{ transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>
      </div>
    </section>
  )
}


