import type { EventType, SCAEvent } from '@/types'

import { londonTime } from './time'

/* Reads the SCA's Google Calendar so the events page follows whatever the
 * committee puts in the calendar, instead of an array somebody has to
 * remember to edit. One direction only: the site never writes back.
 *
 * Two routes in. The calendar is public, so its iCal feed can be read with
 * no credentials at all — that is the default, and it is what keeps the
 * page in sync without anyone having to set up an API key. If
 * GOOGLE_CALENDAR_API_KEY is set, the Calendar API is tried first (it does
 * the recurrence expansion for us), and the feed is the fallback.
 *
 * If both fail the page uses its committed event list, so an outage
 * degrades to "slightly stale" rather than an empty events page. */

const API = 'https://www.googleapis.com/calendar/v3/calendars'
const ICAL = 'https://calendar.google.com/calendar/ical'

/* The society calendar. Public by design (students subscribe to it), so
 * its id is not a secret; the env var only exists to point a preview
 * build at a test calendar. */
const DEFAULT_CALENDAR_ID =
  '01d03f76b62349b697902c40db30783e883e2aba751a9e194bd37f1f6207b5a6@group.calendar.google.com'

/* How far either side of today to read. Past events still render in the
 * list view's Past tab and in earlier calendar months, so the window has to
 * reach backwards too. */
const MONTHS_BACK = 6
const MONTHS_AHEAD = 12

/* Title keywords, most specific first — "Cyber Security Panel" is a panel,
 * not a workshop, so whichever keyword appears earliest in this list wins
 * rather than whichever appears earliest in the title. Anything unmatched
 * becomes OTHER, which renders as the neutral "Event" badge. */
const TYPE_KEYWORDS: [RegExp, EventType][] = [
  [/\b(hackathon|capture the flag|ctf|game ?jam)\b/i, 'HACKATHON'],
  [/\b(panel|roundtable|round table|q&a|ama)\b/i, 'PANEL'],
  [/\b(fireside|talk|speaker|lecture|keynote|seminar)\b/i, 'TALK'],
  [/\b(networking|meet|mixer|social|welcome|mingle)\b/i, 'NETWORKING'],
  [
    /\b(workshop|masterclass|club|session|sprint|bootcamp|lab|tutorial|training|course|build|coding|hands[- ]on|intro to)\b/i,
    'WORKSHOP',
  ],
]

const VALID_TYPES: EventType[] = ['WORKSHOP', 'PANEL', 'HACKATHON', 'NETWORKING', 'TALK', 'OTHER']

/* An explicit [WORKSHOP] anywhere in the title or description beats the
 * keywords, for the events whose name gives nothing away ("Build Your Own
 * LLM"). stripTypeTag() keeps the tag out of what students actually see. */
const TYPE_TAG = /\[(workshop|panel|hackathon|networking|talk|other)\]/i

export function stripTypeTag(title: string): string {
  return title.replace(TYPE_TAG, '').replace(/\s{2,}/g, ' ').trim()
}

export function inferEventType(title: string, description = ''): EventType {
  const haystack = `${title} ${description}`

  const tagged = haystack.match(TYPE_TAG)
  if (tagged) {
    const explicit = tagged[1].toUpperCase() as EventType
    if (VALID_TYPES.includes(explicit)) return explicit
  }

  for (const [pattern, type] of TYPE_KEYWORDS) {
    if (pattern.test(haystack)) return type
  }
  return 'OTHER'
}

/* Things Google Calendar has no field for. Keyed by the lowercased event
 * title so it survives the event being deleted and recreated (which changes
 * its Google id). Add an entry here when an event needs a poster image, an
 * external registration form, or a capacity. */
interface EventExtras {
  poster?: string
  registrationUrl?: string
  spots?: number
}

const EXTRAS: Record<string, EventExtras> = {
  'social night: debate & gaming': { poster: '/posters/social-night-june-2026.jpg' },
}

/* Google's HTML descriptions carry <br>, <a> and entities; the card renders
 * plain text, so flatten rather than dangerouslySetInnerHTML. */
