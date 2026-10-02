import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/ui/FadeIn'

const values = [
  {
    title: 'Inclusive by design',
    text: 'BCUComputingSoc is open to every BCU computing student, regardless of year, background, or experience level. Whether you are just starting out or finishing your final year, there is a place for you here.',
  },
  {
    title: 'Student-led, student-first',
    text: 'We are run entirely by students who have been in your position. Every decision we make is driven by what is genuinely useful to you, not what looks good on paper.',
  },
  {
    title: 'Community over competition',
    text: 'We believe the tech industry is better when people support each other. We share opportunities openly, celebrate each other\'s wins, and build a network that lasts beyond graduation.',
  },
]

const whatWeDo = [
  {
    label: 'Opportunities',
    desc: 'We curate internships, placements, graduate schemes, spring weeks, and insight programmes from across the UK tech industry, keeping everything in one place so you never miss a role.',
    href: '/opportunities',
  },
  {
    label: 'Events',
    desc: 'From industry panels and workshops to networking nights and hackathons, we run events throughout the year to help you build skills and connections that matter.',
    href: '/events',
  },
  {
    label: 'Career resources',
    desc: 'CV templates, cover letter guides, and practical career advice created specifically for computing students. Everything you need to put your best foot forward.',
    href: '/resources',
  },
  {
    label: 'A real community',
    desc: 'Join a network of like-minded students at BCU. Share experiences, ask questions, find collaborators for projects, and support each other through the highs and lows of university life.',
    href: '/committee',
  },
]

export default function AboutPage() {
  return (
    <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14">

      {/* Header */}
      <FadeIn>
        <div className="mb-12">
          <span className="eyebrow mb-3">Birmingham City University</span>
          <h1
            className="text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-[var(--color-text)] mb-3"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Who We Are
          </h1>
          <p className="text-sm text-[var(--color-muted)] max-w-lg leading-relaxed">
            BCUComputingSoc is the computing society at Birmingham City University. We exist to support, connect, and empower every student in the computing faculty.
          </p>
        </div>
      </FadeIn>

      {/* Mission */}
      <FadeIn delay={0.05}>
        <section
          className="mb-12 p-6 sm:p-8 rounded-2xl border"
          style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
        >
          <span className="eyebrow mb-3">Our mission</span>
          <p className="text-[16px] sm:text-[18px] font-semibold text-[var(--color-text)] leading-relaxed">
            To make the path from BCU student to tech professional as clear, supported, and accessible as possible, for everyone.
          </p>
        </section>
      </FadeIn>

      {/* What we do */}
      <section className="mb-12">
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <span className="section-title">What we do</span>
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {whatWeDo.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex flex-col gap-2 p-5 rounded-2xl border transition-all duration-200 hover:border-[rgba(var(--hairline-rgb),0.14)]"
                style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {item.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-[var(--color-muted-2)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-[12px] text-[var(--color-muted)] leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Values */}
      <section className="mb-12">
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <span className="section-title">Our values</span>
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          </div>
        </FadeIn>
        <div className="flex flex-col gap-3">
          {values.map((v, i) => (
            <FadeIn key={v.title} delay={0.12 + i * 0.05}>
              <div
                className="flex gap-5 p-5 rounded-2xl border"
                style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
              >
                <div className="text-[11px] font-semibold text-[var(--color-accent)] tracking-widest pt-0.5 flex-shrink-0 w-6">
                  0{i + 1}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                    {v.title}
                  </div>
                  <div className="text-[12px] text-[var(--color-muted)] leading-relaxed">{v.text}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* A note on opportunities */}
      <FadeIn delay={0.1}>
        <section
          className="mb-12 p-5 rounded-2xl border border-l-2"
          style={{
            background: 'var(--amber-card-gradient)',
            borderColor: 'rgba(var(--hairline-rgb),0.07)',
            borderLeftColor: 'rgba(217,119,6,0.7)',
          }}
        >
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest mb-2 block">Our position</span>
          <p className="text-[13px] text-[var(--color-muted)] leading-relaxed">
            We aim to share as many opportunities as possible, but we are selective about what we promote. We will not list roles from defence companies. We believe every student deserves access to opportunity, and we take seriously our responsibility in shaping what that looks like.
          </p>
        </section>
      </FadeIn>

      {/* Get involved */}
      <section>
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <span className="section-title">Get involved</span>
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-5 rounded-2xl border"
              style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
            >
              <div className="text-[13px] font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                Join BCUComputingSoc
              </div>
              <p className="text-[12px] text-[var(--color-muted)] leading-relaxed mb-4">
                Open to all BCU computing students. Follow us and stay up to date with everything we are doing.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="https://uk.linkedin.com/company/bcu-computing-society"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-accent)] hover:underline focus-ring rounded"
                >
                  Follow on LinkedIn <ArrowRight size={12} aria-hidden="true" />
                </Link>
                <Link
                  href="https://www.instagram.com/bcucompsoc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-accent)] hover:underline focus-ring rounded"
                >
                  Follow on Instagram <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div
              className="p-5 rounded-2xl border"
              style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
            >
              <div className="text-[13px] font-semibold text-[var(--color-text)] mb-1.5" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                Join the committee
              </div>
              <p className="text-[12px] text-[var(--color-muted)] leading-relaxed mb-4">
                Want to help shape BCUComputingSoc? We are always looking for students to join the committee and contribute to what we build.
              </p>
              <Link
                href="https://tally.so/r/681g7e"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-accent)] hover:underline focus-ring rounded"
              >
                Apply here <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

    </div>
  )
}
