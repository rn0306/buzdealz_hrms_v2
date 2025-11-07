export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/80 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <p className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-sm font-medium text-transparent">
              © {new Date().getFullYear()} Human Resource and Management System. All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-4 sm:space-x-6">
            <a href="#" className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600">
              Terms
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600">
              Privacy
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-blue-600">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}


