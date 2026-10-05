import Link from 'next/link'
import { MapPin, ArrowUpRight, Clock } from 'lucide-react'
import { Opportunity } from '@/types'
import {
  formatDeadline,
  deadlineHint,
  deadlineStatus,
  opportunityTypeLabel,
  opportunityTypeBadgeClass,
  workModeLabel,
} from '@/lib/utils'
import { CompanyLogo } from '@/components/ui/CompanyLogo'

interface OpportunityCardProps {
  opportunity: Opportunity
  /** Kept for call-site compatibility; featured sections no longer badge each card. */
  showFeaturedBadge?: boolean
}

export function OpportunityCard({ opportunity: opp }: OpportunityCardProps) {
  const ds    = deadlineStatus(opp.deadline)
  const hint  = deadlineHint(opp.deadline)
  const isNew = opp.createdAt > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

  /* Straight to the employer's application rather than via our own detail
   * page and a second "Apply now" click. Falls back to the detail page on the
   * rare row with no application link, so a card is never a dead end. */
  const external = Boolean(opp.applyUrl)
  const href = opp.applyUrl || `/opportunities/${opp.slug}`

  return (
    <Link
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group card-interactive flex flex-col w-full p-5 focus-ring"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 transition-transform duration-200 ease-out group-hover:scale-105 group-hover:-rotate-2">
          <CompanyLogo name={opp.company.name} logoUrl={opp.company.logo} size={40} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-[var(--color-text)] truncate">{opp.company.name}</p>
          <p className="flex items-center gap-1 text-[13px] text-[var(--color-muted)] mt-0.5 min-w-0">
            <MapPin size={12} className="flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{opp.location}</span>
            <span aria-hidden="true">·</span>
            <span className="flex-shrink-0">{workModeLabel(opp.workMode)}</span>
          </p>
        </div>
        {ds === 'closing' ? (
          <span className="badge-amber flex-shrink-0">Closing soon</span>
        ) : ds === 'closed' ? (
          <span className="badge-red flex-shrink-0">Closed</span>
        ) : isNew ? (
          <span className="badge-blue flex-shrink-0">New</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-[16px] font-semibold leading-snug text-[var(--color-text)] line-clamp-2 transition-colors duration-150 group-hover:text-[var(--color-accent-text)]">
        {opp.title}
      </h3>

      <div className="flex gap-1.5 flex-wrap mt-3">
        <span className={opportunityTypeBadgeClass(opp.type)}>{opportunityTypeLabel(opp.type)}</span>
        {opp.tags.slice(0, 2).map(({ tag }) => (
          <span key={tag.id} className="tag">{tag.name}</span>
        ))}
        {opp.tags.length > 2 && <span className="tag">+{opp.tags.length - 2}</span>}
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 mt-auto">
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] min-w-0">
          <Clock size={13} className="flex-shrink-0" aria-hidden="true" />
          {opp.deadline ? (
            <span className="truncate">
              {formatDeadline(opp.deadline)}
              {hint && (
                <span className={ds === 'closing' ? 'text-[var(--color-warn)] font-medium' : ''}>
                  {' · '}{hint.replace('Closes ', '')}
                </span>
              )}
            </span>
          ) : (
            <span>Rolling deadline</span>
          )}
        </p>
        <span className="flex items-center gap-0.5 text-[13px] font-semibold text-[var(--color-accent-text)] flex-shrink-0">
          Apply
          <ArrowUpRight
            size={14}
            className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
          {external && <span className="sr-only">(opens the employer&apos;s site in a new tab)</span>}
        </span>
      </div>
    </Link>
  )
}
