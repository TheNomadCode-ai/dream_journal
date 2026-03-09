'use client'

type LoaderState =
  | 'morning_after_seed'
  | 'morning_no_seed'
  | 'evening_window'
  | 'evening_seed_planted'
  | 'default'

function getLoaderState(): LoaderState {
  // Guard browser-only APIs during prerender/SSR.
  if (typeof window === 'undefined') return 'default'

  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const nowTotal = h * 60 + m

  try {
    const cached = localStorage.getItem('somnia_profile')
    if (cached) {
      const { data: profile } = JSON.parse(cached) as {
        data?: {
          target_wake_time?: string | null
          target_sleep_time?: string | null
        }
      }

      const wake = profile?.target_wake_time
      const sleep = profile?.target_sleep_time
      if (!wake || !sleep) return 'default'

      const [wakeH, wakeM] = wake.split(':').map(Number)
      const [sleepH, sleepM] = sleep.split(':').map(Number)

      const wakeTotal = wakeH * 60 + wakeM
      const sleepTotal = sleepH * 60 + sleepM
      const morningStart = wakeTotal - 120
      const eveningStart = sleepTotal - 10

      const today = new Date().toISOString().split('T')[0]
      const seedPlanted = localStorage.getItem('somnia_seed_planted_date') === today
      const morningDone = localStorage.getItem('somnia_morning_entry_date') === today

      if (nowTotal >= morningStart && nowTotal <= wakeTotal && seedPlanted && !morningDone) {
        return 'morning_after_seed'
      }

      if (nowTotal >= morningStart && nowTotal <= wakeTotal && !morningDone) {
        return 'morning_no_seed'
      }

      if (nowTotal >= eveningStart && nowTotal <= sleepTotal && seedPlanted) {
        return 'evening_seed_planted'
      }

      if (nowTotal >= eveningStart && nowTotal <= sleepTotal && !seedPlanted) {
        return 'evening_window'
      }
    }
  } catch {
    // Fall through to default for any parsing/storage errors.
  }

  return 'default'
}

const MESSAGES: Record<LoaderState, { heading: string; body: string; sub: string }> = {
  morning_after_seed: {
    heading: 'Still yourself.',
    body: 'What do you remember\nbefore it fades?',
    sub: 'Recall fades within minutes of waking.',
  },
  morning_no_seed: {
    heading: 'Good morning.',
    body: 'What did you\ndream about?',
    sub: 'Write before you do anything else.',
  },
  evening_window: {
    heading: 'Almost time.',
    body: 'What do you want\nto dream about tonight?',
    sub: 'Your planting window is open.',
  },
  evening_seed_planted: {
    heading: 'Your seed is planted.',
    body: 'Still your mind.\nLet sleep do its work.',
    sub: 'Focus leads to deeper recall in the morning.',
  },
  default: {
    heading: 'Somnia.',
    body: 'Dream programming\npractice.',
    sub: '',
  },
}

export function ContextualLoader() {
  const state = getLoaderState()
  const msg = MESSAGES[state]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#06040f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        zIndex: 9999,
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 100 100"
        style={{
          marginBottom: '40px',
          opacity: 0.6,
        }}
      >
        <defs>
          <radialGradient id="lg" cx="32%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(240,225,255,1)" />
            <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="42" fill="url(#lg)" />
        <circle cx="66" cy="44" r="35" fill="#06040f" />
      </svg>

      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
          fontSize: '9px',
          letterSpacing: '0.3em',
          color: 'rgba(180,130,255,0.4)',
          textTransform: 'uppercase',
          marginBottom: '20px',
        }}
      >
        Somnia
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          lineHeight: 1.4,
          marginBottom: '12px',
          whiteSpace: 'pre-line',
        }}
      >
        {msg.heading}
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '28px',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          lineHeight: 1.4,
          marginBottom: '32px',
          whiteSpace: 'pre-line',
        }}
      >
        {msg.body}
      </div>

      {msg.sub && (
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.18)',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {msg.sub}
        </div>
      )}
    </div>
  )
}