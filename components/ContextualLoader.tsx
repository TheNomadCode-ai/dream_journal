'use client'

export function ContextualLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#06040f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <img
        src="/icons/moon-logo.png"
        alt="Somnia"
        style={{
          width: 100,
          height: 100,
        }}
      />
      <p
        style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontSize: 32,
          color: '#c9a84c',
          margin: 0,
        }}
      >
        Somnia
      </p>
      <p
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          fontSize: 10,
          color: '#9f8abb',
          margin: 0,
        }}
      >
        program your dreams
      </p>
    </div>
  )
}