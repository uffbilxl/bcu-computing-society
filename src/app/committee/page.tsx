'use client'
import { forwardRef, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Globe, Mail, ArrowUpRight } from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────── */
type GroupId =
  | 'leadership' | 'software' | 'cyber' | 'ai'
  | 'compsci' | 'marketing' | 'platforms' | 'research'

interface Group {
  id: GroupId
  label: string
  short?: string
  color: string
  kind: 'core' | 'department' | 'team'
}

interface Role {
  group: GroupId
  title: string
  lead?: boolean
}

interface Person {
  id: string
  name: string
  roles: Role[]
  linkedin?: string
  website?: string
  email?: string
  vacant?: boolean
}

/* ── Groups ────────────────────────────────────────────────────
   Colour is an identifier here, never body text: it rides on dots,
   avatar rings and glows so contrast stays token-driven in both themes.
   ──────────────────────────────────────────────────────────── */
const GROUPS: Group[] = [
  { id: 'leadership', label: 'Leadership',              color: '#6366f1', kind: 'core' },
  { id: 'software',   label: 'Software Engineering',    short: 'Software',  color: '#22c55e', kind: 'department' },
  { id: 'cyber',      label: 'Cyber Security',          short: 'Cyber',     color: '#ef4444', kind: 'department' },
  { id: 'ai',         label: 'Artificial Intelligence', short: 'AI',        color: '#a855f7', kind: 'department' },
  { id: 'compsci',    label: 'Computer Science',        short: 'Comp Sci',  color: '#f59e0b', kind: 'department' },
  { id: 'marketing',  label: 'Marketing',                                   color: '#ec4899', kind: 'team' },
  { id: 'platforms',  label: 'Technical Platforms',     short: 'Platforms', color: '#f97316', kind: 'team' },
  { id: 'research',   label: 'Research & Development',  short: 'R&D',       color: '#8b5cf6', kind: 'team' },
]

const GROUP_BY_ID = Object.fromEntries(GROUPS.map(g => [g.id, g])) as Record<GroupId, Group>

/* ── Featured leadership ──────────────────────────────────── */
const LEADS: Person[] = [
  {
    id: 'bilal-arshad',
    name: 'Bilal Arshad',
    linkedin: 'https://www.linkedin.com/in/bilal-arshad-4a07812b4/',
    website: 'https://bilalarshad.co.uk',
    email: 'bilal.arshad2@mail.bcu.ac.uk',
    roles: [
      { group: 'leadership', title: 'President', lead: true },
      { group: 'platforms',  title: 'Web & App Dev' },
      { group: 'research',   title: 'Researcher' },
    ],
  },
  {
    id: 'tayyeb-nadeem-somro',
    name: 'Tayyeb Nadeem Somro',
    linkedin: 'https://www.linkedin.com/in/tayyeb-nadeem-somro/',
    website: 'http://tayyebns.com',
    roles: [
      { group: 'leadership', title: 'Chairman and Founder', lead: true },
      { group: 'platforms',  title: 'Web & App Dev' },
    ],
  },
  {
    id: 'haarisah-hussain',
    name: 'Haarisah Hussain',
    linkedin: 'https://www.linkedin.com/in/haarisah-hussain-2ba850315',
    roles: [
      { group: 'leadership', title: 'Vice President', lead: true },
      { group: 'software',   title: 'Head of Software Engineering', lead: true },
    ],
  },
  {
    id: 'michael-martinak',
    name: 'Michael Martinak',
    linkedin: 'https://www.linkedin.com/in/profile-mmartinak/',
    roles: [
      { group: 'leadership', title: 'Head of Research', lead: true },
      { group: 'cyber',      title: 'Technical Coordinator' },
      { group: 'research',   title: 'Head of Research', lead: true },
    ],
  },
]

