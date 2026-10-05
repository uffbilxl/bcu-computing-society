export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDeadline, opportunityTypeLabel } from '@/lib/utils'
import OpportunityActions from './OpportunityActions'

async function getOpportunities() {
  return prisma.opportunity.findMany({
    orderBy: { createdAt: 'desc' },
    include: { company: { select: { name: true } } },
  })
}

const statusColour: Record<string, string> = {
  OPEN: 'text-[var(--color-ok)]',
  CLOSING_SOON: 'text-[var(--color-warn)]',
  CLOSED: 'text-[var(--t4)]',
}

const statusDot: Record<string, string> = {
  OPEN: 'bg-green-600',
  CLOSING_SOON: 'bg-amber-600',
  CLOSED: 'bg-[var(--t4)]',
}

export default async function OpportunitiesAdminPage() {
  const opps = await getOpportunities()
  const open = opps.filter(o => o.status !== 'CLOSED').length

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.4px] text-[var(--t1)]">Opportunities</h1>
          <p className="text-[11px] text-[var(--t4)] mt-1">{open} active · {opps.length} total</p>
        </div>
        <Link
          href="/admin/opportunities/import"
          className="px-4 py-2 bg-[var(--t1)] text-[var(--bg)] text-[12px] font-semibold hover:opacity-80 transition-opacity"
        >
          Import CSV ↑
        </Link>
      </div>

      <div className="bg-[var(--bg2)] border border-[var(--b1)] overflow-hidden">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {[
                ['Role', '32%'],
                ['Company', '16%'],
                ['Type', '13%'],
                ['Deadline', '13%'],
                ['Status', '10%'],
                ['Actions', '16%'],
              ].map(([h, w]) => (
                <th key={h} className="px-4 py-2.5 text-left text-[9px] font-semibold text-[var(--t4)] uppercase tracking-widest border-b border-[var(--b1)]" style={{ width: w }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opps.map(opp => (
              <tr key={opp.id} className="border-b border-[var(--b1)] last:border-b-0 hover:bg-[var(--bg3)]">
                <td className="px-4 py-3 text-[12px] text-[var(--t1)] truncate" title={opp.title}>{opp.title}</td>
                <td className="px-4 py-3 text-[11px] text-[var(--t3)] truncate">{opp.company.name}</td>
                <td className="px-4 py-3 text-[11px] text-[var(--t3)]">{opportunityTypeLabel(opp.type)}</td>
                <td className="px-4 py-3 text-[11px] text-[var(--t3)]">{opp.deadline ? formatDeadline(opp.deadline) : 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] ${statusColour[opp.status]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot[opp.status]}`} />
                    {opp.status === 'OPEN' ? 'Open' : opp.status === 'CLOSING_SOON' ? 'Closing' : 'Closed'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <OpportunityActions id={opp.id} status={opp.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {opps.length === 0 && (
          <div className="py-12 text-center text-[12px] text-[var(--t4)]">
            No opportunities yet.{' '}
            <Link href="/admin/opportunities/import" className="text-[var(--t1)] hover:underline">Import a CSV</Link>
            {' '}or{' '}
            <Link href="/admin/seed" className="text-[var(--t1)] hover:underline">seed from static data</Link>.
          </div>
        )}
      </div>
    </div>
  )
}