function toPlainText(html: string | undefined): string | null {
  if (!html) return null
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > 0 ? text : null
}

interface GoogleEvent {
  id?: string
  status?: string
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

function toSCAEvent(g: GoogleEvent): SCAEvent | null {
  const rawTitle = g.summary?.trim()
  // An untitled or cancelled entry is not something to show students.
  if (!rawTitle || g.status === 'cancelled') return null
  // Type is read from the raw title, then the tag is stripped for display.
  const type = inferEventType(rawTitle, toPlainText(g.description) ?? '')
  const title = stripTypeTag(rawTitle)

  const startRaw = g.start?.dateTime ?? g.start?.date
  if (!startRaw) return null
  const date = new Date(startRaw)
  if (Number.isNaN(date.getTime())) return null

  /* All-day events give a bare date and an exclusive end date. Showing
   * "12:00 AM – 12:00 AM" for those would be worse than showing no end
   * time at all, so they get a null endDate and the card omits the range. */
  const allDay = !g.start?.dateTime
  const endRaw = g.end?.dateTime
  const endDate = !allDay && endRaw ? new Date(endRaw) : null

  const description = toPlainText(g.description)
  const extras = EXTRAS[title.toLowerCase()] ?? {}

  return {
    id: g.id ?? `gcal-${date.toISOString()}-${title}`,
    title,
    description,
    location: g.location?.split(',')[0]?.trim() || 'STEAMhouse',
    isOnline: /online|zoom|teams|meet\.google/i.test(`${g.location ?? ''} ${description ?? ''}`),
    date,
    endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
    spots: extras.spots ?? null,
    registrations: 0,
    registrationUrl: extras.registrationUrl ?? null,
    type,
    poster: extras.poster ?? null,
  }
}

/* ── iCal feed ──────────────────────────────────────────────────
   A deliberately small reader for what Google's public feed contains:
   one-off events, weekly/daily/monthly series with UNTIL or COUNT,
   EXDATE for deleted occurrences, and RECURRENCE-ID for an occurrence
   that was edited on its own. Recurrences are expanded in UK wall-clock
   time and converted per occurrence, so a 1pm session stays at 1pm
   across the October clock change. */

interface IcsProp { params: Record<string, string>; value: string }
type IcsEvent = Record<string, IcsProp[]>

function unescapeIcs(v: string): string {
  return v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1')
}

function parseIcs(text: string): IcsEvent[] {
  // Unfold: a line starting with a space or tab continues the previous one.
  const lines = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  const events: IcsEvent[] = []
  let current: IcsEvent | null = null
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = {}; continue }
    if (line === 'END:VEVENT') { if (current) events.push(current); current = null; continue }
    if (!current) continue
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const [name, ...paramParts] = line.slice(0, colon).split(';')
    const params: Record<string, string> = {}
    for (const p of paramParts) {
      const [k, v] = p.split('=')
      if (k && v) params[k.toUpperCase()] = v
    }
    const key = name.toUpperCase()
    ;(current[key] ??= []).push({ params, value: line.slice(colon + 1) })
  }
  return events
}

