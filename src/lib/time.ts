import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'

/* Every SCA event happens in Birmingham, so the times on this site are UK
 * times and must read the same wherever the page is rendered or viewed.
 *
 * Two things make that non-automatic. Vercel's servers run in UTC, so a bare
 * new Date('2026-09-23T13:00:00') on the server is 13:00 UTC, which a UK
 * visitor in BST then sees as 2pm. And a visitor abroad would otherwise have
 * a Birmingham event translated into their own timezone, which is wrong for
 * a room on campus.
 *
 * So: store true instants, build them from UK wall-clock time, and always
 * render them in UK time. BST/GMT is handled by the timezone database
 * rather than by hardcoded offsets, so events either side of the late
 * October change are both correct. */
export const LONDON = 'Europe/London'

/** A UK wall-clock time ("2026-09-23T13:00:00") as a true instant. */
export function londonTime(wallClock: string): Date {
  return fromZonedTime(wallClock, LONDON)
}

/** Formats an instant as it reads in Birmingham, wherever the viewer is. */
export function formatLondon(date: Date, pattern: string): string {
  return formatInTimeZone(date, LONDON, pattern)
}

/* An instant re-expressed so its local fields hold UK wall-clock time.
 * The calendar grid needs this: its cells are UK calendar days, and the
 * date-fns arithmetic over them (startOfMonth, addDays, isSameDay) reads
 * local fields, so the whole grid has to sit in UK wall-clock space for
 * "today" and the day an event falls on to be right. */
export function londonWallClock(date: Date): Date {
  return toZonedTime(date, LONDON)
}

/* ── Application deadlines ────────────────────────────────────
   A deadline is a calendar day, not an instant: "closes 6 Oct" means
   applications are open all of 6 Oct. Comparing the stored value to the
   current instant closed every role at the start of its final day, so
   these compare UK calendar days instead: a role stays listed through its
   deadline and drops off the next morning.

   Stored deadlines come in two shapes. The scraper writes midnight UTC;
   rows entered from a UK machine are midnight UK time (23:00 UTC the
   evening before, in summer). Reading both as a UK calendar date gives
   the intended day for either, which reading them in UTC does not. */

/** Today's UK calendar date, "yyyy-MM-dd". */
export function londonToday(now: Date = new Date()): string {
  return formatInTimeZone(now, LONDON, 'yyyy-MM-dd')
}

/** A stored deadline as the calendar day it names, "yyyy-MM-dd". */
export function deadlineDay(deadline: Date): string {
  return formatInTimeZone(deadline, LONDON, 'yyyy-MM-dd')
}

/** Whole days from today (UK) to the deadline day: 0 = closes today, -1 = closed yesterday. */
export function daysToDeadline(deadline: Date, now: Date = new Date()): number {
  const a = Date.parse(londonToday(now) + 'T00:00:00Z')
  const b = Date.parse(deadlineDay(deadline) + 'T00:00:00Z')
  return Math.round((b - a) / 86_400_000)
}

/** For database filters: a deadline on or after this instant (the start of
 *  today, UK time) falls on today or later, so the role is still open. */
export function openDeadlineFloor(now: Date = new Date()): Date {
  return fromZonedTime(londonToday(now) + 'T00:00:00', LONDON)
}
