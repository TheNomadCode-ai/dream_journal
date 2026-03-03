import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0B12',
        surface:    '#12141F',
        border:     '#1E2235',
        gold:       '#C9A84C',
        lavender:   '#7B6EAB',
        'text-primary': '#E8E4D9',
        'text-muted':   '#6B6F85',
      },
      fontFamily: {
        display: ['Cormorant', 'Georgia', 'serif'],
        body:    ['Crimson Pro', 'Georgia', 'serif'],
        ui:      ['Josefin Sans', 'sans-serif'],
        sans:    ['Crimson Pro', 'Georgia', 'serif'],
      },
      letterSpacing: {
        ui: '0.15em',
        wide: '0.12em',
      },
      boxShadow: {
        'gold-glow': '0 0 0 1px rgba(201,168,76,0.3), 0 8px 32px rgba(201,168,76,0.1)',
        'card-hover': '0 16px 48px rgba(0,0,0,0.45)',
        'float': '0 4px 24px rgba(201,168,76,0.38)',
        'float-hover': '0 8px 36px rgba(201,168,76,0.55)',
      },
    },
  },
  plugins: [],
}

export default config
