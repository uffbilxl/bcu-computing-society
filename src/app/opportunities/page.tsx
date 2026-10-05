/* See src/app/page.tsx for why this isn't force-dynamic anymore. */
export const revalidate = 300

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { OpportunitiesClient } from '@/components/opportunities/OpportunitiesClient'
import { openDeadlineFloor } from '@/lib/time'

/* Prerendering at build time means the build needs a reachable database, so a
 * database that is merely unavailable *right then* fails the whole deploy —
 * which is what happens when DATABASE_URL is marked Sensitive in Vercel, since
 * sensitive variables are exposed at runtime but withheld during the build.
 *
 * Degrade instead of failing: ship the page empty and let the first
 * revalidation (300s) fill it in from a working runtime connection. A deploy
 * should never be blocked by transient database state. */
async function getOpportunities() {
  try {
    return await queryOpportunities()
  } catch (err) {
    console.error('[opportunities] prerender query failed, shipping empty and revalidating later:', err)
    return []
  }
}

function queryOpportunities() {
  return prisma.opportunity.findMany({
    // status !== CLOSED alone isn't enough — a listing whose deadline has
    // simply passed stays OPEN in the DB until something notices, but
    // shouldn't be shown (or offered to "apply" to) as if it still were.
    where: { status: { not: 'CLOSED' }, OR: [{ deadline: null }, { deadline: { gte: openDeadlineFloor() } }] },
    include: {
      company: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities()

  return (
    <Suspense>
      <OpportunitiesClient opportunities={opportunities as any} />
    </Suspense>
  )
}