/* ── Everyone else, in structural order ────────────────────── */
const COMMITTEE: Person[] = [
  {
    id: 'maryam-ahmad', name: 'Maryam Ahmad',
    linkedin: 'https://www.linkedin.com/in/maryam-a-259297235',
    roles: [{ group: 'leadership', title: 'Community Engagement' }],
  },
  {
    id: 'mursal-hottak', name: 'Mursal Hottak',
    linkedin: 'https://www.linkedin.com/in/mursal-hottak-7b8b672a1/',
    roles: [{ group: 'leadership', title: 'Communication and Governance Lead' }],
  },

  {
    id: 'saifuddin-muhammad', name: 'Saifuddin Muhammad',
    linkedin: 'https://www.linkedin.com/in/saifty/',
    roles: [{ group: 'software', title: 'Technical Coordinator' }],
  },

  {
    id: 'ivan-khan', name: 'Ivan Khan',
    linkedin: 'https://www.linkedin.com/in/ivan-k-036007387/',
    roles: [
      { group: 'cyber', title: 'Head of Cyber Security', lead: true },
      { group: 'platforms', title: 'Web & App Dev' },
    ],
  },
  {
    id: 'daeron-wallace', name: 'Daeron Wallace',
    linkedin: 'https://www.linkedin.com/in/daeron-wallace/',
    roles: [{ group: 'cyber', title: 'Coordinator' }],
  },

  {
    id: 'mukul-sharma', name: 'Mukul Sharma',
    linkedin: 'https://www.linkedin.com/in/mukuls27/',
    roles: [{ group: 'ai', title: 'Head of AI', lead: true }],
  },
  {
    id: 'mohamed-dahir', name: 'Mohamed Dahir',
    linkedin: 'https://www.linkedin.com/in/m-a-dahir/',
    roles: [{ group: 'ai', title: 'Sports Analytics Lead' }],
  },
  {
    id: 'zakaria-miah', name: 'Zakaria Miah',
    linkedin: 'https://www.linkedin.com/in/zakaria-miah/',
    roles: [{ group: 'ai', title: 'Technical Coordinator' }],
  },
  {
    id: 'orlando-igwe', name: 'Orlando Igwe',
    linkedin: 'https://www.linkedin.com/in/orlando-igwe/',
    roles: [{ group: 'ai', title: 'Software Engineer' }],
  },
  {
    id: 'charanpreet-kaur', name: 'Charanpreet Kaur',
    linkedin: 'https://www.linkedin.com/in/charanpreet--kaur/',
    roles: [
      { group: 'research', title: 'Researcher' },
    ],
  },

  {
    id: 'alaa-aljasem', name: 'Alaa Aljasem',
    linkedin: 'https://www.linkedin.com/in/alaa-aljasem-b816b83aa/',
    roles: [{ group: 'compsci', title: 'Head of Computer Science', lead: true }],
  },
  {
    id: 'ayaan-ahmed', name: 'Ayaan Ahmed',
    linkedin: 'https://www.linkedin.com/in/ayaan-ahmed-477289330/',
    roles: [{ group: 'compsci', title: 'Technical Coordinator' }],
  },
  {
    id: 'jasleen-kaur', name: 'Jasleen Kaur',
    linkedin: 'https://www.linkedin.com/in/jasleen-kaur-269367387/',
    roles: [{ group: 'compsci', title: 'Events Coordinator' }],
  },
  {
    id: 'muhammad-hamza-rafeh', name: 'Muhammad Hamza Rafeh',
    linkedin: 'https://www.linkedin.com/in/muhammad-hamza-rafeh-7b377132b/',
    roles: [{ group: 'compsci', title: 'Event Coordinator' }],
  },

  {
    id: 'tadiwa-gasura', name: 'Tadiwa Gasura',
    linkedin: 'https://www.linkedin.com/in/tadiwavvs/',
    roles: [{ group: 'marketing', title: 'Social Media' }],
  },
  {
    id: 'abrar-alam', name: 'Abrar Alam',
    linkedin: 'https://www.linkedin.com/in/abrartalam/',
    roles: [{ group: 'marketing', title: 'Content Creator / Photographer' }],
  },


  {
    id: 'george-james', name: 'George James',
    linkedin: 'https://www.linkedin.com/in/georgeojames/',
    roles: [{ group: 'research', title: 'Researcher' }],
  },
  {
    id: 'baber-khan', name: 'Baber Khan',
    linkedin: 'https://www.linkedin.com/in/baberr/',
    website: 'https://baberr.com',
    roles: [
      { group: 'software', title: 'Developer' },
      { group: 'research', title: 'Researcher' },
    ],
  },
]

