export default function Reports() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and view detailed reports of your HR operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="group cursor-pointer relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Performance Reports</h3>
              <p className="mt-1 text-sm text-gray-500">View employee performance metrics</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transition-transform duration-200 group-hover:scale-100" style={{ transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>

        <div className="group cursor-pointer relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Recruitment Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">Track recruitment pipeline stats</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transition-transform duration-200 group-hover:scale-100" style={{ transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>

        <div className="group cursor-pointer relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors duration-200 group-hover:bg-purple-600 group-hover:text-white">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Attendance Reports</h3>
              <p className="mt-1 text-sm text-gray-500">Monitor attendance patterns</p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 transition-transform duration-200 group-hover:scale-100" style={{ transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Recent Reports</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No reports generated yet</h3>
            <p className="mt-2 text-sm text-gray-500">Select a report type above to generate your first report.</p>
          </div>
        </div>
      </div>
    </section>
  )
}


