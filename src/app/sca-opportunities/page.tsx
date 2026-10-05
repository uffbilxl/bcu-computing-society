'use client'

import { useState } from 'react'
import { ChevronDown, ArrowUpRight, Check, Mail } from 'lucide-react'

/* Roles within the society itself. Data first, so adding next term's intake
 * or retiring one is an edit to this list rather than another copy of the
 * card markup. */
interface Organiser { name: string; email?: string }
interface Role {
  id: string
  status: 'open' | 'filled'
  title: string
  org: string
  tags: string[]
  body: string
  roles?: string[]
  duties: string[]
  skills?: { list: string[]; note?: string }
  facts: [string, string][]
  why?: string[]
  footnote: string
  organisers: Organiser[]
  applyUrl?: string
}

const BILAL: Organiser = { name: 'Bilal Arshad', email: 'bilal.arshad2@mail.bcu.ac.uk' }

const ROLES: Role[] = [
  {
    id: 'internships',
    status: 'open',
    title: 'BCUComputingSoc Internship Opportunities',
    org: 'BCU Computing Society',
    tags: ['8 positions', '50%+ first years'],
    body:
      'Applications are open for Web Development and Project Management internships with the BCUComputingSoc, across 8 positions. These roles are designed for students with little to no experience who want to build practical skills by working on real projects. More than half of the positions will be allocated to first year students.',
    roles: ['Web Development', 'Project Management'],
    duties: ['Build and maintain websites', 'Work on real projects alongside your studies'],
    facts: [
      ['Experience', 'Little to no experience required'],
      ['AI tools', 'Allowed'],
    ],
    why: ['Hands-on experience for your CV', 'Build practical skills on real projects', 'Over 50% of roles go to first years'],
    footnote: '8 positions · Applications open',
    organisers: [BILAL],
    applyUrl: 'https://tally.so/r/A7kJDz',
  },
  {
    id: 'webdev',
    status: 'filled',
    title: 'Web Development Intern',
    org: 'BCU Computing Society',
    tags: ['Web Division', 'Year-long'],
    body:
      "A year-long internship within BCUComputingSoc's Web Division, responsible for building and maintaining the society's digital presence. You'll work on live websites used by BCUComputingSoc members, keeping them up to date, functional, and well-designed. Ideal for students who want real ownership over a product and hands-on web development experience alongside their studies.",
    duties: [
      'Maintain and update existing BCUComputingSoc websites',
      'Build new pages and features as the association grows',
      'Fix bugs and ensure cross-browser, responsive performance',
      'Collaborate with other BCUComputingSoc divisions on web needs',
    ],
    skills: { list: ['HTML', 'CSS', 'JavaScript'], note: 'Basic proficiency required' },
    facts: [['Experience', 'No prior experience required']],
    footnote: 'Superseded by the current BCUComputingSoc internship intake',
    organisers: [BILAL],
  },
  {
    id: 'sports',
    status: 'filled',
    title: 'BCUComputingSoc Sports Analytics Department',
    org: 'BCU Computing Society · BCU Basketball',
    tags: ['AI Division'],
    body:
      'A student-led initiative under the AI Division supporting the BCU Basketball team ahead of the 2026/27 BUCS season. Successful applicants will take part in a summer pilot programme before the official launch in September. Best suited to those with an interest in data and AI.',
    roles: ['Performance Analyst', 'Video Analyst', 'Data Collector'],
    duties: [
      'Attend fixtures and collect live data',
      'Process and analyse performance data',
      'Contribute to match and opposition reports',
      'Support video analysis and scouting',
    ],
    skills: { list: ['Python', 'Excel', 'PowerPoint'] },
    facts: [['Experience', 'No prior experience required']],
    footnote: 'All positions filled',
    organisers: [{ name: 'Mohammed Dahir', email: 'Mohamed.Dahir@mail.bcu.ac.uk' }],
  },
  {
    id: 'softwaredev',
    status: 'filled',
    title: 'BCUComputingSoc Software Developers',
    org: 'CivitasAccess · Promoted by BCU Computing Society',
    tags: ['CivitasAccess', '3–4 positions'],
    body:
      'An opportunity promoted by the BCUComputingSoc to work with CivitasAccess, a real company building access control and visitor management software. 3-4 students will collaborate to design and build a full stack application, working across the full development lifecycle, from planning and architecture through to deployment. Ideal for students who want genuine industry experience and the chance to ship something used in a production environment.',
    duties: [
      'Design and build a full stack application from the ground up',
      'Collaborate as a small team across frontend, backend, and database',
      'Contribute to architecture decisions and technical planning',
      'Deploy and maintain the application in a real production environment',
    ],
    skills: { list: ['HTML/CSS', 'JavaScript', 'Git'] },
    facts: [['Team size', '3–4 interns working together']],
    footnote: 'All positions filled',
    organisers: [{ name: 'Tayyeb Nadeem Somro' }, BILAL],
  },
]

