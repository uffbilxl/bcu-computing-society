'use client'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { CompanyLogo } from '@/components/ui/CompanyLogo'
import { CountUp } from '@/components/ui/CountUp'
import { formatDeadline, deadlineHint } from '@/lib/utils'
import { useStillOpen } from '@/hooks/useStillOpen'

export interface ClosingSoonItem {
  id: string
  title: string
  slug: string
  applyUrl: string | null
  deadline: Date
  company: { name: string; logo: string | null }
}

/* The hero is a navy band in both themes: it is the logo's own field, so
 * the page opens in the brand's colours whichever mode the visitor uses.
 * Text on it uses fixed on-navy values rather than theme tokens.
 *
 * The right-hand panel is the first useful thing a student sees — the next
 * deadlines — rather than decoration. Dates are always written out; the
 * "in N days" hint sits beside them, never instead of them. */
export function HeroContent({
  liveCount,
  closingSoon,
}: {
  liveCount: number
  closingSoon: ClosingSoonItem[]
}) {
  // Drops anything whose deadline passes while the cached page is served
  const live = useStillOpen(closingSoon).slice(0, 4)

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--navy)' }}>
      {/* A single soft light source behind the panel, in the logo's blue. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[10%] glow-drift"
        style={{
          background:
            'radial-gradient(45% 55% at 82% 32%, rgba(59,130,246,0.2) 0%, transparent 70%), radial-gradient(35% 45% at 10% 90%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,18,32,0) 60%, rgba(10,18,32,0.6) 100%)' }}
      />
      {/* Fine grid, echoing the logo's geometric letterforms */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(80% 80% at 30% 40%, #000 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(80% 80% at 30% 40%, #000 0%, transparent 75%)',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-12 lg:gap-16 items-center">
        <div>
          <p
            className="enter inline-flex items-center gap-2 h-8 px-3 rounded-full border border-white/15 bg-white/[0.04] text-[13px] font-medium text-[#C4CEDC]"
            style={{ '--i': 0 } as React.CSSProperties}
          >
            <span className="live-dot" aria-hidden="true" />
            {liveCount > 0
              ? <><CountUp value={liveCount} /> opportunities open right now</>
              : 'Birmingham City University'}
          </p>

          <h1
            className="enter mt-6 font-bold text-white"
            style={{ '--i': 1, fontSize: 'clamp(2.5rem, 1.6rem + 4vw, 4.5rem)', letterSpacing: '-0.035em', lineHeight: 1.02 } as React.CSSProperties}
          >
            Your computing <span style={{ color: '#5B9BFF' }}>community.</span>
          </h1>

          <p className="enter mt-6 text-[17px] sm:text-lg leading-relaxed text-[#A3B1C6] max-w-[46ch]" style={{ '--i': 2 } as React.CSSProperties}>
            From your first lecture to your first offer: internships, graduate
            roles, events, and a community built around every BCU computing student.
          </p>

          <div className="enter mt-8 flex flex-col sm:flex-row gap-3" style={{ '--i': 3 } as React.CSSProperties}>
            <Link href="/opportunities" className="group btn-primary btn-lg focus-ring">
              Explore opportunities
              <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/events" className="btn-on-navy btn-lg focus-ring">
              Upcoming events
            </Link>
          </div>

          <dl className="enter mt-10 flex flex-wrap gap-x-8 gap-y-3 text-[14px]" style={{ '--i': 4 } as React.CSSProperties}>
            {[
              ['5', 'divisions'],
              ['Free', 'for BCU students'],
            ].map(([value, label]) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dt className="sr-only">{label}</dt>
                <dd className="font-semibold text-white tabular-nums">{value}</dd>
                <dd className="text-[#8796AE]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Closing soon */}
        <div
          className="enter rounded-2xl border border-white/10 p-2 sm:p-3"
          style={{ '--i': 3, background: 'rgba(21,35,58,0.85)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between px-3 pt-2 pb-3">
            <h2 className="text-[15px] font-semibold text-white">Closing soon</h2>
            <Link
              href="/opportunities"
              className="text-[13px] font-medium text-[#8FBAFF] hover:text-white transition-colors rounded focus-ring"
            >
              See all
            </Link>
          </div>

          {live.length > 0 ? (
            <ul className="flex flex-col">
              {live.map((o, i) => {
                const hint = deadlineHint(o.deadline)
                const href = o.applyUrl || `/opportunities/${o.slug}`
                const external = Boolean(o.applyUrl)
                return (
                  <li key={o.id} className="enter" style={{ '--i': 4 + i } as React.CSSProperties}>
                    <Link
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.06] transition-colors focus-ring"
                    >
                      <span className="transition-transform duration-200 group-hover:scale-105">
                        <CompanyLogo name={o.company.name} logoUrl={o.company.logo} size={36} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-white truncate">{o.title}</p>
                        <p className="text-[13px] text-[#8796AE] truncate">{o.company.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-medium text-white tabular-nums">{formatDeadline(o.deadline)}</p>
                        {hint && <p className="text-[12px] text-[#FCD34D]">{hint.replace('Closes ', '')}</p>}
                      </div>
                      <ArrowUpRight
                        size={15}
                        className="text-[#8796AE] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0 hidden sm:block"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-3 pb-4 text-[14px] text-[#A3B1C6]">
              Nothing closes in the next few weeks. Browse everything that&apos;s open on the opportunities page.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
