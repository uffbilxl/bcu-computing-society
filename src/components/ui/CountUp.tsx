'use client'
import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/* Renders the real number in the server HTML, then counts up to it once
 * mounted. Used where the number is live data, so the motion says "this
 * is current" rather than decorating a constant. */
export function CountUp({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reduced || value <= 0) return
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => { el.textContent = String(Math.round(v)) },
    })
    return () => controls.stop()
  }, [value, duration, reduced])

  return <span ref={ref} className="tabular-nums">{value}</span>
}
