import Link from 'next/link';
import {
  HomeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-lg text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="mx-auto h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <MagnifyingGlassIcon className="h-16 w-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-yellow-900">?</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            404
          </h1>

          <h2 className="text-2xl font-semibold text-slate-800 mb-4">
            Page Not Found
          </h2>

          <p className="text-slate-600 mb-8 leading-relaxed">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/" className="btn btn-primary w-full h-12">
              <HomeIcon className="h-5 w-5 mr-2" />
              Go to Homepage
            </Link>

            <button
              onClick={() => window.history.back()}
              className="btn btn-outline w-full h-12"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Go Back
            </button>
          </div>

          {/* Popular Pages */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-900 mb-4">
              Popular Pages
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/"
                className="text-left p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900"
              >
                🏠 Homepage
              </Link>
              <Link
                href="/auth/login"
                className="text-left p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900"
              >
                🔐 Sign In
              </Link>
              <Link
                href="/dashboard"
                className="text-left p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 hover:text-slate-900"
              >
                📊 Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Need help?{' '}
            <a href="mailto:support@synditech.com" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}