/** "20260923T130000" → "2026-09-23T13:00:00" */
function toWallClock(v: string): string {
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}T${v.slice(9, 11) || '00'}:${v.slice(11, 13) || '00'}:${v.slice(13, 15) || '00'}`
}

/* An iCal date-time as an instant, plus the UK wall-clock string it was
 * written in (needed to step a recurrence without drifting across DST). */
function icsInstant(prop: IcsProp): { at: Date; wall: string | null; allDay: boolean } {
  const v = prop.value.trim()
  if (prop.params.VALUE === 'DATE' || /^\d{8}$/.test(v)) {
    const wall = toWallClock(v)
    return { at: londonTime(wall), wall, allDay: true }
  }
  if (v.endsWith('Z')) return { at: new Date(toWallClock(v.slice(0, -1)) + 'Z'), wall: null, allDay: false }
  // TZID or floating: every society event is in Birmingham, so read as UK time.
  const wall = toWallClock(v)
  return { at: londonTime(wall), wall, allDay: false }
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function addDaysToWall(wall: string, days: number): string {
  const d = new Date(wall.slice(0, 10) + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10) + wall.slice(10)
}

/* Start instants for every occurrence of a series, bounded by the rule's
 * own UNTIL/COUNT and by the window we read. */
function expandRule(start: { at: Date; wall: string | null }, rrule: string, windowEnd: Date): Date[] {
  const rule = Object.fromEntries(rrule.split(';').map(part => part.split('='))) as Record<string, string>
  const freq = rule.FREQ
  const interval = Math.max(1, Number(rule.INTERVAL ?? 1))
  const count = rule.COUNT ? Number(rule.COUNT) : Infinity
  const until = rule.UNTIL ? icsInstant({ params: {}, value: rule.UNTIL }).at : null
  const limit = until && until < windowEnd ? until : windowEnd

  // A UTC-anchored series has no wall clock; step it in UTC instead.
  const wall = start.wall ?? start.at.toISOString().slice(0, 19)
  const toInstant = (w: string) => (start.wall ? londonTime(w) : new Date(w + 'Z'))

  const out: Date[] = []
  const push = (w: string) => {
    const at = toInstant(w)
    if (at < start.at || at > limit || out.length >= count) return false
    out.push(at)
    return true
  }

  if (freq === 'WEEKLY') {
    const startDow = new Date(wall.slice(0, 10) + 'T00:00:00Z').getUTCDay()
    const days = (rule.BYDAY ? rule.BYDAY.split(',') : [WEEKDAYS[startDow]])
      .map(d => WEEKDAYS.indexOf(d.slice(-2)))
      .filter(d => d >= 0)
      .sort((a, b) => a - b)
    // Walk week by week from the start week's Sunday.
    let weekStart = addDaysToWall(wall, -startDow)
    for (let guard = 0; guard < 600 && out.length < count; guard++) {
      if (toInstant(weekStart) > limit) break
      for (const d of days) {
        const w = addDaysToWall(weekStart, d)
        if (toInstant(w) >= start.at) push(w)
      }
      weekStart = addDaysToWall(weekStart, 7 * interval)
    }
  } else if (freq === 'DAILY') {
    for (let w = wall, guard = 0; guard < 2000 && out.length < count; guard++, w = addDaysToWall(w, interval)) {
      if (toInstant(w) > limit) break
      push(w)
    }
  } else if (freq === 'MONTHLY') {
    const [y, m] = [Number(wall.slice(0, 4)), Number(wall.slice(5, 7))]
    for (let i = 0; i < 240 && out.length < count; i += interval) {
      const d = new Date(Date.UTC(y, m - 1 + i, 1))
      const w = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${wall.slice(8)}`
      if (toInstant(w) > limit) break
      push(w)
    }
  } else {
    out.push(start.at)
  }
  return out
}

