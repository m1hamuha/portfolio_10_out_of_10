import type { ReactNode } from 'react'

type P = { size?: number; className?: string }
const S = ({ size = 18, className, children }: P & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const IconScan = (p: P) => (
  <S {...p}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M3 12h18" />
  </S>
)
export const IconFile = (p: P) => (
  <S {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h6" />
  </S>
)
export const IconCheck = (p: P) => <S {...p}><path d="M20 6 9 17l-5-5" /></S>
export const IconCheckCircle = (p: P) => (
  <S {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m22 4-10 10.01L9 11" /></S>
)
export const IconAlert = (p: P) => (
  <S {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></S>
)
export const IconClose = (p: P) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
export const IconWand = (p: P) => (
  <S {...p}><path d="m3 21 12-12M15 5l4 4M14 4l1.5 1.5M19 9l1.5 1.5M18 3l.7 1.4M21 6l1.4.7M6 14l.7 1.4M3 11l1.4.7" /></S>
)
export const IconArrowRight = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>
export const IconSend = (p: P) => <S {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z" /></S>
export const IconBell = (p: P) => (
  <S {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></S>
)
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>
export const IconShield = (p: P) => (
  <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></S>
)
export const IconBolt = (p: P) => <S {...p}><path d="M13 2 3 14h8l-1 8 10-12h-8z" /></S>
export const IconLayers = (p: P) => (
  <S {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></S>
)
export const IconUpload = (p: P) => (
  <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 8l5-5 5 5M12 3v12" /></S>
)
export const IconReceipt = (p: P) => (
  <S {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M8 7h8M8 11h8M8 15h5" /></S>
)
export const IconEuro = (p: P) => <S {...p}><path d="M18 7a6 6 0 1 0 0 10M5 10h7M5 14h7" /></S>
export const IconBook = (p: P) => (
  <S {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></S>
)
export const IconSparkles = (p: P) => (
  <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" /></S>
)
export const IconRefresh = (p: P) => (
  <S {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" /></S>
)
export const IconInbox = (p: P) => (
  <S {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" /></S>
)
export const IconHelp = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></S>
)
export const IconPlay = (p: P) => <S {...p}><path d="M6 4.5 19 12 6 19.5z" /></S>
export const IconRoute = (p: P) => (
  <S {...p}><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" /></S>
)
