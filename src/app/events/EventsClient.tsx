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
import { motion, useReducedMotion } from 'framer-motion'
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
      className={`rounded-2xl px-5 py-4 transition-colors duration-200 ${
        isPast ? 'opacity-60' : 'hover:border-[rgba(99,102,241,0.3)]'
      }`}
      style={{
        background: 'var(--card-gradient)',
        border: '1px solid rgba(var(--hairline-rgb),0.07)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Date block */}
        <div
          className={`hidden sm:flex w-[58px] h-[66px] rounded-xl flex-col items-center justify-center flex-shrink-0 ${
            isPast
              ? 'bg-[var(--color-bg)] border border-[var(--color-border)]'
              : 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25'
          }`}
        >
          <span
            className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
              isPast ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent)]/80'
            }`}
          >
            {formatLondon(event.date, 'MMM')}
          </span>
          <span
            className={`text-[28px] font-bold leading-none my-0.5 ${
              isPast ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent)]'
            }`}
            style={{ fontFamily: 'var(--font-geist-mono)' }}
          >
            {formatLondon(event.date, 'd')}
          </span>
          <span
            className={`text-[9px] font-medium uppercase tracking-wide ${
              isPast ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent)]/60'
            }`}
          >
            {formatLondon(event.date, 'EEE')}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-[16px] font-semibold text-[var(--color-text)] leading-snug mb-1.5"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {event.title}
          </h3>
          {event.description && (
            <p className="text-[12px] text-[var(--color-muted)] leading-relaxed mb-3">
              {event.description}
            </p>
          )}
          <div className="flex gap-3 flex-wrap items-center">
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
              <MapPin size={10} aria-hidden="true" />
              {event.location}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
              <Clock size={10} aria-hidden="true" />
              {formatLondon(event.date, 'h:mm a')}
              {event.endDate ? ` – ${formatLondon(event.endDate, 'h:mm a')}` : ''}
            </span>
            <span className="badge-gray text-[10px]">{eventTypeLabel(event.type)}</span>
            {event.poster && (
              <button
                onClick={() => onPoster(event.poster!)}
                className="text-[11px] text-[var(--color-accent)] hover:underline focus-ring rounded"
              >
                View poster
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {isPast ? (
            <span className="text-[11px] text-[var(--color-muted)]">
              {event.spots ? `${event.registrations} attended` : 'Completed'}
            </span>
          ) : !event.spots && !event.registrationUrl ? (
            <span className="px-3 py-1.5 border border-[var(--color-border)] rounded-full text-[11px] text-[var(--color-muted)] font-medium">
              Open to all
            </span>
          ) : (
            <>
              <RegisterButton
                eventId={event.id}
                disabled={full}
                registrationUrl={event.registrationUrl}
              />
              {sl && sl !== 'Full' && (
                <span className="text-[10px] text-[var(--color-muted)]">{sl}</span>
              )}
              {full && <span className="text-[10px] text-red-400">Full</span>}
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
  const reduceMotion = useReducedMotion()
  /* The grid's cells are UK calendar days, so its reference "today"
   * is the UK one. `now` stays a true instant for past/future tests. */
  const today = londonWallClock(now)
  const [month, setMonth] = useState(() => startOfMonth(today))
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
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors duration-200 focus-ring"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            aria-label="Next month"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors duration-200 focus-ring"
          >
            <ChevronRight size={16} />
          </button>
          <h2
            className="ml-2 text-[17px] font-semibold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
            aria-live="polite"
          >
            {format(month, 'MMMM yyyy')}
          </h2>
        </div>
        <button
          onClick={goToday}
          className="px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/40 transition-colors duration-200 focus-ring"
        >
          Today
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)] py-2"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <motion.div
        key={format(month, 'yyyy-MM')}
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        ref={gridRef}
        onKeyDown={onKeyDown}
        role="grid"
        aria-label={`Events in ${format(month, 'MMMM yyyy')}`}
        className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden"
        style={{ background: 'rgba(var(--hairline-rgb),0.07)' }}
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
              className={`relative min-h-[62px] sm:min-h-[92px] p-1.5 sm:p-2 text-left align-top transition-colors duration-200 focus-ring ${
                isSelected
                  ? 'bg-[var(--color-accent)]/10'
                  : 'bg-[var(--color-bg)] hover:bg-[var(--color-surface)]'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] tabular-nums ${
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
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight ${
                      e.date < now
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                        : 'bg-[var(--color-accent)]/15 text-[var(--color-text)] font-medium'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-1 h-1 rounded-full flex-shrink-0 ${
                        e.date < now ? 'bg-[var(--color-muted-2)]' : 'bg-[var(--color-accent)]'
                      }`}
                    />
                    <span className="truncate">{e.title}</span>
                  </span>
                ))}
                {dayEvents.length > MAX_CHIPS && (
                  <span className="block px-1.5 text-[10px] text-[var(--color-muted)]">
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
                      e.date < now ? 'bg-[var(--color-muted-2)]' : 'bg-[var(--color-accent)]'
                    }`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </motion.div>

      {/* Selected day */}
      <div className="mt-6">
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-3">
          {format(selected, 'EEEE d MMMM')}
        </h3>
        {selectedEvents.length === 0 ? (
          <div
            className="rounded-2xl px-5 py-8 text-center"
            style={{
              background: 'var(--card-gradient)',
              border: '1px solid rgba(var(--hairline-rgb),0.07)',
            }}
          >
            <p className="text-[13px] text-[var(--color-muted)]">
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
    <div className="max-w-[860px] mx-auto px-5 sm:px-8 py-10 sm:py-14" style={{ position: 'relative', zIndex: 1 }}>

      {/* Page header */}
      <div className="mb-10">
        <span className="eyebrow mb-3">BCU Computing Society</span>
        <h1
          className="text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-[var(--color-text)] mb-2"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Events
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-lg">
          Workshops, talks, networking and career events for BCU computing students.
        </p>
      </div>

      {/* View switch + tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-1 border border-[var(--color-border)] rounded-full p-1 w-fit bg-[var(--color-surface)]">
          {([
            ['calendar', 'Calendar', CalendarDays],
            ['list', 'List', List],
          ] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-200 focus-ring ${
                view === v
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <div className="flex gap-1 border border-[var(--color-border)] rounded-full p-1 w-fit bg-[var(--color-surface)]">
            {(['upcoming', 'past'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`px-5 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-200 capitalize focus-ring ${
                  tab === t
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
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
        <div className="border border-[rgba(var(--hairline-rgb),0.07)] rounded-2xl py-20 px-6 text-center" style={{ background: 'var(--card-gradient)' }}>
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center mx-auto mb-5">
            <Clock size={24} className="text-[var(--color-accent)]" aria-hidden="true" />
          </div>
          {tab === 'upcoming' ? (
            <>
              <div
                className="text-[16px] font-semibold text-[var(--color-text)] mb-2"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Events coming soon
              </div>
              <div className="text-[13px] text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed">
                BCUComputingSoc is busy planning workshops, talks, and networking events.
                <span className="block mt-2 text-[var(--color-text)] font-medium">
                  Stay tuned, announcements dropping soon.
                </span>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] rounded-full text-[11px] text-[var(--color-muted)] tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse inline-block" />
                To be announced by BCUComputingSoc
              </div>
            </>
          ) : (
            <>
              <div className="text-[16px] font-semibold text-[var(--color-text)] mb-2">
                No past events yet
              </div>
              <div className="text-[13px] text-[var(--color-muted)] max-w-xs mx-auto">
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
            className="absolute left-[23px] top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, var(--color-accent), transparent)' }}
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
                          : 'border-[var(--color-accent)] bg-[var(--color-accent)]'
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setPosterSrc(null)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPosterSrc(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-ring"
              aria-label="Close poster"
            >
              <X size={14} />
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
