/* Data only actually changes via the 12-hourly scrape job or occasional
 * admin edits — force-dynamic meant re-querying Postgres on every single
 * visit (serverless cold-start + remote DB round trip = multi-second
 * loads). A short revalidation window keeps pages feeling instant for
 * almost every visitor while staying fresh well within that cadence. */
export const revalidate = 300

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { OpportunityCard } from '@/components/opportunities/OpportunityCard'
import { TickerBanner } from '@/components/home/TickerBanner'
import { HeroContent } from '@/components/home/HeroContent'
import { StatsStrip } from '@/components/home/StatsStrip'
import { FadeIn } from '@/components/ui/FadeIn'
import { prominenceScore } from '@/lib/companyRanking'
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
    return { featured: [] } as Awaited<ReturnType<typeof queryHomeData>>
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
      OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
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

  return { featured }
}

/* ── Section utilities ────────────────────────────────────────── */
const SECTION_PAD = 'py-24 sm:py-32'
const INNER       = 'max-w-[1080px] mx-auto px-6 sm:px-10'

/* ── Data ─────────────────────────────────────────────────────── */
const strands = [
  { label: 'Opportunities',      desc: 'Internships, placements & graduate roles',   href: '/opportunities',              Icon: Briefcase },
  { label: 'Events',             desc: 'Workshops, panels & networking nights',       href: '/events',                     Icon: Calendar },
  { label: 'Resources',          desc: 'CV templates, cover letters & guides',        href: '/resources',                  Icon: BookOpen },
  { label: 'Graduate Roles',     desc: 'Life after university starts here',           href: '/opportunities?type=GRADUATE',    Icon: GraduationCap },
  { label: 'Spring Weeks',       desc: 'First & second year programmes',              href: '/opportunities?type=SPRING_WEEK', Icon: Zap },
  { label: 'Meet the Committee', desc: 'The people behind the BCUComputingSoc',                  href: '/committee',                  Icon: Users },
]

const pillars = [
  {
    num: '01',
    title: 'Opportunities',
    body: 'Internships, placements, grad schemes and spring weeks, filtered for BCU computing students. No noise, no irrelevant listings.',
    Icon: Briefcase,
  },
  {
    num: '02',
    title: 'Events & Community',
    body: 'Industry panels, workshops, hackathons and networking events. Build real connections alongside your degree.',
    Icon: Calendar,
  },
  {
    num: '03',
    title: 'Career Support',
    body: 'CV templates, cover letter guides, and peer insights from BCU students who have already landed the role.',
    Icon: FileText,
  },
]

