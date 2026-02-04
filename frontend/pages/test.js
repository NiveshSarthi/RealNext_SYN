export default function Test() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '20px' }}>
        Test Page - SyndiTech CRM
      </h1>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        If you can see this, Next.js is working correctly!
      </p>
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #d1d5db'
      }}>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>System Status:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '8px' }}>✅ Next.js Server: Running</li>
          <li style={{ marginBottom: '8px' }}>✅ React Components: Working</li>
          <li style={{ marginBottom: '8px' }}>✅ Tailwind CSS: Configured</li>
          <li style={{ marginBottom: '8px' }}>✅ Custom Components: Available</li>
        </ul>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a
          href="/"
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block'
          }}
        >
          Go to Landing Page
        </a>
        <a
          href="/dashboard"
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '10px 20px',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block',
            marginLeft: '10px'
          }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}