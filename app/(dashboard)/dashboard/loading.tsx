export default function DashboardPageLoading() {
  return (
    <div className="page-content" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 110px' }}>
      <div
        style={{
          height: '80px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          marginBottom: '16px',
          animation: 'pulse 1.5s infinite',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              height: '80px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '12px',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div className="dashboard-skeleton" style={{ height: 120, marginBottom: 14 }} />
      <div className="dashboard-skeleton" style={{ height: 120 }} />
    </div>
  )
}
