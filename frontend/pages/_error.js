import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  HomeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function Error({ statusCode, title, message }) {
  const router = useRouter();

  useEffect(() => {
    // Log error for debugging
    console.error('Error page rendered:', { statusCode, title, message });
  }, [statusCode, title, message]);

  const getErrorContent = () => {
    switch (statusCode) {
      case 404:
        return {
          title: 'Page Not Found',
          message: 'The page you are looking for does not exist.',
          icon: ExclamationTriangleIcon,
          color: 'text-yellow-500'
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          icon: ExclamationTriangleIcon,
          color: 'text-red-500'
        };
      default:
        return {
          title: title || 'An Error Occurred',
          message: message || 'Something went wrong. Please try again.',
          icon: ExclamationTriangleIcon,
          color: 'text-red-500'
        };
    }
  };

  const errorContent = getErrorContent();
  const IconComponent = errorContent.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto h-20 w-20 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mb-8">
          <IconComponent className={`h-10 w-10 ${errorContent.color}`} />
        </div>

        {/* Error Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {errorContent.title}
          </h1>

          <p className="text-slate-600 mb-8 leading-relaxed">
            {errorContent.message}
          </p>

          {/* Error Code */}
          {statusCode && (
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium">
                Error {statusCode}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.reload()}
              className="btn btn-primary w-full h-12"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>

            <Link href="/" className="btn btn-outline w-full h-12">
              <HomeIcon className="h-5 w-5 mr-2" />
              Go Home
            </Link>

            <button
              onClick={() => router.back()}
              className="btn btn-ghost w-full h-12 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Go Back
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            If this problem persists, please{' '}
            <a href="mailto:support@synditech.com" className="text-primary hover:text-primary/80 transition-colors font-medium">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;