import type { TabKey } from '../lib/types'

const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function TabIcon({ k }: { k: TabKey }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24' }
  switch (k) {
    case 'home':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" {...p} />
          <path d="M12 7v5l3 2" {...p} />
        </svg>
      )
    case 'body':
      return (
        <svg {...common}>
          <path d="M5 20V10M12 20V4M19 20v-7" {...p} />
        </svg>
      )
    case 'meal':
      return (
        <svg {...common}>
          <path d="M7 3v8a2 2 0 0 0 2 2v8M7 3v6M11 3v6M9 3v6M17 21V3c-2 1-3 4-3 8h3" {...p} />
        </svg>
      )
    case 'train':
      return (
        <svg {...common}>
          <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" {...p} />
        </svg>
      )
    case 'analysis':
      return (
        <svg {...common}>
          <path d="M3 17l5-6 4 3 8-9" {...p} />
          <path d="M3 21h18" {...p} />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="3" {...p} />
          <path d="M3.5 10h17M8 3v4M16 3v4" {...p} />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" {...p} />
          <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" {...p} />
        </svg>
      )
  }
}
