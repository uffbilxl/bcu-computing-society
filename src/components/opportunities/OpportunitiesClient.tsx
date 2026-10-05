'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, X, ShieldOff, ArrowUpRight, Clock, MapPin, SearchX } from 'lucide-react'
import { Opportunity, OpportunityType } from '@/types'
import {
  formatDeadline,
  deadlineHint,
  deadlineStatus,
  opportunityTypeLabel,
  opportunityTypeBadgeClass,
  workModeLabel,
  formatSalary,
} from '@/lib/utils'
import { prominenceScore } from '@/lib/companyRanking'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { useStillOpen } from '@/hooks/useStillOpen'

const TYPES: { value: OpportunityType; label: string }[] = [
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'PLACEMENT', label: 'Placement' },
  { value: 'GRADUATE', label: 'Graduate' },
  { value: 'SPRING_WEEK', label: 'Spring Week' },
  { value: 'INSIGHT', label: 'Insight' },
]

type Sort = 'newest' | 'deadline' | 'salary' | 'az'

interface Props {
  opportunities: Opportunity[]
}

export function OpportunitiesClient({ opportunities: served }: Props) {
  // The page is cached; anything that closes while it's being served drops out here.
  const opportunities = useStillOpen(served)
  // Read on the client (not passed as a server prop) so the page itself
  // stays cacheable — reading searchParams server-side forces Next.js to
  // skip caching for the whole route.
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') as OpportunityType | null
  const [types, setTypes] = useState<OpportunityType[]>(initialType ? [initialType] : [])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('newest')

  function toggleType(t: OpportunityType) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }
  function clearAll() {
    setTypes([]); setSearch('')
  }

  const hasFilters = types.length > 0 || search.trim() !== ''

  const filtered = useMemo(() => {
    let list = [...opportunities]
    if (types.length) list = list.filter(o => types.includes(o.type))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.company.name.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q) ||
        o.tags.some(({ tag }) => tag.name.toLowerCase().includes(q))
      )
    }
    // Default view: recognisable UK employers first, newest within that —
    // an explicit sort choice below (deadline/salary/A-Z) overrides this.
    if (sort === 'newest') list.sort((a, b) => {
      const diff = prominenceScore(b.company.name, b.location) - prominenceScore(a.company.name, a.location)
      return diff !== 0 ? diff : +new Date(b.createdAt) - +new Date(a.createdAt)
    })
    if (sort === 'deadline') list.sort((a, b) => {
      if (!a.deadline) return 1; if (!b.deadline) return -1
      return +new Date(a.deadline) - +new Date(b.deadline)
    })
    if (sort === 'salary') list.sort((a, b) => (b.salaryMin ?? b.salaryMax ?? 0) - (a.salaryMin ?? a.salaryMax ?? 0))
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    return list
  }, [opportunities, types, search, sort])

  const totalOpen   = opportunities.length
  const companies   = new Set(opportunities.map(o => o.company.name)).size
  const countOf     = (t: OpportunityType) => opportunities.filter(o => o.type === t).length

  return (
    <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      {/* ── Header ─────────────────────────────────────────── */}
      <header>
        <h1 className="page-title enter">Opportunities</h1>
        <p className="page-lede mt-3 enter" style={{ '--i': 1 } as React.CSSProperties}>
          {totalOpen} open roles from {companies} companies across the UK: {countOf('INTERNSHIP')} internships,{' '}
          {countOf('PLACEMENT')} placements and {countOf('GRADUATE')} graduate roles. This tracker is updated daily with new opportunities.
        </p>
        <p style={{ '--i': 2 } as React.CSSProperties} className="enter mt-4 inline-flex items-start gap-2 text-[13px] leading-relaxed text-[var(--color-muted)] rounded-lg px-3 py-2 border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          <ShieldOff size={15} className="mt-[2px] flex-shrink-0 text-[var(--color-muted-2)]" aria-hidden="true" />
          We aim to provide as many opportunities as possible, but we will not promote defence companies.
        </p>
      </header>

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div
        /* Pinned below the nav on tablet and up. On phones it stacks into
           three rows, which would eat a quarter of the screen if it stuck. */
        className="md:sticky md:top-16 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 mt-8 border-b border-[var(--color-border-subtle)]"
        style={{ zIndex: 30, background: 'var(--navbar-glass-bg)', backdropFilter: 'saturate(160%) blur(14px)', WebkitBackdropFilter: 'saturate(160%) blur(14px)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative md:w-[300px] flex-shrink-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-2)] pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search role, company, skill"
              aria-label="Search opportunities"
              className="input pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter by type"
            className="flex gap-2 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 md:flex-1 [scrollbar-width:none]"
          >
            {TYPES.map(t => {
              const on = types.includes(t.value)
              return (
                <button
                  key={t.value}
                  onClick={() => toggleType(t.value)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-[14px] whitespace-nowrap transition-colors duration-150 focus-ring ${
                    on
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white font-medium'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {t.label}
                  <span className={`tabular-nums text-[12px] ${on ? 'text-white/80' : 'text-[var(--color-muted-2)]'}`}>
                    {countOf(t.value)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 md:ml-auto flex-shrink-0">
            <label htmlFor="opp-sort" className="text-[13px] text-[var(--color-muted)] whitespace-nowrap">Sort by</label>
            <select
              id="opp-sort"
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              className="input w-auto pr-8"
            >
              <option value="newest">Recommended</option>
              <option value="deadline">Deadline soonest</option>
              <option value="salary">Highest salary</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 mb-3 min-h-8">
        <p className="text-[14px] text-[var(--color-muted)]" aria-live="polite">
          Showing <strong className="text-[var(--color-text)] font-semibold">{filtered.length}</strong>{' '}
          {filtered.length === 1 ? 'opportunity' : 'opportunities'}
        </p>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={clearAll} className="btn-sm btn-ghost focus-ring">
              <X size={14} aria-hidden="true" />
              Clear
            </button>
          )}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
            aria-label="Sort by"
            className="md:hidden input h-8 w-auto text-[13px] pr-7"
          >
            <option value="newest">Recommended</option>
            <option value="deadline">Deadline soonest</option>
            <option value="salary">Highest salary</option>
            <option value="az">A–Z</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card py-16 px-6 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--color-surface-2)] text-[var(--color-muted)]">
            <SearchX size={22} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[16px] font-semibold text-[var(--color-text)]">No opportunities match</p>
          <p className="mt-1 text-[14px] text-[var(--color-muted)] max-w-[40ch]">
            {opportunities.length === 0
              ? 'Listings are refreshing. Check back in a few minutes.'
              : 'Try a broader search or switch off a type filter.'}
          </p>
          {hasFilters && (
            <button onClick={clearAll} className="btn-primary mt-5 focus-ring">Clear filters</button>
          )}
        </div>
      ) : (
        /* Keyed on the filters so the rows replay a short fade when the
           result set changes: the list visibly responds to the input. */
        <ul
          key={`${types.join(',')}|${search.trim()}|${sort}`}
          className="card overflow-hidden divide-y divide-[var(--color-border-subtle)]"
        >
          {filtered.map((opp, i) => (
            <li key={opp.id} className={i < 24 ? 'fade-in' : undefined} style={{ '--i': i } as React.CSSProperties}>
              <OpportunityRow opp={opp} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OpportunityRow({ opp }: { opp: Opportunity }) {
  const ds = deadlineStatus(opp.deadline)
  const hint = deadlineHint(opp.deadline)
  const isNew = opp.createdAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const hasSalary = Boolean(opp.salary || opp.salaryMin || opp.salaryMax)

  /* Straight to the employer's application, matching the homepage cards.
   * Falls back to our detail page only when a row has no application link. */
  const external = Boolean(opp.applyUrl)
  const href = opp.applyUrl || `/opportunities/${opp.slug}`

  return (
    <Link
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-start sm:items-center gap-4 px-4 sm:px-5 py-4 transition-colors duration-150 hover:bg-[var(--color-surface-hover)] focus-ring"
    >
      <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
        <CompanyLogo name={opp.company.name} logoUrl={opp.company.logo} size={44} />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="text-[15px] sm:text-[16px] font-semibold text-[var(--color-text)] leading-snug line-clamp-2 sm:truncate">
            {opp.title}
          </p>
          {isNew && <span className="badge-blue flex-shrink-0 mt-0.5">New</span>}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] min-w-0">
          <span className="font-medium text-[var(--t2)] truncate max-w-[45%]">{opp.company.name}</span>
          <span aria-hidden="true">·</span>
          <MapPin size={12} className="flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{opp.location}</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="hidden sm:inline flex-shrink-0">{workModeLabel(opp.workMode)}</span>
        </p>
        <div className="mt-2 flex gap-1.5 flex-wrap">
          <span className={opportunityTypeBadgeClass(opp.type)}>{opportunityTypeLabel(opp.type)}</span>
          {opp.tags.slice(0, 2).map(({ tag }) => (
            <span key={tag.id} className="tag hidden sm:inline-flex">{tag.name}</span>
          ))}
          {/* Deadline sits with the badges on small screens */}
          <span className="sm:hidden inline-flex items-center gap-1 text-[12px] text-[var(--color-muted)]">
            <Clock size={12} aria-hidden="true" />
            {opp.deadline ? formatDeadline(opp.deadline) : 'Rolling'}
          </span>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 text-right min-w-[150px]">
        {hasSalary && (
          <span className="text-[14px] font-semibold text-[var(--color-text)]">
            {formatSalary(opp.salaryMin, opp.salaryMax, opp.salary)}
          </span>
        )}
        <span className="text-[13px] text-[var(--color-muted)]">
          {opp.deadline ? `Closes ${formatDeadline(opp.deadline)}` : 'Rolling deadline'}
        </span>
        {hint && ds === 'closing' && (
          <span className="badge-amber">{hint}</span>
        )}
      </div>

      <ArrowUpRight
        size={16}
        className="hidden sm:block flex-shrink-0 text-[var(--color-muted-2)] group-hover:text-[var(--color-accent-text)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
        aria-hidden="true"
      />
      {external && <span className="sr-only">(opens the employer&apos;s site in a new tab)</span>}
    </Link>
  )
}
