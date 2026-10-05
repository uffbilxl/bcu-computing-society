'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, List, MapPin, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { eventTypeLabel, spotsLeft } from '@/lib/utils'
import { RegisterButton } from '@/components/events/RegisterButton'
import { formatLondon, londonWallClock } from '@/lib/time'
import type { SCAEvent } from '@/types'


/* ── Shared event card ────────────────────────────────────────
   One definition used by both views, so the timeline and the
   calendar's day panel can never drift apart.
   ──────────────────────────────────────────────────────────── */
function EventCard({
  event,
  isPast,
  onPoster,
}: {
  event: SCAEvent
  isPast: boolean
  onPoster: (src: string) => void
}) {
  const sl = spotsLeft(event.spots, event.registrations)
  const full = sl === 'Full'

  return (
    <div
      className={`card px-5 py-5 transition-colors duration-200 ${
        isPast ? 'opacity-70' : 'hover:border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Date block */}
        <div
          className={`hidden sm:flex w-[60px] h-[68px] rounded-xl flex-col items-center justify-center flex-shrink-0 border ${
            isPast
              ? 'bg-[var(--color-surface-2)] border-[var(--color-border-subtle)]'
              : 'bg-[var(--color-accent-dim)] border-[var(--color-accent-border)]'
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider leading-none ${
              isPast ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent-text)]'
            }`}
          >
            {formatLondon(event.date, 'MMM')}
          </span>
          <span
            className={`text-[26px] font-bold leading-none my-1 tabular-nums ${
              isPast ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'
            }`}
          >
            {formatLondon(event.date, 'd')}
          </span>
          <span
            className={`text-[11px] font-medium ${
              isPast ? 'text-[var(--color-muted)]' : 'text-[var(--color-muted)]'
            }`}
          >
            {formatLondon(event.date, 'EEE')}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Small screens lose the date block, so the date leads the meta */}
          <p className="sm:hidden text-[13px] font-semibold text-[var(--color-accent-text)] mb-1">
            {formatLondon(event.date, 'EEE d MMM')}
          </p>
          <h3 className="text-[17px] font-semibold text-[var(--color-text)] leading-snug mb-1.5">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-[14px] text-[var(--color-muted)] leading-relaxed mb-3 max-w-[65ch]">
              {event.description}
            </p>
          )}
          <div className="flex gap-x-4 gap-y-2 flex-wrap items-center">
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)]">
              <MapPin size={13} aria-hidden="true" />
              {event.location}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)]">
              <Clock size={13} aria-hidden="true" />
              {formatLondon(event.date, 'h:mm a')}
              {event.endDate ? ` – ${formatLondon(event.endDate, 'h:mm a')}` : ''}
            </span>
            <span className="badge-gray">{eventTypeLabel(event.type)}</span>
            {event.poster && (
              <button
                onClick={() => onPoster(event.poster!)}
                className="text-[13px] font-medium text-[var(--color-accent-text)] hover:underline underline-offset-2 focus-ring rounded"
              >
                View poster
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {isPast ? (
            <span className="text-[13px] text-[var(--color-muted)]">
              {event.spots ? `${event.registrations} attended` : 'Completed'}
            </span>
          ) : !event.spots && !event.registrationUrl ? (
            <span className="badge-green">Open to all</span>
          ) : (
            <>
              <RegisterButton
                eventId={event.id}
                disabled={full}
                registrationUrl={event.registrationUrl}
              />
              {sl && sl !== 'Full' && (
                <span className="text-[12px] text-[var(--color-muted)]">{sl}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Month calendar ───────────────────────────────────────────
   A 6x7 grid so the height never jumps between months. Desktop
   cells carry titled chips; below 640px they fall back to dots
   and the selected-day panel does the talking, which is the only
   honest way to fit seven columns into 390px.
   ──────────────────────────────────────────────────────────── */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS = 2

function CalendarView({
  events,
  now,
  onPoster,
}: {
  events: SCAEvent[]
  now: Date
  onPoster: (src: string) => void
}) {
  /* The grid's cells are UK calendar days, so its reference "today"
   * is the UK one. `now` stays a true instant for past/future tests. */
  const today = londonWallClock(now)
  const [month, setMonthState] = useState(() => startOfMonth(today))
  /* Which way the grid slides: forwards in time enters from the right. */
  const [dir, setDir] = useState(0)
  const setMonth = (next: Date | ((m: Date) => Date)) => {
    const value = typeof next === 'function' ? next(month) : next
    setDir(Math.sign(+value - +month))
    setMonthState(value)
  }
  const [selected, setSelected] = useState<Date>(() => today)
  /* The "today" ring is the one thing that depends on the real clock
   * rather than the data, so it waits for mount instead of being
   * prerendered against build time. */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const gridRef = useRef<HTMLDivElement>(null)
  const focusDayRef = useRef<string | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    const list = eachDayOfInterval({ start, end })
    // Pad to a stable 42 cells so switching months never reflows the page.
    while (list.length < 42) list.push(addDays(list[list.length - 1], 1))
    return list
  }, [month])

  const byDay = useMemo(() => {
    const map = new Map<string, SCAEvent[]>()
    for (const e of events) {
      const key = formatLondon(e.date, 'yyyy-MM-dd')
      const bucket = map.get(key)
      if (bucket) bucket.push(e)
      else map.set(key, [e])
    }
    map.forEach(bucket => bucket.sort((a, b) => +a.date - +b.date))
    return map
  }, [events])

  const eventsOn = useCallback(
    (day: Date) => byDay.get(format(day, 'yyyy-MM-dd')) ?? [],
    [byDay],
  )

  const selectedEvents = eventsOn(selected)

  /* Focus follows keyboard selection across a month change, so arrowing
   * off the edge of a month lands on the right cell in the next one. */
  useEffect(() => {
    if (!focusDayRef.current) return
    const el = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${focusDayRef.current}"]`,
    )
    el?.focus()
    focusDayRef.current = null
  })

  function move(days: number) {
    const next = addDays(selected, days)
    setSelected(next)
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next))
    focusDayRef.current = format(next, 'yyyy-MM-dd')
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step =
      e.key === 'ArrowLeft' ? -1
      : e.key === 'ArrowRight' ? 1
      : e.key === 'ArrowUp' ? -7
      : e.key === 'ArrowDown' ? 7
      : 0
    if (!step) return
    e.preventDefault()
    move(step)
  }

  function goToday() {
    setSelected(today)
    setMonth(startOfMonth(today))
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth(m => subMonths(m, 1))}
            aria-label="Previous month"
            className="w-9 h-9 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors duration-150 focus-ring"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            aria-label="Next month"
            className="w-9 h-9 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors duration-150 focus-ring"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <h2
            className="ml-3 text-[20px] font-semibold tracking-[-0.01em] text-[var(--color-text)]"
            aria-live="polite"
          >
            {format(month, 'MMMM yyyy')}
          </h2>
        </div>
        <button
          onClick={goToday}
          className="btn-sm btn-ghost focus-ring"
        >
          Today
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className="text-center text-[12px] font-medium text-[var(--color-muted)] py-2"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      {/* initial={false} on the presence: the first render is never
          animated, so server and client agree; later month changes slide
          in the direction of travel. */}
      <div className="relative overflow-hidden rounded-2xl">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
      <motion.div
        key={format(month, 'yyyy-MM')}
        custom={dir}
        variants={{
          enter: (d: number) => ({ opacity: 0, x: d * 40 }),
          center: { opacity: 1, x: 0 },
          exit: (d: number) => ({ opacity: 0, x: d * -40 }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        ref={gridRef}
        onKeyDown={onKeyDown}
        role="grid"
        aria-label={`Events in ${format(month, 'MMMM yyyy')}`}
        className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-[var(--color-border-subtle)]"
        style={{ background: 'var(--color-border-subtle)' }}
      >
        {days.map(day => {
          const dayEvents = eventsOn(day)
          const outside = !isSameMonth(day, month)
          const isSelected = isSameDay(day, selected)
          const isNow = mounted && isSameDay(day, today)
          const key = format(day, 'yyyy-MM-dd')

          return (
            <button
              key={key}
              data-day={key}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={`${format(day, 'EEEE d MMMM yyyy')}, ${
                dayEvents.length === 0
                  ? 'no events'
                  : `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}`
              }`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                setSelected(day)
                if (outside) setMonth(startOfMonth(day))
              }}
              className={`relative min-h-[62px] sm:min-h-[100px] p-1.5 sm:p-2 text-left align-top transition-colors duration-150 focus-ring ${
                isSelected
                  ? 'bg-[var(--color-accent-dim)] shadow-[inset_0_0_0_2px_var(--color-accent)]'
                  : outside
                    ? 'bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)]'
                    : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[13px] tabular-nums ${
                  isNow
                    ? 'bg-[var(--color-accent)] text-white font-bold'
                    : outside
                      ? 'text-[var(--color-muted-2)]'
                      : 'text-[var(--color-text)] font-medium'
                }`}
              >
                {format(day, 'd')}
              </span>

              {/* Desktop: titled chips */}
              <div className="hidden sm:block mt-1 space-y-1">
                {/* Accent rides on the dot, not the label: indigo text on the
                    tinted chip only reaches 3.9:1, short of the 4.5:1 this
                    project holds itself to. The dot carries "upcoming" so the
                    state is not signalled by colour alone either. */}
                {dayEvents.slice(0, MAX_CHIPS).map(e => (
                  <span
                    key={e.id}
                    title={`${e.title} · ${formatLondon(e.date, 'h:mm a')}`}
                    className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] leading-tight ${
                      e.date < now
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                        : 'bg-[var(--color-accent-dim)] text-[var(--color-text)] font-medium'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        e.date < now ? 'bg-[var(--color-muted-2)]' : 'bg-[var(--brand-blue)]'
                      }`}
                    />
                    <span className="truncate">{e.title}</span>
                  </span>
                ))}
                {dayEvents.length > MAX_CHIPS && (
                  <span className="block px-1.5 text-[12px] text-[var(--color-muted)]">
                    +{dayEvents.length - MAX_CHIPS} more
                  </span>
                )}
              </div>

              {/* Mobile: dots */}
              <div className="sm:hidden flex gap-0.5 mt-1 flex-wrap">
                {dayEvents.slice(0, 3).map(e => (
                  <span
                    key={e.id}
                    className={`w-1.5 h-1.5 rounded-full ${
                      e.date < now ? 'bg-[var(--color-muted-2)]' : 'bg-[var(--brand-blue)]'
                    }`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </motion.div>
      </AnimatePresence>
      </div>

      {/* Selected day */}
      <div className="mt-6">
        <h3 className="text-[15px] font-semibold text-[var(--color-text)] mb-3">
          {format(selected, 'EEEE d MMMM')}
        </h3>
        {selectedEvents.length === 0 ? (
          <div className="card px-5 py-8 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">
              Nothing scheduled. Pick another day, or browse everything in list view.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedEvents.map(e => (
              <EventCard
                key={e.id}
                event={e}
                isPast={e.date < now}
                onPoster={onPoster}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EventsClient({ events }: { events: SCAEvent[] }) {
  const now = new Date()
  const upcoming = events.filter(e => e.date >= now).sort((a, b) => +a.date - +b.date)
  const past     = events.filter(e => e.date <  now).sort((a, b) => +b.date - +a.date)

  const [view, setView]           = useState<'list' | 'calendar'>('calendar')
  const [tab, setTab]             = useState<'upcoming' | 'past'>('upcoming')
  const [posterSrc, setPosterSrc] = useState<string | null>(null)

  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="max-w-[960px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">

      <header className="mb-8">
        <h1 className="page-title">Events</h1>
        <p className="page-lede mt-3">
          Workshops, talks, networking and career events for BCU computing students.
          {upcoming.length > 0 && (
            <> Next up: <span className="text-[var(--color-text)] font-medium">{upcoming[0].title}</span>, {formatLondon(upcoming[0].date, 'EEEE d MMMM')}.</>
          )}
        </p>
      </header>

      {/* View switch + tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-1 border border-[var(--color-border)] rounded-xl p-1 w-fit bg-[var(--color-surface)]">
          {([
            ['calendar', 'Calendar', CalendarDays],
            ['list', 'List', List],
          ] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[14px] font-medium transition-colors duration-150 focus-ring ${
                view === v
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <div className="flex gap-1 border border-[var(--color-border)] rounded-xl p-1 w-fit bg-[var(--color-surface)]">
            {(['upcoming', 'past'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`h-8 px-3.5 rounded-lg text-[14px] font-medium transition-colors duration-150 capitalize focus-ring ${
                  tab === t
                    ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t === 'upcoming'
                  ? `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}`
                  : 'Past'}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'calendar' ? (
        <CalendarView events={events} now={now} onPoster={setPosterSrc} />
      ) : list.length === 0 ? (
        <div className="card py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-dim)] flex items-center justify-center mx-auto mb-5">
            <Clock size={22} className="text-[var(--color-accent-text)]" aria-hidden="true" />
          </div>
          {tab === 'upcoming' ? (
            <>
              <div className="text-[16px] font-semibold text-[var(--color-text)] mb-2">
                Events coming soon
              </div>
              <div className="text-[14px] text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed">
                BCUComputingSoc is busy planning workshops, talks, and networking events.
                <span className="block mt-2 text-[var(--color-text)] font-medium">
                  Stay tuned, announcements dropping soon.
                </span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 px-3 h-8 border border-[var(--color-border)] rounded-full text-[13px] text-[var(--color-muted)]">
                <span className="live-dot" aria-hidden="true" />
                To be announced by BCUComputingSoc
              </div>
            </>
          ) : (
            <>
              <div className="text-[16px] font-semibold text-[var(--color-text)] mb-2">
                No past events yet
              </div>
              <div className="text-[14px] text-[var(--color-muted)] max-w-xs mx-auto">
                Previous events will appear here once they have taken place.
              </div>
            </>
          )}
        </div>
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical indigo line */}
          <div
            className="absolute left-[23px] top-3 bottom-3 w-px bg-[var(--color-border)]"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-6">
            {list.map(event => {
              const isPast = event.date < now

              return (
                <div key={event.id} className="flex gap-5 relative">
                  {/* Timeline node */}
                  <div
                    className="flex-shrink-0 w-12 flex flex-col items-center pt-1"
                    aria-hidden="true"
                  >
                    <div
                      className={`w-3 h-3 rounded-full border-2 mt-1.5 ${
                        isPast
                          ? 'border-[var(--color-border)] bg-[var(--color-bg)]'
                          : 'border-[var(--brand-blue)] bg-[var(--brand-blue)]'
                      }`}
                    />
                  </div>

                  <div className="flex-1 mb-1">
                    <EventCard event={event} isPast={isPast} onPoster={setPosterSrc} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Poster modal */}
      {posterSrc && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/75 p-4"
          style={{ zIndex: 'var(--z-modal)' as unknown as number }}
          role="dialog"
          aria-modal="true"
          aria-label="Event poster"
          onClick={() => setPosterSrc(null)}
          onKeyDown={e => { if (e.key === 'Escape') setPosterSrc(null) }}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPosterSrc(null)}
              autoFocus
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-ring"
              aria-label="Close poster"
            >
              <X size={16} aria-hidden="true" />
            </button>
            <Image
              src={posterSrc}
              alt="Event poster"
              width={480}
              height={600}
              className="rounded-2xl w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
