/* See src/app/page.tsx for why this isn't force-dynamic anymore. */
export const revalidate = 300

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDeadline, deadlineHint, deadlineStatus, opportunityTypeLabel, opportunityTypeBadgeClass, workModeLabel, formatSalary } from '@/lib/utils'
import { ArrowLeft, ArrowUpRight, MapPin, CalendarDays, Briefcase, BadgeCheck, Clock, Check } from 'lucide-react'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { openDeadlineFloor } from '@/lib/time'

interface Props { params: { slug: string } }

/* Without this, Next.js never treats the route as cacheable at all — the
 * revalidate export above is silently ignored for [slug] segments with no
 * generateStaticParams. Returning nothing here means no page is built
 * ahead of time (opportunities change too often via the scrape job for
 * that to be worth it); each slug is instead rendered on its first visit,
 * then served from cache for `revalidate` seconds — the on-demand ISR
 * Next.js calls "fallback: blocking" in the old Pages Router. */
export async function generateStaticParams() {
  return []
}

export default async function OpportunityDetailPage({ params }: Props) {
  const opp = await prisma.opportunity.findFirst({
    where: { slug: params.slug },
    include: { company: true, tags: { include: { tag: true } } },
  })
  // Closed roles are already excluded from every listing/search surface —
  // without this, a direct/bookmarked/indexed link would still render the
  // page in full, "Apply now" button and all, for a role that's no longer
  // taking applications. Also treat a passed deadline as closed, same as
  // every other public query — status alone lags behind the actual date.
  if (!opp || opp.status === 'CLOSED' || deadlineStatus(opp.deadline) === 'closed') notFound()

  const related = await prisma.opportunity.findMany({
    where: {
      slug: { not: params.slug },
      status: { not: 'CLOSED' },
      AND: [
        { OR: [{ type: opp.type }, { companyId: opp.companyId }] },
        { OR: [{ deadline: null }, { deadline: { gte: openDeadlineFloor() } }] },
      ],
    },
    include: { company: true },
    take: 3,
  })

  const ds = deadlineStatus(opp.deadline)
  const hint = deadlineHint(opp.deadline)
  const salary = opp.salary || opp.salaryMin ? formatSalary(opp.salaryMin, opp.salaryMax, opp.salary) : null

  const overview = ([
    ['Type', opportunityTypeLabel(opp.type)],
    opp.duration ? ['Duration', opp.duration] : null,
    opp.startDate ? ['Start', opp.startDate] : null,
    ['Location', opp.location],
    ['Work mode', workModeLabel(opp.workMode)],
    salary ? ['Salary', salary] : null,
    opp.deadline ? ['Deadline', formatDeadline(opp.deadline)] : ['Deadline', 'Rolling'],
    ['Visa', opp.sponsored ? 'Sponsored' : 'Not sponsored'],
  ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null)

  const bulletList = (text: string) => (
    <ul className="grid gap-2">
      {text.split('\n').filter(Boolean).map((line, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] text-[var(--color-muted)] leading-relaxed">
          <Check size={16} className="mt-[4px] flex-shrink-0 text-[var(--color-accent-text)]" aria-hidden="true" />
          {line.replace(/^[-•*]\s*/, '')}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 pt-8 sm:pt-10 pb-20">
      <Link
        href="/opportunities"
        className="group inline-flex items-center gap-1.5 h-9 px-3 -ml-3 rounded-lg text-[14px] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors focus-ring"
      >
        <ArrowLeft size={15} className="transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
        All opportunities
      </Link>

      {/* Header */}
      <header className="enter mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-[var(--color-border-subtle)]">
        <div className="flex gap-4 sm:gap-5 items-start min-w-0">
          <CompanyLogo name={opp.company.name} logoUrl={opp.company.logo} size={64} />
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-[var(--color-text)]">{opp.company.name}</p>
            <h1
              className="mt-1 font-bold text-[var(--color-text)]"
              style={{ fontSize: 'clamp(1.6rem, 1.2rem + 1.6vw, 2.25rem)', letterSpacing: '-0.025em', lineHeight: 1.12 }}
            >
              {opp.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" />{opp.location}</span>
              <span className="inline-flex items-center gap-1.5"><Briefcase size={14} aria-hidden="true" />{workModeLabel(opp.workMode)}</span>
              {opp.startDate && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} aria-hidden="true" />{opp.startDate}{opp.duration ? ` · ${opp.duration}` : ''}
                </span>
              )}
              {salary && <span className="font-medium text-[var(--color-text)]">{salary}</span>}
              {opp.sponsored && (
                <span className="inline-flex items-center gap-1.5 text-[var(--color-ok)]"><BadgeCheck size={14} aria-hidden="true" />Visa sponsored</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className={opportunityTypeBadgeClass(opp.type)}>{opportunityTypeLabel(opp.type)}</span>
              {ds === 'open' && <span className="badge-green">Open</span>}
              {ds === 'closing' && <span className="badge-amber">Closing soon</span>}
              {ds === 'closed' && <span className="badge-red">Closed</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:items-end flex-shrink-0">
          {opp.applyUrl ? (
            <a href={opp.applyUrl} target="_blank" rel="noopener noreferrer" className="group btn-primary btn-lg focus-ring">
              Apply on {opp.company.name.length > 18 ? 'employer site' : opp.company.name}
              <ArrowUpRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </a>
          ) : (
            <span className="btn-ghost btn-lg cursor-not-allowed text-[var(--color-muted)]" aria-disabled="true">Application closed</span>
          )}
          <p className={`inline-flex items-center gap-1.5 text-[13px] ${ds === 'closing' ? 'text-[var(--color-warn)] font-medium' : 'text-[var(--color-muted)]'}`}>
            <Clock size={13} aria-hidden="true" />
            {opp.deadline ? `${formatDeadline(opp.deadline)}${hint ? ` · ${hint}` : ''}` : 'Rolling deadline'}
          </p>
        </div>
      </header>

      {/* Body */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10">
        <div className="grid grid-cols-1 gap-9 content-start min-w-0">
          <section>
            <h2 className="text-[18px] font-semibold text-[var(--color-text)] mb-3">About the role</h2>
            <p className="text-[15px] text-[var(--color-muted)] leading-relaxed whitespace-pre-line max-w-[68ch]">{opp.description}</p>
          </section>

          {opp.responsibilities && (
            <section>
              <h2 className="text-[18px] font-semibold text-[var(--color-text)] mb-3">What you&apos;ll do</h2>
              {bulletList(opp.responsibilities)}
            </section>
          )}

          {opp.requirements && (
            <section>
              <h2 className="text-[18px] font-semibold text-[var(--color-text)] mb-3">What they&apos;re looking for</h2>
              {bulletList(opp.requirements)}
            </section>
          )}

          {opp.tags.length > 0 && (
            <section>
              <h2 className="text-[18px] font-semibold text-[var(--color-text)] mb-3">Tech stack</h2>
              <div className="flex gap-1.5 flex-wrap">
                {opp.tags.map(({ tag }) => <span key={tag.id} className="tag text-[13px]">{tag.name}</span>)}
              </div>
            </section>
          )}
        </div>

        <aside className="grid grid-cols-1 gap-4 content-start min-w-0">
          <div className="card p-5">
            <h2 className="text-[15px] font-semibold text-[var(--color-text)] mb-2">Overview</h2>
            <dl>
              {overview.map(([k, v], i) => (
                <div key={k} className={`flex justify-between gap-4 py-2.5 text-[14px] ${i < overview.length - 1 ? 'border-b border-[var(--color-border-subtle)]' : ''}`}>
                  <dt className="text-[var(--color-muted)]">{k}</dt>
                  <dd className={`text-right font-medium ${k === 'Deadline' && ds === 'closing' ? 'text-[var(--color-warn)]' : 'text-[var(--color-text)]'}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {opp.company.description && (
            <div className="card p-5">
              <h2 className="text-[15px] font-semibold text-[var(--color-text)] mb-2">About {opp.company.name}</h2>
              <p className="text-[14px] text-[var(--color-muted)] leading-relaxed">{opp.company.description}</p>
              {opp.company.website && (
                <a
                  href={opp.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-[var(--color-accent-text)] hover:underline underline-offset-2 rounded focus-ring"
                >
                  Visit website <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div className="card p-2">
              <h2 className="text-[15px] font-semibold text-[var(--color-text)] px-3 pt-3 pb-2">Related roles</h2>
              <ul>
                {related.map(r => (
                  <li key={r.id}>
                    <Link
                      href={r.applyUrl || `/opportunities/${r.slug}`}
                      {...(r.applyUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors focus-ring"
                    >
                      <CompanyLogo name={r.company.name} logoUrl={r.company.logo} size={32} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-medium text-[var(--color-text)] leading-snug line-clamp-2">{r.title}</span>
                        <span className="block text-[13px] text-[var(--color-muted)] truncate">{r.company.name} · {r.location}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
