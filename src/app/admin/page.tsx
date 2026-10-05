export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { opportunityTypeLabel } from '@/lib/utils'

async function getAdminData() {
  const [oppCount, activeCount, recentOpps] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: { in: ['OPEN', 'CLOSING_SOON'] } } }),
    prisma.opportunity.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { company: true } }),
  ])
  return { oppCount, activeCount, recentOpps }
}

export default async function AdminDashboard() {
  const d = await getAdminData()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-black tracking-[-0.4px] text-[var(--t1)]">Dashboard</h1>
        <p className="text-[11px] text-[var(--t4)] mt-1">SCA Opportunities Tracker · Admin Panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { n: d.activeCount, l: 'Active listings' },
          { n: d.oppCount, l: 'Total opportunities' },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--bg2)] border border-[var(--b1)] p-4">
            <div className="font-display text-[26px] font-bold text-[var(--t1)] tracking-tight">{s.n}</div>
            <div className="text-[10px] font-mono text-[var(--t4)] uppercase tracking-widest mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/admin/opportunities/import" className="bg-[var(--t1)] text-[var(--bg)] p-4 hover:opacity-80 transition-opacity">
          <div className="font-display text-[14px] font-bold mb-1">Import CSV ↑</div>
          <div className="text-[11px] opacity-70">Add or update opportunities from a CSV file</div>
        </Link>
        <Link href="/admin/opportunities" className="bg-[var(--bg2)] border border-[var(--b1)] p-4 hover:bg-[var(--bg3)] transition-colors">
          <div className="font-display text-[14px] font-bold text-[var(--t1)] mb-1">Manage →</div>
          <div className="text-[11px] text-[var(--t4)]">View, close or delete individual listings</div>
        </Link>
      </div>

      {/* Recent */}
      <div className="bg-[var(--bg2)] border border-[var(--b1)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--b1)]">
          <span className="text-[12px] font-semibold text-[var(--t1)]">Recently added</span>
          <Link href="/admin/opportunities" className="text-[11px] font-mono text-[var(--t1)] hover:underline">View all →</Link>
        </div>

        {d.recentOpps.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[var(--t4)]">
            No opportunities yet.{' '}
            <Link href="/admin/opportunities/import" className="text-[var(--t1)] hover:underline">Import a CSV</Link> to get started.
          </div>
        ) : (
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {[['Role', '38%'], ['Company', '22%'], ['Type', '18%'], ['Status', '22%']].map(([h, w]) => (
                  <th key={h} className="px-4 py-2 text-left text-[9px] font-semibold text-[var(--t4)] uppercase tracking-widest border-b border-[var(--b1)]" style={{ width: w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.recentOpps.map(opp => (
                <tr key={opp.id} className="border-b border-[var(--b1)] last:border-b-0 hover:bg-[var(--bg3)]">
                  <td className="px-4 py-3 text-[12px] text-[var(--t1)] truncate">{opp.title}</td>
                  <td className="px-4 py-3 text-[11px] text-[var(--t3)] truncate">{opp.company.name}</td>
                  <td className="px-4 py-3 text-[11px] text-[var(--t3)]">{opportunityTypeLabel(opp.type)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono ${opp.status === 'OPEN' ? 'text-[var(--color-ok)]' : opp.status === 'CLOSING_SOON' ? 'text-[var(--color-warn)]' : 'text-[var(--t4)]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${opp.status === 'OPEN' ? 'bg-green-600' : opp.status === 'CLOSING_SOON' ? 'bg-amber-600' : 'bg-[var(--t4)]'}`} />
                      {opp.status === 'OPEN' ? 'Open' : opp.status === 'CLOSING_SOON' ? 'Closing' : 'Closed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
