'use client'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { useStillOpen } from '@/hooks/useStillOpen'
import type { Opportunity } from '@/types'

/* Client-side so a role whose deadline passes while the cached homepage is
 * still being served drops out on its own. Cards reveal as they scroll in. */
export function FeaturedGrid({ opportunities }: { opportunities: Opportunity[] }) {
  const live = useStillOpen(opportunities)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {live.map((opp, i) => (
        <div key={opp.id} className="reveal flex" style={{ '--i': i % 3 } as React.CSSProperties}>
          <OpportunityCard opportunity={opp} />
        </div>
      ))}
    </div>
  )
}