const APPLY_URL = 'https://tally.so/r/681g7e'

/* ── Helpers ───────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 3).toUpperCase()
}

function LinkedInMark({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

/* ── Social links ──────────────────────────────────────────── */
function SocialLinks({ person, size = 26 }: { person: Person; size?: number }) {
  const box = { width: size, height: size }
  return (
    <div className="flex items-center gap-1.5">
      {person.linkedin && (
        <Link
          href={person.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={box}
          className="flex items-center justify-center rounded-lg border transition-[background-color,border-color,transform] duration-200 ease-out
                     text-[#0A66C2] bg-[rgba(10,102,194,0.12)] border-[rgba(10,102,194,0.28)]
                     hover:bg-[rgba(10,102,194,0.24)] hover:border-[rgba(10,102,194,0.55)] hover:-translate-y-px
                     focus-ring"
          aria-label={`${person.name} on LinkedIn`}
        >
          <LinkedInMark size={size > 30 ? 14 : 12} />
        </Link>
      )}
      {person.website && (
        <Link
          href={person.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={box}
          className="flex items-center justify-center rounded-lg border transition-[background-color,border-color,color,transform] duration-200 ease-out
                     text-[var(--color-muted)] bg-[rgba(var(--hairline-rgb),0.05)] border-[rgba(var(--hairline-rgb),0.1)]
                     hover:text-[var(--color-text)] hover:bg-[rgba(var(--hairline-rgb),0.11)] hover:border-[rgba(var(--hairline-rgb),0.22)] hover:-translate-y-px
                     focus-ring"
          aria-label={`${person.name}'s personal website`}
        >
          <Globe size={size > 30 ? 14 : 12} />
        </Link>
      )}
      {person.email && (
        <a
          href={`mailto:${person.email}`}
          onClick={e => e.stopPropagation()}
          style={box}
          title={person.email}
          className="flex items-center justify-center rounded-lg border transition-[background-color,border-color,color,transform] duration-200 ease-out
                     text-[var(--color-accent)] bg-[var(--color-accent-dim)] border-[rgba(99,102,241,0.28)]
                     hover:bg-[rgba(99,102,241,0.24)] hover:border-[rgba(99,102,241,0.55)] hover:-translate-y-px
                     focus-ring"
          aria-label={`Email ${person.name}`}
        >
          <Mail size={size > 30 ? 14 : 12} />
        </a>
      )}
    </div>
  )
}

/* ── Member row ────────────────────────────────────────────────
   A row inside a department, not a card: the section owns the border,
   so nothing is nested inside anything else.
   ──────────────────────────────────────────────────────────── */
function MemberRow({
  person, role, group, index, stagger, reduced,
}: {
  person: Person
  role: Role
  group: Group
  index: number
  stagger: boolean
  reduced: boolean
}) {
  const vacant = person.vacant

  // Where else this person sits, so a second appearance never reads as a duplicate.
  const elsewhere = person.roles
    .filter(r => r.group !== group.id)
    .map(r => GROUP_BY_ID[r.group].short ?? GROUP_BY_ID[r.group].label)

  const inner = (
    <>
      <div
        className="flex items-center justify-center rounded-xl text-[11px] font-bold tracking-wide flex-shrink-0 transition-shadow duration-300"
        style={{
          width: 38,
          height: 38,
          color: 'var(--color-text)',
          background: vacant ? 'rgba(var(--hairline-rgb),0.04)' : `${group.color}${role.lead ? '2e' : '1a'}`,
          border: vacant
            ? '1px dashed rgba(var(--hairline-rgb),0.22)'
            : `1px solid ${group.color}${role.lead ? '80' : '3d'}`,
          boxShadow: role.lead && !vacant ? `0 0 18px ${group.color}33` : 'none',
        }}
      >
        {vacant
          ? <span className="text-[var(--color-muted)] text-[14px] font-normal leading-none">+</span>
          : initials(person.name)}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13.5px] font-semibold leading-tight truncate"
          style={{ color: vacant ? 'var(--color-muted)' : 'var(--color-text)' }}
        >
          {vacant ? 'Open role' : person.name}
        </p>
        <p className="text-[11.5px] leading-snug text-[var(--color-muted)] mt-0.5 truncate">
          {role.title}
          {elsewhere.length > 0 && (
            <span className="text-[var(--color-muted-2)]"> · also in {elsewhere.join(', ')}</span>
          )}
        </p>
      </div>

      {vacant ? (
        <span className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-medium text-[var(--color-accent)]">
          Apply
          <ArrowUpRight size={13} className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      ) : (
        <div className="flex-shrink-0">
          <SocialLinks person={person} />
        </div>
      )}
    </>
  )

  const motionProps = {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0.001 : 0.32,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: stagger ? Math.min(index, 10) * 0.03 : 0,
    },
    className:
      'group flex items-center gap-3.5 px-3 py-2.5 -mx-3 rounded-xl transition-colors duration-200 hover:bg-[rgba(var(--hairline-rgb),0.045)]',
  }

  if (vacant) {
    return (
      <motion.a
        {...motionProps}
        href={APPLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${motionProps.className} focus-ring`}
      >
        {inner}
      </motion.a>
    )
  }

  return <motion.div {...motionProps}>{inner}</motion.div>
}

/* ── Department section ────────────────────────────────────────
   One heading per area, its lead first, then everyone else.
   ──────────────────────────────────────────────────────────── */
const DepartmentSection = forwardRef<HTMLElement, {
  group: Group
  people: { person: Person; role: Role }[]
  stagger: boolean
  reduced: boolean
}>(function DepartmentSection({ group, people, stagger, reduced }, ref) {
  // Featured leads appear as cards at the top of the leadership section.
  const featured = group.id === 'leadership'
    ? people.filter(p => LEADS.some(l => l.id === p.person.id))
    : []
  const rows = people.filter(p => !featured.includes(p))

  return (
    <motion.section
      ref={ref as React.Ref<HTMLElement>}
      layout={reduced ? false : 'position'}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.16, ease: 'easeIn' } }}
      transition={{
        duration: reduced ? 0.001 : 0.34,
        ease: [0.16, 1, 0.3, 1],
        layout: reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 40 },
      }}
      aria-label={group.label}
    >
      {/* Heading */}
      <div className="flex items-baseline gap-2.5 mb-1">
        <span
          className="block rounded-full flex-shrink-0 translate-y-[-1px]"
          style={{ width: 7, height: 7, background: group.color, boxShadow: `0 0 8px ${group.color}` }}
          aria-hidden="true"
        />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-text)]">
          {group.label}
        </h2>
        <span className="ml-auto text-[11px] tabular-nums text-[var(--color-muted)]">
          {people.length} {people.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div
        className="h-px mb-2"
        style={{ background: `linear-gradient(90deg, ${group.color}59 0%, rgba(var(--hairline-rgb),0.07) 45%, transparent 100%)` }}
      />

      {/* The President takes the full width as the spotlight; the rest of
          the featured leadership sits in a row beneath. */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 mb-4">
          {featured.map(({ person }, i) => (
            <LeaderCard
              key={person.id}
              person={person}
              index={i}
              reduced={reduced}
              spotlight={i === 0}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col">
        {rows.map(({ person, role }, i) => (
          <MemberRow
            key={`${person.id}-${group.id}`}
            person={person}
            role={role}
            group={group}
            index={i}
            stagger={stagger}
            reduced={reduced}
          />
        ))}
      </div>
    </motion.section>
  )
})


/* ── Masthead card ─────────────────────────────────────────────
   The featured leadership at the top of the Leadership section. The first
   lead (the President) is drawn larger across the full width. Role chips
   still answer the active filter.
   ──────────────────────────────────────────────────────────── */
function LeaderCard({
  person, index, reduced, spotlight = false,
}: {
  person: Person
  index: number
  reduced: boolean
  spotlight?: boolean
}) {
  const [title, ...rest] = person.roles
  /* A seat carrying the same title as the badge (Head of Research sits in both
   * Leadership and R&D) would render the card's own title back at it as a chip. */
  const otherRoles = rest.filter(r => r.title !== title.title)

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduced ? 0.001 : 0.55,
        ease: [0.16, 1, 0.3, 1],
        delay: reduced ? 0 : 0.07 + index * 0.08,
      }}
      className={`relative overflow-hidden rounded-2xl border flex flex-col justify-center ${
        spotlight ? 'md:col-span-3 p-6 sm:p-8' : 'p-5 sm:p-6'
      }`}
      style={{
        background: 'var(--card-gradient)',
        borderColor: spotlight ? 'rgba(99,102,241,0.42)' : 'rgba(99,102,241,0.28)',
        boxShadow: spotlight ? '0 0 64px rgba(99,102,241,0.16)' : '0 0 44px rgba(99,102,241,0.09)',
      }}
    >
      {/* Indigo bloom, drawn once on entry */}
      <motion.div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          top: -150, right: -110, width: spotlight ? 420 : 320, height: spotlight ? 420 : 320,
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 68%)',
        }}
        initial={reduced ? { opacity: 0.6 } : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{
          duration: reduced ? 0.001 : 1.1,
          ease: [0.16, 1, 0.3, 1],
          delay: reduced ? 0 : 0.2 + index * 0.08,
        }}
      />

      {/* In the three-across row there's no room beside the avatar for a long
          title badge, so those cards stack it above the text from md up. */}
      <div className={`relative flex items-start ${spotlight ? 'gap-5' : 'gap-4 md:flex-col md:gap-3'}`}>
        <div
          className={`flex items-center justify-center rounded-2xl font-bold flex-shrink-0 ${
            spotlight ? 'text-[20px]' : 'text-[16px]'
          }`}
          style={{
            width: spotlight ? 72 : 56, height: spotlight ? 72 : 56,
            color: 'var(--color-text)',
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.5)',
            boxShadow: '0 0 26px rgba(99,102,241,0.22)',
          }}
        >
          {initials(person.name)}
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] whitespace-nowrap"
            style={{
              background: 'rgba(99,102,241,0.14)',
              color: 'var(--color-text)',
              border: '1px solid rgba(99,102,241,0.32)',
            }}
          >
            {title.title}
          </span>
          <p
            className="font-bold text-[var(--color-text)] leading-tight"
            style={{ fontSize: spotlight ? '1.75rem' : '1.25rem', letterSpacing: '-0.02em', textWrap: 'balance' }}
          >
            {person.name}
          </p>

          {/* Any other seats they hold. The one matching the active filter
              lights up, so the masthead answers the filter too. */}
          {otherRoles.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {otherRoles.map(r => {
                const g = GROUP_BY_ID[r.group]
                return (
                  <span
                    key={r.group}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] border"
                    style={{
                      color: 'var(--color-muted)',
                      background: 'rgba(var(--hairline-rgb),0.04)',
                      borderColor: 'rgba(var(--hairline-rgb),0.09)',
                    }}
                  >
                    <span
                      className="block rounded-full flex-shrink-0"
                      style={{ width: 5, height: 5, background: g.color }}
                      aria-hidden="true"
                    />
                    {r.title} · {g.short ?? g.label}
                  </span>
                )
              })}
            </div>
          )}

          <div className="mt-3">
            <SocialLinks person={person} size={30} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Filter pill ───────────────────────────────────────────── */
function FilterPill({
  label, count, color, active, onClick, reduced,
}: {
  label: string
  count: number
  color?: string
  active: boolean
  onClick: () => void
  reduced: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors duration-200 focus-ring"
      style={{ color: active ? 'var(--color-text)' : 'var(--color-muted)' }}
    >
      {active && (
        <motion.span
          layoutId="committee-filter-pill"
          className="absolute inset-0 rounded-full border"
          style={{
            background: color ? `${color}1f` : 'rgba(var(--hairline-rgb),0.09)',
            borderColor: color ? `${color}66` : 'rgba(var(--hairline-rgb),0.2)',
          }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 42 }}
        />
      )}
      {color && (
        <span
          className="relative block rounded-full flex-shrink-0"
          style={{
            width: 6, height: 6, background: color,
            boxShadow: active ? `0 0 8px ${color}` : 'none',
          }}
          aria-hidden="true"
        />
      )}
      <span className="relative whitespace-nowrap">{label}</span>
      <span
        className="relative text-[10.5px] tabular-nums"
        style={{ color: 'var(--color-muted)' }}
      >
        {count}
      </span>
    </button>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function CommitteePage() {
  const [filter, setFilter] = useState<GroupId | 'all'>('all')
  const reduced = useReducedMotion() ?? false

  // Stagger the grid once on first paint, then never again — refiltering
  // should read as a reflow, not as the page loading a second time.
  const firstPaint = useRef(true)
  const stagger = firstPaint.current
  if (typeof window !== 'undefined') firstPaint.current = false

  const everyone = useMemo(() => [...LEADS, ...COMMITTEE], [])

  // One bucket per area, leads listed first inside each.
  const sections = useMemo(() => {
    return GROUPS.map(group => {
      const people = everyone
        .flatMap(person => person.roles
          .filter(r => r.group === group.id)
          .map(role => ({ person, role })))
        .sort((a, b) => Number(!!b.role.lead) - Number(!!a.role.lead))
      return { group, people }
    }).filter(s => s.people.length > 0)
  }, [everyone])

  const counts = useMemo(
    () => new Map(sections.map(s => [s.group.id, s.people.length] as const)),
    [sections],
  )

  const visibleSections = useMemo(
    () => (filter === 'all' ? sections : sections.filter(s => s.group.id === filter)),
    [sections, filter],
  )

  // Headcount, not seat count: nobody is counted twice for holding two roles.
  const shownCount = useMemo(
    () => new Set(visibleSections.flatMap(s => s.people.map(p => p.person.id))).size,
    [visibleSections],
  )

  const departments = GROUPS.filter(g => g.kind === 'department')
  const teams = GROUPS.filter(g => g.kind === 'team')

  return (
    <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14" style={{ position: 'relative', zIndex: 1 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <motion.header
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.001 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-9"
      >
        <span className="eyebrow mb-3 block">BCU Computing Society</span>
        <h1
          className="display-headline mb-3"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', textWrap: 'balance' }}
        >
          Meet the Committee
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-[60ch] leading-relaxed">
          {everyone.length} students running BCUComputingSoc across {departments.length} departments and {teams.length} teams.
          Filter by the area you care about, or find someone to talk to.
        </p>
      </motion.header>

      {/* ── Filters ────────────────────────────────────────── */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.001 : 0.4, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : 0.14 }}
        className="mb-5"
      >
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter committee by area">
          <FilterPill
            label="Everyone"
            count={everyone.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            reduced={reduced}
          />
          {GROUPS.map((g, i) => (
            <span key={g.id} className="contents">
              {(i === 1 || g.kind === 'team') && GROUPS[i - 1]?.kind !== g.kind && (
                <span className="w-px h-4 mx-1.5 flex-shrink-0" style={{ background: 'rgba(var(--hairline-rgb),0.12)' }} aria-hidden="true" />
              )}
              <FilterPill
                label={g.short ?? g.label}
                count={counts.get(g.id) ?? 0}
                color={g.color}
                active={filter === g.id}
                onClick={() => setFilter(filter === g.id ? 'all' : g.id)}
                reduced={reduced}
              />
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
          <span className="tabular-nums">
            Showing {shownCount} of {everyone.length}
          </span>
          {filter !== 'all' && (
            <>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setFilter('all')}
                className="underline underline-offset-2 hover:text-[var(--color-text)] transition-colors focus-ring rounded"
              >
                Clear filter
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Directory ──────────────────────────────────────── */}
      <motion.div
        layout={reduced ? false : true}
        transition={reduced ? { duration: 0 } : { layout: { type: 'spring', stiffness: 420, damping: 40 } }}
        className="flex flex-col gap-9"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleSections.map(({ group, people }) => (
            <DepartmentSection
              key={group.id}
              group={group}
              people={people}
              stagger={stagger}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="mt-12 pt-6" style={{ borderTop: '1px solid rgba(var(--hairline-rgb),0.07)' }}>
        <p className="text-[12px] text-[var(--color-muted)] text-center">
          Interested in joining the committee?{' '}
          <Link
            href={APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline focus-ring rounded"
          >
            Apply here →
          </Link>
        </p>
      </div>
    </div>
  )
}
