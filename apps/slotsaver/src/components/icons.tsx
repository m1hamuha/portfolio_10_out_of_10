import { type ReactNode } from 'react'

type P = { size?: number; className?: string; strokeWidth?: number }
const S = ({ size = 18, className, strokeWidth = 1.75, children }: P & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
)

// Brand mark — a stylised leaf/petal over a coin dot (recovery + spa warmth).
export const IconLeaf = (p: P) => (
  <S {...p}>
    <path d="M12 3.5c2.3 2.4 4 4.4 4 6.8a4 4 0 0 1-8 0c0-2.4 1.7-4.4 4-6.8Z" />
    <path d="M12 10.3v9.2" />
  </S>
)
export const IconCalendar = (p: P) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </S>
)
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.2v5l3.2 1.9" /></S>
export const IconCheck = (p: P) => <S {...p}><path d="M20 6.5 9.2 17.3l-5.2-5.1" /></S>
export const IconCheckCircle = (p: P) => (
  <S {...p}><path d="M21.5 11.1V12a9.5 9.5 0 1 1-5.6-8.68" /><path d="m21.5 4.5-9.5 9.51L9 11" /></S>
)
export const IconSparkle = (p: P) => (
  <S {...p}>
    <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z" />
    <path d="M18.5 4v3M20 5.5h-3" />
  </S>
)
export const IconUsers = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.9M20.5 20a5.4 5.4 0 0 0-3.4-5" />
  </S>
)
export const IconSend = (p: P) => <S {...p}><path d="m21.5 2.5-9 20-3.2-8.3L1 11l20.5-8.5Z" /><path d="M21.5 2.5 9.3 14.2" /></S>
export const IconBell = (p: P) => (
  <S {...p}><path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.6 8.4-2.6 8.4h17.2S18 15 18 8.5" /><path d="M13.6 20.5a2 2 0 0 1-3.2 0" /></S>
)
export const IconPhone = (p: P) => (
  <S {...p}><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" /><path d="M10.5 18.5h3" /></S>
)
export const IconArrowRight = (p: P) => <S {...p}><path d="M4.5 12h15M13 5.5l6.5 6.5L13 18.5" /></S>
export const IconDownload = (p: P) => (
  <S {...p}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M5 21h14" />
  </S>
)
export const IconRefresh = (p: P) => (
  <S {...p}><path d="M3.5 12a8.5 8.5 0 0 1 14.5-6l2 2" /><path d="M20.5 4v4h-4" /><path d="M20.5 12a8.5 8.5 0 0 1-14.5 6l-2-2" /><path d="M3.5 20v-4h4" /></S>
)
export const IconTrendUp = (p: P) => <S {...p}><path d="M3.5 16.5 9.5 10l4 4 6.5-7.5" /><path d="M20 6.5h-4.5V11" /></S>
export const IconShield = (p: P) => (
  <S {...p}><path d="M12 2.5 4.5 5.3v6c0 5 3.5 8.3 7.5 9.7 4-1.4 7.5-4.7 7.5-9.7v-6L12 2.5Z" /><path d="m9 11.5 2 2 4-4.2" /></S>
)
export const IconX = (p: P) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
export const IconScissors = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="6.5" r="2.6" /><circle cx="6" cy="17.5" r="2.6" />
    <path d="M8.2 8.1 20 17.5M8.2 15.9 20 6.5M11 12l-2.8 2" />
  </S>
)
export const IconCoins = (p: P) => (
  <S {...p}>
    <ellipse cx="9" cy="7" rx="5.5" ry="2.6" />
    <path d="M3.5 7v4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6V7" />
    <path d="M9 13.6v3.8c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-7.2c0-1.3-2-2.4-4.7-2.6" />
  </S>
)
export const IconBolt = (p: P) => <S {...p}><path d="M13 2.5 4 14h7l-1 7.5L19 10h-7z" /></S>
export const IconHeart = (p: P) => (
  <S {...p}><path d="M12 20.5S3.5 15 3.5 8.8A4.3 4.3 0 0 1 12 6.7a4.3 4.3 0 0 1 8.5 2.1C20.5 15 12 20.5 12 20.5Z" /></S>
)
export const IconPlay = (p: P) => <S {...p}><path d="M7 4.5v15l13-7.5L7 4.5Z" /></S>
export const IconRoute = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="18.5" r="2.4" /><circle cx="18" cy="5.5" r="2.4" />
    <path d="M8.4 18.5H14a3.5 3.5 0 0 0 0-7H10a3.5 3.5 0 0 1 0-7h5.6" />
  </S>
)
export const IconHelp = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.4 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.3-2.6 4" />
    <path d="M12 17.4h.01" />
  </S>
)
export const IconWand = (p: P) => (
  <S {...p}>
    <path d="m4 20 9.5-9.5" /><path d="M14.5 5.5 18.5 9.5" />
    <path d="M16.5 3.5v3M21 8h-3M19.5 12.5l1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
  </S>
)
export const IconX2 = (p: P) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
export const IconStar = (p: P) => (
  <S {...p}><path d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17.1l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86L12 3.5Z" fill="currentColor" stroke="none" /></S>
)
export const IconLock = (p: P) => (
  <S {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></S>
)
export const IconMessage = (p: P) => (
  <S {...p}><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 3.5V17H4A1.5 1.5 0 0 1 2.5 15.5V7A1.5 1.5 0 0 1 4 5.5Z" /></S>
)
