'use client'
import { useEffect, useState } from 'react'
import { deadlineStatus } from '@/lib/utils'

/* Pages are cached and regenerated every few minutes, so the HTML a visitor
 * receives can predate midnight. This drops anything whose deadline has
 * passed by the visitor's clock, and keeps doing so while the tab stays
 * open, so a closed role never lingers on screen.
 *
 * The first render returns the list untouched, matching the server HTML;
 * filtering starts after mount so hydration never disagrees. */
export function useStillOpen<T extends { deadline: Date | string | null }>(items: T[]): T[] {
  const [tick, setTick] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => setTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) return items
  void tick
  return items.filter(i => deadlineStatus(i.deadline ? new Date(i.deadline) : null) !== 'closed')
}
