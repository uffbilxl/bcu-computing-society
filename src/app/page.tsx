/* Data only actually changes via the 12-hourly scrape job or occasional
 * admin edits — force-dynamic meant re-querying Postgres on every single
 * visit (serverless cold-start + remote DB round trip = multi-second
 * loads). A short revalidation window keeps pages feeling instant for
 * almost every visitor while staying fresh well within that cadence. */
export const revalidate = 300

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FeaturedGrid } from '@/components/home/FeaturedGrid'
import { TickerBanner } from '@/components/home/TickerBanner'
import { HeroContent } from '@/components/home/HeroContent'
import { prominenceScore } from '@/lib/companyRanking'
import { openDeadlineFloor } from '@/lib/time'
import {
  Briefcase,
  Calendar,
  BookOpen,
  GraduationCap,
  Zap,
  Users,
  ArrowRight,
  FileText,
} from 'lucide-react'

/* Same reasoning as src/app/opportunities/page.tsx: a build-time prerender
 * must not be able to fail the deploy just because the database is briefly
 * unreachable (or, with a Sensitive DATABASE_URL, not exposed to the build at
 * all). Fall back to the empty state and let revalidation fill it in. */
async function getHomeData() {
  try {
    return await queryHomeData()
  } catch (err) {
    console.error('[home] prerender query failed, shipping empty and revalidating later:', err)
    return { featured: [], liveCount: 0, closingSoon: [] } as Awaited<ReturnType<typeof queryHomeData>>
  }
}

