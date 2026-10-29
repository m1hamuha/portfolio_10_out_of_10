import type { ReactNode } from 'react'
import type { LeakType } from '../engine'

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

export const IconBolt = (p: P) => <S {...p}><path d="M13 2 3 14h8l-1 8 10-12h-8z" /></S>
export const IconAlert = (p: P) => <S {...p}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></S>
export const IconTag = (p: P) => <S {...p}><path d="M3 11V5a2 2 0 0 1 2-2h6l9 9-7 7-9-9Z" /><circle cx="7.5" cy="7.5" r="1.3" /></S>
export const IconReceipt = (p: P) => <S {...p}><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1Z" /><path d="M9 8h6M9 12h6" /></S>
export const IconReturn = (p: P) => <S {...p}><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-7.7L3 7" /></S>
export const IconBox = (p: P) => <S {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></S>
export const IconMega = (p: P) => <S {...p}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15 8a4 4 0 0 1 0 8M18 5a8 8 0 0 1 0 14" /></S>
export const IconPercent = (p: P) => <S {...p}><path d="m19 5-14 14" /><circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="17" r="2.2" /></S>
export const IconPause = (p: P) => <S {...p}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></S>
export const IconPlay = (p: P) => <S {...p}><path d="M7 4v16l13-8z" /></S>
export const IconClose = (p: P) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
export const IconCheck = (p: P) => <S {...p}><path d="M20 6 9 17l-5-5" /></S>
export const IconShield = (p: P) => <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></S>
export const IconBell = (p: P) => <S {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></S>
export const IconSparkles = (p: P) => <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" /></S>
export const IconSend = (p: P) => <S {...p}><path d="m22 2-7 20-4-9-9-4 20-7Z" /></S>
export const IconTrendDown = (p: P) => <S {...p}><path d="m22 17-8.5-8.5-5 5L2 7" /><path d="M16 17h6v-6" /></S>
export const IconEuro = (p: P) => <S {...p}><path d="M18 7a6 6 0 1 0 0 10M5 10h7M5 14h7" /></S>
export const IconActivity = (p: P) => <S {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></S>
export const IconDownload = (p: P) => <S {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></S>
export const IconFileText = (p: P) => (
  <S {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </S>
)

export const LeakIcon = ({ type, ...p }: P & { type: LeakType }) => {
  switch (type) {
    case 'BELOW_FLOOR': return <IconTag {...p} />
    case 'FEE_HIKE': return <IconReceipt {...p} />
    case 'RETURN_SPIKE': return <IconReturn {...p} />
    case 'BUYBOX_LOST': return <IconBox {...p} />
    case 'STORAGE_FEE': return <IconBox {...p} />
    case 'PPC_BLEED': return <IconMega {...p} />
    case 'VAT_MISMATCH': return <IconPercent {...p} />
    default: return <IconAlert {...p} />
  }
}
