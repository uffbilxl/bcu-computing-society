import type { Metadata } from 'next'
import Link from 'next/link'
import { Globe, Mail, ArrowRight, ArrowUpRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Committee - BCUComputingSoc',
  description: 'The students who run the BCU Computing Society.',
}

/* ── People ────────────────────────────────────────────────────
   Each person once, with every role they hold. The sections below
   pick people out by id, so someone in two places has one record.
   ──────────────────────────────────────────────────────────── */
interface Person {
  name: string
  roles: string[]
  linkedin?: string
  website?: string
  email?: string
}

const PEOPLE = {
  'bilal-arshad': {
    name: 'Bilal Arshad',
    roles: ['President'],
    linkedin: 'https://www.linkedin.com/in/bilal-arshad-4a07812b4/',
    website: 'https://bilalarshad.co.uk',
    email: 'bilal.arshad2@mail.bcu.ac.uk',
  },
  'tayyeb-nadeem-somro': {
    name: 'Tayyeb Nadeem Somro',
    roles: ['Chairman'],
    linkedin: 'https://www.linkedin.com/in/tayyeb-nadeem-somro/',
    website: 'http://tayyebns.com',
  },
  'michael-martinak': {
    name: 'Michael Martinak',
    roles: ['Head of Research', 'Technical Coordinator'],
    linkedin: 'https://www.linkedin.com/in/profile-mmartinak/',
  },
  'maryam-ahmad': {
    name: 'Maryam Ahmad',
    roles: ['Community Engagement'],
    linkedin: 'https://www.linkedin.com/in/maryam-a-259297235',
  },
  'haarisah-hussain': {
    name: 'Haarisah Hussain',
    roles: ['Vice President', 'Head of Software Engineering'],
    linkedin: 'https://www.linkedin.com/in/haarisah-hussain-2ba850315',
  },
  'saifuddin-muhammad': {
    name: 'Saifuddin Muhammad',
    roles: ['Technical Coordinator'],
    linkedin: 'https://www.linkedin.com/in/saifty/',
  },
  'baber-khan': {
    name: 'Baber Khan',
    roles: ['Developer'],
    linkedin: 'https://www.linkedin.com/in/baberr/',
    website: 'https://baberr.com',
  },
  'ivan-khan': {
    name: 'Ivan Khan',
    roles: ['Head of Cyber Security'],
    linkedin: 'https://www.linkedin.com/in/ivan-k-036007387/',
    website: 'https://ivancyber.uk',
  },
  'daeron-wallace': {
    name: 'Daeron Wallace',
    roles: ['Coordinator'],
    linkedin: 'https://www.linkedin.com/in/daeron-wallace/',
  },
  'arsalan-abid': {
    name: 'Arsalan Abid',
    roles: ['Coordinator'],
    linkedin: 'https://www.linkedin.com/in/arsalan-fareed-abid-a9275a250/',
    website: 'https://www.arsalanfareedabid.com',
  },
  'muhammad-hamza-rafeh': {
    name: 'Muhammad Hamza Rafeh',
    roles: ['Coordinator'],
    linkedin: 'https://www.linkedin.com/in/muhammad-hamza-rafeh-7b377132b/',
    website: 'https://muhammadhamzarafeh.com',
  },
  'mukul-sharma': {
    name: 'Mukul Sharma',
    roles: ['Head of AI'],
    linkedin: 'https://www.linkedin.com/in/mukuls27/',
  },
  'mohamed-dahir': {
    name: 'Mohamed Dahir',
    roles: ['Sports Analytics Lead'],
    linkedin: 'https://www.linkedin.com/in/m-a-dahir/',
  },
  'ayaan-ahmed': {
    name: 'Ayaan Ahmed',
    roles: ['Technical Coordinator'],
    linkedin: 'https://www.linkedin.com/in/ayaan-ahmed-477289330/',
  },
  'wiktoria-kalwaj': {
    name: 'Wiktoria Kalwaj',
    roles: ['Graphic Designer'],
  },
  'charanpreet-kaur': {
    name: 'Charanpreet Kaur',
    roles: [],
    linkedin: 'https://www.linkedin.com/in/charanpreet--kaur/',
  },
  'george-james': {
    name: 'George James',
    roles: [],
    linkedin: 'https://www.linkedin.com/in/georgeojames/',
  },
} satisfies Record<string, Person>

type PersonId = keyof typeof PEOPLE

/* In rank order: the President spans the row, the rest sit beneath. */
const LEADERSHIP: PersonId[] = ['bilal-arshad', 'haarisah-hussain', 'tayyeb-nadeem-somro']

const COMMITTEE: PersonId[] = [
  'michael-martinak',
  'maryam-ahmad',
  'saifuddin-muhammad',
  'baber-khan',
  'ivan-khan',
  'daeron-wallace',
  'arsalan-abid',
  'muhammad-hamza-rafeh',
  'mukul-sharma',
  'mohamed-dahir',
  'ayaan-ahmed',
  'wiktoria-kalwaj',
]

/* Research has its own titles: Bilal is a researcher here, not President. */
const RESEARCH: { id: PersonId; title: string }[] = [
  { id: 'michael-martinak', title: 'Head of Research' },
  { id: 'bilal-arshad',     title: 'Researcher' },
  { id: 'baber-khan',       title: 'Researcher' },
  { id: 'charanpreet-kaur', title: 'Researcher' },
  { id: 'george-james',     title: 'Researcher' },
]

