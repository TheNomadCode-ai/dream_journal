import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Somnia Dream Journal'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#06040f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: 'rgba(180,130,255,0.7)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: 24,
            fontFamily: 'monospace',
          }}
        >
          Dream Journal
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 400,
            color: 'white',
            marginBottom: 24,
            letterSpacing: '-0.02em',
          }}
        >
          Somnia
        </div>
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.50)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}
        >
          Plant an intention each night. Confirm what appeared by morning.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 16,
            color: 'rgba(255,255,255,0.20)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}
        >
          somniavault.me
        </div>
      </div>
    ),
    { ...size }
  )
}