async function fetchIcsEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<GoogleEvent[] | null> {
  const res = await fetch(`${ICAL}/${encodeURIComponent(calendarId)}/public/basic.ics`, {
    next: { revalidate: 900 },
  })
  if (!res.ok) {
    console.error(`Google Calendar feed failed: ${res.status}`)
    return null
  }
  const raw = parseIcs(await res.text())
  const first = (e: IcsEvent, k: string) => e[k]?.[0]

  // Occurrences edited on their own replace the series' copy of that slot.
  const overrides = new Map<string, IcsEvent>()
  for (const e of raw) {
    const rid = first(e, 'RECURRENCE-ID')
    const uid = first(e, 'UID')?.value
    if (rid && uid) overrides.set(`${uid}|${+icsInstant(rid).at}`, e)
  }

  const out: GoogleEvent[] = []
  const emit = (e: IcsEvent, at: Date, durationMs: number | null, allDay: boolean, idSuffix: string) => {
    if (at < timeMin || at > timeMax) return
    const status = first(e, 'STATUS')?.value
    out.push({
      id: `${first(e, 'UID')?.value ?? 'ics'}${idSuffix}`,
      status: status === 'CANCELLED' ? 'cancelled' : 'confirmed',
      summary: first(e, 'SUMMARY') ? unescapeIcs(first(e, 'SUMMARY')!.value) : undefined,
      description: first(e, 'DESCRIPTION') ? unescapeIcs(first(e, 'DESCRIPTION')!.value) : undefined,
      location: first(e, 'LOCATION') ? unescapeIcs(first(e, 'LOCATION')!.value) : undefined,
      start: allDay ? { date: at.toISOString() } : { dateTime: at.toISOString() },
      end: !allDay && durationMs !== null ? { dateTime: new Date(+at + durationMs).toISOString() } : undefined,
    })
  }

  for (const e of raw) {
    const dtstart = first(e, 'DTSTART')
    if (!dtstart || first(e, 'RECURRENCE-ID')) continue
    const start = icsInstant(dtstart)
    const dtend = first(e, 'DTEND')
    const durationMs = dtend ? +icsInstant(dtend).at - +start.at : null
    const rrule = first(e, 'RRULE')?.value

    if (!rrule) {
      emit(e, start.at, durationMs, start.allDay, '')
      continue
    }

    const excluded = new Set(
      (e.EXDATE ?? []).flatMap(p => p.value.split(',').map(v => +icsInstant({ params: p.params, value: v }).at)),
    )
    const uid = first(e, 'UID')?.value
    for (const at of expandRule(start, rrule, timeMax)) {
      if (excluded.has(+at)) continue
      const suffix = `-${at.toISOString().slice(0, 10)}`
      const override = uid ? overrides.get(`${uid}|${+at}`) : undefined
      if (override) {
        const os = icsInstant(first(override, 'DTSTART')!)
        const oe = first(override, 'DTEND')
        emit(override, os.at, oe ? +icsInstant(oe).at - +os.at : durationMs, os.allDay, suffix)
      } else {
        emit(e, at, durationMs, start.allDay, suffix)
      }
    }
  }
  return out
}

async function fetchApiEvents(calendarId: string, apiKey: string, timeMin: Date, timeMax: Date): Promise<GoogleEvent[] | null> {
  const url =
    `${API}/${encodeURIComponent(calendarId)}/events` +
    `?key=${encodeURIComponent(apiKey)}` +
    `&timeMin=${timeMin.toISOString()}` +
    `&timeMax=${timeMax.toISOString()}` +
    // Expands weekly series (LeetCode Club) into one entry per occurrence.
    `&singleEvents=true&orderBy=startTime&maxResults=250`

  const res = await fetch(url, { next: { revalidate: 900 } })
  if (!res.ok) {
    console.error(`Google Calendar API failed: ${res.status} ${await res.text()}`)
    return null
  }
  const data = (await res.json()) as { items?: GoogleEvent[] }
  return Array.isArray(data.items) ? data.items : null
}

/** Returns null when the calendar can't be read, so callers can fall back
 *  to their committed list rather than render nothing. */
export async function fetchGoogleCalendarEvents(): Promise<SCAEvent[] | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY

  const now = new Date()
  const timeMin = new Date(now)
  timeMin.setMonth(timeMin.getMonth() - MONTHS_BACK)
  const timeMax = new Date(now)
  timeMax.setMonth(timeMax.getMonth() + MONTHS_AHEAD)

  try {
    const items =
      (apiKey ? await fetchApiEvents(calendarId, apiKey, timeMin, timeMax).catch(() => null) : null) ??
      (await fetchIcsEvents(calendarId, timeMin, timeMax))
    if (!items) return null

    const events = items
      .map(toSCAEvent)
      .filter((e): e is SCAEvent => e !== null)
      .sort((a, b) => +a.date - +b.date)

    /* An empty calendar and a silently broken feed look identical downstream,
     * and the second one should not wipe the page. */
    return events.length > 0 ? events : null
  } catch (err) {
    console.error('Google Calendar fetch threw:', err)
    return null
  }
}