const APPLY_URL = 'https://tally.so/r/681g7e'

/* ── Pieces ────────────────────────────────────────────────── */
function initials(name: string) {
  const parts = name.split(' ')
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center rounded-full font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        color: 'var(--color-accent-text)',
        background: 'var(--color-accent-dim)',
        border: '1px solid rgba(59,130,246,0.3)',
      }}
    >
      {initials(name)}
    </div>
  )
}

function LinkedInMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const iconLink =
  'w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors focus-ring'

function SocialLinks({ person }: { person: Person }) {
  if (!person.linkedin && !person.website && !person.email) return null
  return (
    <div className="flex items-center gap-1.5">
      {person.linkedin && (
        <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label={`${person.name} on LinkedIn`}>
          <LinkedInMark size={13} />
        </a>
      )}
      {person.website && (
        <a href={person.website} target="_blank" rel="noopener noreferrer" className={iconLink} aria-label={`${person.name}'s website`}>
          <Globe size={14} aria-hidden="true" />
        </a>
      )}
      {person.email && (
        <a href={`mailto:${person.email}`} className={iconLink} aria-label={`Email ${person.name}`} title={person.email}>
          <Mail size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

function SectionHeading({ id, title, aside }: { id: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-5">
      <h2 id={id} className="text-[22px] sm:text-[24px] font-bold tracking-[-0.02em] text-[var(--color-text)]">{title}</h2>
      {aside}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function CommitteePage() {
  const memberCount = new Set([...LEADERSHIP, ...COMMITTEE]).size

  return (
    <div className="max-w-[1080px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      <header className="enter mb-12">
        <h1 className="page-title mb-3">Meet the committee</h1>
        <p className="page-lede">
          The {memberCount} students who run BCUComputingSoc. Say hello at an event, or reach out on LinkedIn.
        </p>
      </header>

      {/* ── Leadership ─────────────────────────────────────── */}
      <section aria-labelledby="leadership" className="mb-14">
        <h2 id="leadership" className="sr-only">Leadership</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEADERSHIP.map((id, i) => {
            const p: Person = PEOPLE[id]
            const top = i === 0
            return (
              <article
                key={id}
                className={`enter relative overflow-hidden rounded-2xl border flex items-center gap-5 ${top ? 'md:col-span-2 p-6 sm:p-8' : 'p-6 sm:p-7'}`}
                style={{
                  '--i': i + 1,
                  background: 'var(--card-gradient)',
                  borderColor: 'rgba(59,130,246,0.3)',
                } as React.CSSProperties}
              >
                <div
                  aria-hidden="true"
                  className="absolute pointer-events-none -top-32 -right-24 w-72 h-72"
                  style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 68%)' }}
                />
                <div className="relative">
                  <Avatar name={p.name} size={top ? 80 : 64} />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[var(--color-accent-text)]">{p.roles.join(' · ')}</p>
                  <h3 className={`mt-0.5 ${top ? 'text-[24px] sm:text-[30px]' : 'text-[22px] sm:text-[24px]'} font-bold tracking-[-0.02em] leading-tight text-[var(--color-text)]`}>
                    {p.name}
                  </h3>
                  <div className="mt-3">
                    <SocialLinks person={p} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Committee ──────────────────────────────────────── */}
      <section aria-labelledby="committee" className="mb-14">
        <SectionHeading id="committee" title="Committee" />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMMITTEE.map((id, i) => {
            const p: Person = PEOPLE[id]
            return (
              <li
                key={id}
                className="reveal card p-4 flex items-center gap-3.5"
                style={{ '--i': i % 3 } as React.CSSProperties}
              >
                <Avatar name={p.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-tight text-[var(--color-text)] truncate">{p.name}</p>
                  <p className="text-[13px] leading-snug text-[var(--color-muted)] mt-1">
                    {p.roles.join(' · ')}
                  </p>
                </div>
                <SocialLinks person={p} />
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Research ───────────────────────────────────────── */}
      <section aria-labelledby="research">
        <SectionHeading
          id="research"
          title="Research"
          aside={
            <Link
              href="/research"
              className="group inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-accent-text)] hover:underline rounded focus-ring"
            >
              See our research
              <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <ul className="card divide-y divide-[var(--color-border-subtle)]">
          {RESEARCH.map(({ id, title }, i) => {
            const p: Person = PEOPLE[id]
            return (
              <li key={id} className="reveal flex items-center gap-3.5 px-4 py-3" style={{ '--i': i } as React.CSSProperties}>
                <Avatar name={p.name} size={36} />
                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                  <p className="text-[15px] font-semibold text-[var(--color-text)] truncate">{p.name}</p>
                  <p className="text-[13px] text-[var(--color-muted)]">{title}</p>
                </div>
                <SocialLinks person={p} />
              </li>
            )
          })}
        </ul>
      </section>

      <p className="mt-14 text-center text-[14px] text-[var(--color-muted)]">
        Interested in joining the committee?{' '}
        <a
          href={APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-[var(--color-accent-text)] hover:underline rounded focus-ring"
        >
          Apply here
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
