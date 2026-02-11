import Head from 'next/head';
import Link from 'next/link';
import { LockClosedIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedClient() {
    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-6 text-center">
            <Head>
                <title>Access Blocked | RealNext</title>
            </Head>

            <div className="bg-[#161B22] border border-gray-800 p-10 rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldExclamationIcon className="h-12 w-12 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-4 italic">
                    Access Blocked
                </h1>

                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    You are not authorized to access this. <br />
                    <span className="text-gray-300 font-medium font-bold">Kindly contact the administration.</span>
                </p>

                <div className="space-y-4">
                    <Link
                        href="/"
                        className="block w-full py-3 px-6 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-all shadow-glow"
                    >
                        Return to Login
                    </Link>

                    <p className="text-sm text-gray-500">
                        Organization ID: <span className="font-mono">Suspended</span>
                    </p>
                </div>
            </div>

            <footer className="mt-12 text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} RealNext by Syndicate. All rights reserved.
            </footer>
        </div>
    );
}
