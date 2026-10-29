import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// 220ms ease-out fade + 8px rise on scroll-in. Mirrors the flagship's robust
// reveal: reduced-motion users get a plain, fully-opaque element (no JS fade at
// all), and motion users REST at opacity 0.85 — never a blank opacity:0 wall.
// That keeps below-fold sections readable for bots / full-page captures / slow
// loads (no empty "dead-band" before the page is scrolled) while normal users
// still get a soft reveal. The previous 0.001 resting state left every
// not-yet-scrolled section invisible — that was the mobile dead-band.
export function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li'
}) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as] as typeof motion.div
  return (
    <MotionTag
      className={className}
      initial={reduced ? false : { opacity: 0.85, y: 8 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={reduced ? undefined : { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  )
}
