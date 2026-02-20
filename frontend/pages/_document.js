import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

        {/* Meta tags */}
        <meta name="description" content="RealNext CRM - Revolutionizing real estate marketing through intelligent WhatsApp automation" />
        <meta name="keywords" content="real estate CRM, WhatsApp automation, property management, lead generation" />
        <meta name="author" content="RealNext CRM" />

        {/* Open Graph meta tags */}
        <meta property="og:title" content="RealNext CRM - Real Estate WhatsApp Automation" />
        <meta property="og:description" content="Automate your real estate business with intelligent WhatsApp CRM and AI-powered lead management" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://realnex.com" />
        <meta property="og:type" content="website" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RealNext CRM - Real Estate WhatsApp Automation" />
        <meta name="twitter:description" content="Automate your real estate business with intelligent WhatsApp CRM and AI-powered lead management" />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* Security headers — note: X-Frame-Options and X-XSS-Protection must be set via HTTP headers (done in next.config.js), not meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          crossOrigin="anonymous"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          />
        </noscript>
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}