import { londonTime } from '@/lib/time'
import type { SCAEvent } from '@/types'

/* Weekly sessions, generated rather than listed so the dates can't drift
 * from the pattern. Mirrors the series in the Google Calendar: LeetCode
 * Club on Wednesdays and the SWE project session on Thursdays, both running
 * until the Christmas break (second week of December). */
function weekly(
  slug: string,
  title: string,
  firstDay: string,
  startTime: string,
  endTime: string,
  lastDay: string,
): SCAEvent[] {
  const out: SCAEvent[] = []
  for (let d = new Date(firstDay + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= lastDay; d.setUTCDate(d.getUTCDate() + 7)) {
    const day = d.toISOString().slice(0, 10)
    out.push({
      id: `${slug}-${day}`,
      title,
      description: null,
      location: 'STEAMhouse',
      isOnline: false,
      date: londonTime(`${day}T${startTime}:00`),
      endDate: londonTime(`${day}T${endTime}:00`),
      spots: null,
      registrations: 0,
      registrationUrl: null,
      type: 'WORKSHOP',
      poster: null,
    })
  }
  return out
}

/* The Google Calendar is the source of truth: the events page reads it
 * directly (src/lib/googleCalendar.ts) and re-checks every 15 minutes, so
 * adding, moving or deleting an event there is all it takes.
 *
 * This list is only shown if Google can't be reached. It mirrors the
 * calendar as of 5 Oct 2026 and nothing else, so an outage never brings
 * back events that were cancelled. */
export const FALLBACK_EVENTS: SCAEvent[] = [
  {
    id: 'placements-interns-panel-cs-2026-09-23',
    title: 'Placements and Interns Panel (CS)',
    description: null,
    location: 'STEAMhouse',
    isOnline: false,
    date: londonTime('2026-09-23T17:30:00'),
    endDate: londonTime('2026-09-23T19:00:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'PANEL',
    poster: null,
  },
  {
    id: 'scratch-hackathon-2026-09-30',
    title: 'Scratch Hackathon',
    description: null,
    location: 'STEAMhouse',
    isOnline: false,
    date: londonTime('2026-09-30T15:00:00'),
    endDate: londonTime('2026-09-30T17:30:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'HACKATHON',
    poster: null,
  },
  {
    id: 'tech-consulting-sprint-2026-10-01',
    title: 'Tech Consulting Sprint (DT)',
    description: null,
    location: 'STEAMhouse',
    isOnline: false,
    date: londonTime('2026-10-01T16:00:00'),
    endDate: londonTime('2026-10-01T18:00:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'WORKSHOP',
    poster: null,
  },
  {
    id: 'cyber-x-ai-2026-10-02',
    title: 'Cyber x AI - Event',
    description: 'Cyber x AI Event\n\n8 Challenges for each division',
    location: 'STEAMhouse',
    isOnline: false,
    date: londonTime('2026-10-02T17:00:00'),
    endDate: londonTime('2026-10-02T19:00:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'OTHER',
    poster: null,
  },
  {
    id: 'linkedin-masterclass-2026-10-05',
    title: 'LinkedIn Masterclass',
    description: null,
    location: 'STEAMhouse',
    isOnline: false,
    date: londonTime('2026-10-05T17:30:00'),
    endDate: londonTime('2026-10-05T19:00:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'WORKSHOP',
    poster: null,
  },
  {
    id: 'interview-workshop-2026-10-26',
    title: 'Interview Workshop',
    description: null,
    location: 'STEAMhouse',
    isOnline: false,
    date: londonTime('2026-10-26T17:30:00'),
    endDate: londonTime('2026-10-26T19:00:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'WORKSHOP',
    poster: null,
  },
  {
    id: 'compsoc-lawsoc-debate-2026-11-09',
    title: 'CompSoc x LawSoc Debate',
    description: 'Court room',
    location: 'Curzon Building',
    isOnline: false,
    date: londonTime('2026-11-09T17:00:00'),
    endDate: londonTime('2026-11-09T19:30:00'),
    spots: null,
    registrations: 0,
    registrationUrl: null,
    type: 'OTHER',
    poster: null,
  },
  ...weekly('leetcode-club-session', 'LeetCode Club Session (SWE)', '2026-09-23', '13:00', '14:00', '2026-12-09'),
  ...weekly('project-session-swe', 'Project Session (SWE)', '2026-09-24', '13:30', '15:00', '2026-12-10'),
]