/* ── Page ─────────────────────────────────────────────────────── */
export default async function HomePage() {
  const { featured } = await getHomeData()

  return (
    <div style={{ background: 'var(--color-bg)' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <HeroContent />

      {/* ── Stats strip ───────────────────────────────────────── */}
      <StatsStrip />

      {/* ── Ticker ────────────────────────────────────────────── */}
      <TickerBanner />

      {/* ── Featured Opportunities ────────────────────────────── */}
      <section
        className={`${SECTION_PAD} section-divider`}
        style={{
          background: 'var(--section-gradient-a)',
        }}
      >
        <div className={INNER}>

          {/* Section header */}
          <FadeIn>
            <div className="flex items-end justify-between mb-14">
              <div>
                <span className="eyebrow block mb-4">Handpicked</span>
                <h2
                  className="display-headline"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
                >
                  Featured Opportunities
                </h2>
              </div>
              <Link
                href="/opportunities"
                className="hidden sm:flex items-center gap-1.5 text-[var(--color-accent)] font-medium transition-opacity hover:opacity-70 focus-ring rounded-md"
                style={{ fontSize: '0.9375rem' }}
              >
                View all
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </FadeIn>

          {featured.length > 0 ? (
            <FadeIn delay={0.08}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map(opp => (
                  <OpportunityCard key={opp.id} opportunity={opp as any} showFeaturedBadge />
                ))}
              </div>
            </FadeIn>
          ) : (
            <FadeIn delay={0.08}>
              <div
                className="rounded-2xl py-20 text-center section-divider"
                style={{ background: 'var(--color-surface)' }}
              >
                <p className="text-sm text-[var(--color-muted)]">No featured opportunities yet.</p>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ── Three pillars ─────────────────────────────────────── */}
      <section
        className={`${SECTION_PAD} section-divider`}
        style={{
          background: 'var(--section-gradient-b)',
        }}
      >
        <div className={INNER}>
          <FadeIn>
            <div className="mb-16">
              <span className="eyebrow block mb-4">What we offer</span>
              <h2
                className="display-headline max-w-lg"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
              >
                Everything a BCU computing student needs.
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px"
            style={{ background: 'rgba(var(--hairline-rgb),0.06)' }}>
            {pillars.map(({ num, title, body, Icon }, i) => (
              <FadeIn key={title} delay={i * 0.1} className="h-full">
                <div
                  className="flex flex-col gap-5 p-8 sm:p-10 h-full"
                  style={{ background: 'var(--card-gradient)' }}
                >
                  {/* Muted number */}
                  <span
                    className="font-bold tabular-nums leading-none"
                    style={{
                      fontSize: '3.5rem',
                      color: 'var(--color-border)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {num}
                  </span>

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'var(--color-accent-dim)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </div>

                  <div>
                    <h3
                      className="font-semibold text-[var(--color-text)] mb-2"
                      style={{ fontSize: '1.125rem' }}
                    >
                      {title}
                    </h3>
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">{body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Where to start — navigation grid ─────────────────── */}
      <section
        className={`${SECTION_PAD} section-divider`}
        style={{
          background: 'var(--section-gradient-c)',
        }}
      >
        <div className={INNER}>
          <FadeIn>
            <div className="mb-14">
              <span className="eyebrow block mb-4">Explore</span>
              <h2
                className="display-headline"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
              >
                Where do you want to start?
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {strands.map(({ label, desc, href, Icon }, i) => (
              <FadeIn key={label} delay={i * 0.05}>
                <Link
                  href={href}
                  className="group flex items-start justify-between p-6 rounded-2xl border border-[rgba(var(--hairline-rgb),0.07)] hover:border-[rgba(99,102,241,0.3)] transition-all duration-300 focus-ring"
                  style={{
                    background: 'var(--card-gradient)',
                    transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)',
                  }}
                >
                  <div className="flex-1">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-colors"
                      style={{
                        background: 'var(--color-surface-2)',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <div
                      className="font-semibold text-[var(--color-text)] mb-1.5 group-hover:text-white transition-colors"
                      style={{ fontSize: '0.9375rem' }}
                    >
                      {label}
                    </div>
                    <div className="text-xs text-[var(--color-muted)] leading-relaxed">{desc}</div>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-[var(--color-muted-2)] group-hover:text-[var(--color-muted)] group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 ml-4 mt-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join CTA ──────────────────────────────────────────── */}
      <section
        className="section-divider relative overflow-hidden"
        style={{
          background: 'var(--section-gradient-d)',
        }}
      >
        {/* Strong indigo glow from bottom-center */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 110%, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 50%, transparent 70%)',
          }}
        />
        {/* Purple accent — top-right corner */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 40% 40% at 95% 0%, rgba(168,85,247,0.12) 0%, transparent 60%)',
          }}
        />

        <div className={`${SECTION_PAD} ${INNER} relative z-10 text-center`}>
          <FadeIn>
            <span className="eyebrow block mb-6">Join the community</span>
            <h2
              className="display-headline mx-auto mb-5"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                maxWidth: '640px',
              }}
            >
              You belong here.
            </h2>
            <p
              className="text-[var(--color-muted)] mx-auto mb-10 leading-relaxed"
              style={{ fontSize: '1.125rem', maxWidth: '460px' }}
            >
              Whether you're in your first year or finishing your degree, the
              BCUComputingSoc is built to support every step of your journey.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/opportunities"
                className="btn-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-full focus-ring"
                style={{ fontSize: '0.9375rem' }}
              >
                Browse opportunities
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-[var(--color-text)] font-medium rounded-full border border-[var(--color-border)] hover:border-[var(--b2)] hover:bg-[var(--color-surface)] transition-all duration-200 focus-ring"
                style={{ fontSize: '0.9375rem' }}
              >
                See events
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  )
}
