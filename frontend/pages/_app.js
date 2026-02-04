import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

import { useEffect } from 'react';

function MyApp({ Component, pageProps, router }) {
  useEffect(() => {
    // Suppress unhandled MetaMask errors
    const handleRejection = (event) => {
      if (
        event.reason?.message?.includes('MetaMask') ||
        event.reason?.stack?.includes('chrome-extension') ||
        event.reason?.message?.includes('Failed to connect')
      ) {
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  return (
    <AuthProvider router={router}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            theme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default MyApp;