import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { daysToDeadline } from './time'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* Deadlines are UK calendar days (see deadlineDay in ./time), so they are
 * formatted as that day rather than shifted into the viewer's timezone,
 * where a US visitor would see the day before. */
export function formatDeadline(date: Date | null): string {
  if (!date) return 'No deadline'
  return formatInTimeZone(date, 'Europe/London', 'd MMM yyyy')
}

/* Relative phrasing to sit beside the date, never instead of it. */
export function deadlineHint(date: Date | null): string | null {
  if (!date) return null
  const d = daysToDeadline(date)
  if (d < 0) return 'Closed'
  if (d === 0) return 'Closes today'
  if (d === 1) return 'Closes tomorrow'
  if (d <= 30) return `Closes in ${d} days`
  return null
}

export function deadlineStatus(date: Date | null): 'open' | 'closing' | 'closed' {
  if (!date) return 'open'
  const d = daysToDeadline(date)
  if (d < 0) return 'closed'
  if (d <= 7) return 'closing'
  return 'open'
}

export function daysUntil(date: Date | null): number | null {
  if (!date) return null
  return daysToDeadline(date)
}

export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatSalary(min: number | null, max: number | null, raw: string | null): string {
  if (raw) return raw
  if (!min && !max) return 'Unpaid'
  if (min && !max) return `£${min.toLocaleString()}`
  if (!min && max) return `Up to £${max!.toLocaleString()}`
  if (min === max) return `£${min!.toLocaleString()}`
  return `£${min!.toLocaleString()} – £${max!.toLocaleString()}`
}

export function opportunityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    INTERNSHIP: 'Internship',
    PLACEMENT: 'Placement',
    GRADUATE: 'Graduate',
    SPRING_WEEK: 'Spring Week',
    INSIGHT: 'Insight',
  }
  return map[type] ?? type
}

/* Type is a category, not a state, so it stays neutral. Colour is kept for
 * what needs attention (closing soon, new, closed); a spring week in amber
 * read as "closing soon" at a glance. */
export function opportunityTypeBadgeClass(_type: string): string {
  return 'badge-gray'
}

export function workModeLabel(mode: string): string {
  const map: Record<string, string> = {
    REMOTE: 'Remote',
    HYBRID: 'Hybrid',
    ONSITE: 'On-site',
  }
  return map[mode] ?? mode
}

export function eventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    WORKSHOP: 'Workshop',
    PANEL: 'Panel',
    HACKATHON: 'Hackathon',
    NETWORKING: 'Networking',
    TALK: 'Talk',
    OTHER: 'Event',
  }
  return map[type] ?? type
}

export function spotsLeft(spots: number | null, registrations: number): string | null {
  if (!spots) return null
  const left = spots - registrations
  if (left <= 0) return 'Full'
  if (left <= 5) return `${left} spots left`
  if (left <= 15) return `${left} spots left`
  return null
}