async function queryHomeData() {
  const all = await prisma.opportunity.findMany({
    // status !== CLOSED alone isn't enough — see src/app/opportunities/page.tsx
    /* Deliberately not filtered to featured: true. The featured rows were all
     * hand-added CSV imports that nothing could verify — no deadline, not from
     * a scraped source, and several on Workday, which blocks automated link
     * checking outright. A dead HP placement sat here for five months as a
     * result. Selecting from everything still live means the homepage inherits
     * the scrape's own maintenance: those rows are closed automatically when
     * they disappear from the aggregator or their link dies. featured now
     * boosts ranking (see prominenceScore below) instead of gating entry. */
    where: {
      status: { not: 'CLOSED' },
      OR: [{ deadline: null }, { deadline: { gte: openDeadlineFloor() } }],
    },
    include: {
      company: true,
      tags: { include: { tag: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  /* Recognisable UK employers first within each type, newest as tiebreaker.
   * An editorially featured row gets a boost rather than exclusive entry, so
   * curation still counts without being the only way onto the homepage. */
  const rank = (o: (typeof all)[number]) =>
    prominenceScore(o.company.name, o.location) + (o.featured ? 25 : 0)

  all.sort((a, b) => {
    const diff = rank(b) - rank(a)
    return diff !== 0 ? diff : +new Date(b.createdAt) - +new Date(a.createdAt)
  })

  // Round-robin across types for variety, fill until we have 6
  const typeOrder = ['INTERNSHIP', 'PLACEMENT', 'GRADUATE', 'SPRING_WEEK']
  const byType = typeOrder.map(t => all.filter(o => o.type === t))
  const featured: typeof all = []
  let round = 0
  while (featured.length < 6 && byType.some(arr => arr[round] !== undefined)) {
    for (const arr of byType) {
      if (arr[round] && featured.length < 6) featured.push(arr[round])
    }
    round++
  }

  /* Next deadlines for the hero panel: soonest first, six weeks out at
   * most so the panel never pads itself with distant dates. */
  const horizon = Date.now() + 42 * 24 * 60 * 60 * 1000
  const closingSoon = all
    .filter(o => o.deadline && +o.deadline <= horizon)
    .sort((a, b) => +a.deadline! - +b.deadline!)
    .slice(0, 5)
    .map(o => ({
      id: o.id,
      title: o.title,
      slug: o.slug,
      applyUrl: o.applyUrl,
      deadline: o.deadline!,
      company: { name: o.company.name, logo: o.company.logo },
    }))

  return { featured, liveCount: all.length, closingSoon }
}

/* ── Section utilities ────────────────────────────────────────── */
const SECTION = 'py-20 sm:py-24'
const INNER   = 'max-w-[1200px] mx-auto px-5 sm:px-8'

/* ── Data ─────────────────────────────────────────────────────── */
const strands = [
  { label: 'Opportunities',      desc: 'Internships, placements & graduate roles',   href: '/opportunities',                  Icon: Briefcase },
  { label: 'Events',             desc: 'Workshops, panels & networking nights',       href: '/events',                         Icon: Calendar },
  { label: 'Resources',          desc: 'CV templates, cover letters & guides',        href: '/resources',                      Icon: BookOpen },
  { label: 'Graduate Roles',     desc: 'Life after university starts here',           href: '/opportunities?type=GRADUATE',    Icon: GraduationCap },
  { label: 'Spring Weeks',       desc: 'First & second year programmes',              href: '/opportunities?type=SPRING_WEEK', Icon: Zap },
  { label: 'Meet the Committee', desc: 'The people behind the BCU Computing Society', href: '/committee',                      Icon: Users },
]

const pillars = [
  {
    title: 'Opportunities',
    body: 'Internships, placements, grad schemes and spring weeks, filtered for BCU computing students. No noise, no irrelevant listings.',
    Icon: Briefcase,
  },
  {
    title: 'Events & Community',
    body: 'Industry panels, workshops, hackathons and networking events. Build real connections alongside your degree.',
    Icon: Calendar,
  },
  {
    title: 'Career Support',
    body: 'CV templates, cover letter guides, and peer insights from BCU students who have already landed the role.',
    Icon: FileText,
  },
]

/* ── Page ─────────────────────────────────────────────────────── */
export default async function HomePage() {
  const { featured, liveCount, closingSoon } = await getHomeData()

  return (
    <div>
      <HeroContent liveCount={liveCount} closingSoon={closingSoon} />

      <TickerBanner />

      {/* ── Featured opportunities ─────────────────────────────── */}
      <section className={SECTION}>
        <div className={INNER}>
          <div className="reveal flex items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="display-headline text-[28px] sm:text-[36px]">Featured opportunities</h2>
              <p className="mt-2 text-[15px] text-[var(--color-muted)]">
                A spread of internships, placements, graduate roles and spring weeks open now.
              </p>
            </div>
            <Link href="/opportunities" className="btn-ghost hidden sm:inline-flex focus-ring">
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <FeaturedGrid opportunities={featured as any} />
          ) : (
            <div className="card py-16 px-6 text-center">
              <p className="text-[15px] font-medium text-[var(--color-text)]">Nothing featured right now</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                New roles are added twice a day. Browse every open listing in the meantime.
              </p>
              <Link href="/opportunities" className="btn-primary mt-5 focus-ring">Browse opportunities</Link>
            </div>
          )}

          <Link href="/opportunities" className="btn-ghost w-full mt-4 sm:hidden focus-ring">
            View all opportunities
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── What we offer ──────────────────────────────────────── */}
      <section className={`${SECTION} section-divider`} style={{ background: 'var(--color-surface)' }}>
        <div className={`${INNER} grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-20`}>
          <div className="reveal">
            <h2 className="display-headline text-[28px] sm:text-[40px] max-w-[16ch]">
              Everything a BCU computing student needs.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-muted)] max-w-[44ch]">
              Run by students, for students: the roles, the events and the support to get from first year to first job.
            </p>
          </div>

          <ul className="flex flex-col">
            {pillars.map(({ title, body, Icon }, i) => (
              <li
                key={title}
                style={{ '--i': i } as React.CSSProperties}
                className={`reveal flex gap-5 py-6 ${i > 0 ? 'border-t border-[var(--color-border-subtle)]' : 'pt-0 lg:pt-2'}`}
              >
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[18px] font-semibold text-[var(--color-text)]">{title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--color-muted)] max-w-[56ch]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Where to start ─────────────────────────────────────── */}
      <section className={`${SECTION} section-divider`}>
        <div className={INNER}>
          <h2 className="reveal display-headline text-[28px] sm:text-[36px] mb-8">Where do you want to start?</h2>

          <nav
            aria-label="Explore the site"
            className="reveal card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden"
          >
            {strands.map(({ label, desc, href, Icon }, i) => (
              <Link
                key={label}
                href={href}
                className={`group flex items-center gap-4 p-5 sm:p-6 transition-colors duration-150 hover:bg-[var(--color-surface-hover)] focus-ring
                  border-[var(--color-border-subtle)]
                  ${i > 0 ? 'border-t' : ''}
                  ${i === 1 ? 'sm:border-t-0' : ''}
                  ${i === 2 ? 'lg:border-t-0' : ''}
                  ${i % 2 === 1 ? 'sm:border-l lg:border-l-0' : ''}
                  ${i % 3 !== 0 ? 'lg:border-l' : ''}`}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-150"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent-text)' }}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[var(--color-text)]">{label}</span>
                  <span className="block text-[13px] text-[var(--color-muted)] mt-0.5">{desc}</span>
                </span>
                <ArrowRight
                  size={16}
                  className="text-[var(--color-muted-2)] group-hover:text-[var(--color-text)] group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ── Join CTA ───────────────────────────────────────────── */}
      <section className="pb-20 sm:pb-24">
        <div className={INNER}>
          <div
            className="reveal relative overflow-hidden rounded-3xl border border-white/10 px-6 py-14 sm:px-14 sm:py-20 text-center"
            style={{ background: 'var(--navy)' }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-[15%] glow-drift"
              style={{ background: 'radial-gradient(50% 60% at 50% 105%, rgba(59,130,246,0.26) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <h2
                className="font-bold text-white mx-auto"
                style={{ fontSize: 'clamp(2.25rem, 1.5rem + 3vw, 3.5rem)', letterSpacing: '-0.035em', lineHeight: 1.05 }}
              >
                You belong here.
              </h2>
              <p className="mt-5 mx-auto max-w-[48ch] text-[17px] leading-relaxed text-[#A3B1C6]">
                Whether you&apos;re in your first year or finishing your degree, the
                BCU Computing Society is built to support every step of your journey.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/opportunities" className="btn-primary btn-lg w-full sm:w-auto focus-ring">
                  Browse opportunities
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/events" className="btn-on-navy btn-lg w-full sm:w-auto focus-ring">
                  See events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
