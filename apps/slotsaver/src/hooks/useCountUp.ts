import { useEffect, useRef, useState } from 'react'

// Animated number that counts up to a target (integer, e.g. cents). Cubic ease-out.
// Honours reduced motion by snapping to the target. Shared by the hero stat and
// the live demo widgets so there is exactly ONE count-up grammar across the page.
export function useCountUp(target: number, reduced: boolean, ms = 900): number {
  const [val, setVal] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    if (reduced) {
      setVal(target)
      from.current = target
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const eased = 1 - Math.pow(1 - k, 3)
      setVal(Math.round(a + (target - a) * eased))
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = target
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, reduced, ms])
  return val
}