/* Height animates via grid-template-rows (0fr → 1fr), which transitions
 * smoothly without measuring the content. */
function Collapsible({ open, id, children }: { open: boolean; id: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className="grid transition-[grid-template-rows] duration-300 ease-out-quint"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden" inert={!open ? ('' as unknown as boolean) : undefined}>
        <div className={`transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>{children}</div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{children}</h4>
}

function RoleDetails({ role }: { role: Role }) {
  return (
    <div className="border-t border-[var(--color-border-subtle)]">
      <div className="px-5 sm:px-6 py-6 grid gap-6">
        <p className="text-[15px] text-[var(--color-muted)] leading-relaxed max-w-[70ch]">{role.body}</p>

        {role.roles && (
          <div>
            <Label>Roles available</Label>
            <div className="flex flex-wrap gap-2">
              {role.roles.map(r => <span key={r} className="badge-blue text-[13px] px-2.5 py-1">{r}</span>)}
            </div>
          </div>
        )}

        <div>
          <Label>What you&apos;ll do</Label>
          <ul className="grid gap-2">
            {role.duties.map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[15px] text-[var(--color-muted)]">
                <Check size={16} className="mt-[3px] flex-shrink-0 text-[var(--color-accent-text)]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid sm:grid-cols-2 gap-5">
          {role.skills && (
            <div>
              <dt><Label>Expected skills</Label></dt>
              <dd>
                <div className="flex flex-wrap gap-1.5">
                  {role.skills.list.map(sk => <span key={sk} className="tag text-[13px]">{sk}</span>)}
                </div>
                {role.skills.note && <p className="text-[13px] text-[var(--color-muted)] mt-2">{role.skills.note}</p>}
              </dd>
            </div>
          )}
          {role.facts.map(([k, v]) => (
            <div key={k}>
              <dt><Label>{k}</Label></dt>
              <dd className="text-[15px] text-[var(--color-muted)]">{v}</dd>
            </div>
          ))}
        </dl>

        {role.why && (
          <div className="rounded-xl px-4 py-4" style={{ background: 'var(--color-accent-dim)' }}>
            <Label>Why apply</Label>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {role.why.map(b => (
                <li key={b} className="flex items-center gap-2 text-[14px] text-[var(--color-text)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)]" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        style={{ background: 'color-mix(in srgb, var(--color-surface-2) 45%, transparent)' }}>
        <div className="text-[13px] text-[var(--color-muted)] grid gap-1">
          <p>{role.footnote}</p>
          <p className="flex flex-wrap items-center gap-x-1.5">
            <span>{role.organisers.length > 1 ? 'Organisers:' : 'Organiser:'}</span>
            {role.organisers.map((o, i) => (
              <span key={o.name} className="inline-flex items-center gap-1">
                {o.email ? (
                  <a
                    href={`mailto:${o.email}`}
                    className="inline-flex items-center gap-1 font-medium text-[var(--color-text)] hover:text-[var(--color-accent-text)] underline decoration-[var(--color-border)] underline-offset-[3px] rounded focus-ring"
                  >
                    <Mail size={12} aria-hidden="true" />
                    {o.name}
                  </a>
                ) : (
                  <span className="font-medium text-[var(--color-text)]">{o.name}</span>
                )}
                {i < role.organisers.length - 1 && <span>&amp;</span>}
              </span>
            ))}
          </p>
        </div>
        {role.applyUrl ? (
          <a href={role.applyUrl} target="_blank" rel="noopener noreferrer" className="group btn-primary btn-lg focus-ring">
            Apply now
            <ArrowUpRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </a>
        ) : (
          <span className="btn-ghost cursor-default text-[var(--color-muted)]" aria-disabled="true">Applications closed</span>
        )}
      </div>
    </div>
  )
}

function RoleCard({ role, open, onToggle }: { role: Role; open: boolean; onToggle: () => void }) {
  const isOpen = role.status === 'open'
  return (
    <article className={`card overflow-hidden transition-colors duration-200 ${open ? 'border-[var(--color-border)]' : ''}`}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`role-${role.id}`}
        className="w-full text-left px-5 sm:px-6 py-5 hover:bg-[var(--color-surface-hover)] transition-colors focus-ring"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {isOpen ? (
                <span className="badge-green"><span className="live-dot !w-1.5 !h-1.5" aria-hidden="true" />Now open</span>
              ) : (
                <span className="badge-gray">Filled</span>
              )}
              {role.tags.map(t => <span key={t} className="badge-gray">{t}</span>)}
            </div>
            <h2 className={`font-semibold tracking-[-0.01em] text-[var(--color-text)] ${isOpen ? 'text-[20px] sm:text-[22px]' : 'text-[17px]'}`}>
              {role.title}
            </h2>
            <p className="text-[14px] text-[var(--color-muted)] mt-1">{role.org}</p>
          </div>
          <span className="w-9 h-9 rounded-lg border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 text-[var(--color-muted)]">
            <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </span>
        </div>
      </button>
      <Collapsible open={open} id={`role-${role.id}`}>
        <RoleDetails role={role} />
      </Collapsible>
    </article>
  )
}

export default function SCAOpportunitiesPage() {
  // The open intake starts expanded: it's the thing to act on.
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({ internships: true })
  const [showPrevious, setShowPrevious] = useState(false)

  const toggle = (id: string) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }))
  const current = ROLES.filter(r => r.status === 'open')
  const previous = ROLES.filter(r => r.status !== 'open')

  return (
    <div className="max-w-[960px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      <header className="mb-8">
        <h1 className="page-title enter">Internal roles</h1>
        <p className="page-lede mt-3 enter" style={{ '--i': 1 } as React.CSSProperties}>
          Internal opportunities within the BCU Computing Society: committee roles, volunteering, and more.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {current.map((role, i) => (
          <div key={role.id} className="enter" style={{ '--i': 2 + i } as React.CSSProperties}>
            <RoleCard role={role} open={!!openCards[role.id]} onToggle={() => toggle(role.id)} />
          </div>
        ))}
      </div>

      <section className="mt-12 reveal" aria-labelledby="previous-roles">
        <button
          onClick={() => setShowPrevious(v => !v)}
          aria-expanded={showPrevious}
          aria-controls="previous-list"
          className="group inline-flex items-center gap-2 h-10 px-3 -ml-3 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors focus-ring"
        >
          <ChevronDown
            size={16}
            className={`text-[var(--color-muted)] transition-transform duration-300 ${showPrevious ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          <h2 id="previous-roles" className="text-[16px] font-semibold text-[var(--color-text)]">
            Previous roles
          </h2>
          <span className="badge-gray">{previous.length}</span>
        </button>

        <Collapsible open={showPrevious} id="previous-list">
          <div className="flex flex-col gap-3 pt-4">
            {previous.map(role => (
              <RoleCard key={role.id} role={role} open={!!openCards[role.id]} onToggle={() => toggle(role.id)} />
            ))}
          </div>
        </Collapsible>
      </section>
    </div>
  )
}
