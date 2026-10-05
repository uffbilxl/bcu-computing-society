import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Briefcase, Calendar, BookOpen, Users, UserPlus,
  GraduationCap, Handshake, ShieldOff, Linkedin, Instagram,
} from 'lucide-react'

const values = [
  {
    Icon: Users,
    title: 'Inclusive by design',
    text: 'BCUComputingSoc is open to every BCU computing student, regardless of year, background, or experience level. Whether you are just starting out or finishing your final year, there is a place for you here.',
  },
  {
    Icon: GraduationCap,
    title: 'Student-led, student-first',
    text: 'We are run entirely by students who have been in your position. Every decision we make is driven by what is genuinely useful to you, not what looks good on paper.',
  },
  {
    Icon: Handshake,
    title: 'Community over competition',
    text: 'We believe the tech industry is better when people support each other. We share opportunities openly, celebrate each other\'s wins, and build a network that lasts beyond graduation.',
  },
]

const whatWeDo = [
  {
    label: 'Opportunities',
    Icon: Briefcase,
    desc: 'We curate internships, placements, graduate schemes, spring weeks, and insight programmes from across the UK tech industry, keeping everything in one place so you never miss a role.',
    href: '/opportunities',
  },
  {
    label: 'Events',
    Icon: Calendar,
    desc: 'From industry panels and workshops to networking nights and hackathons, we run events throughout the year to help you build skills and connections that matter.',
    href: '/events',
  },
  {
    label: 'Career resources',
    Icon: BookOpen,
    desc: 'CV templates, cover letter guides, and practical career advice created specifically for computing students. Everything you need to put your best foot forward.',
    href: '/resources',
  },
  {
    label: 'A real community',
    Icon: Users,
    desc: 'Join a network of like-minded students at BCU. Share experiences, ask questions, find collaborators for projects, and support each other through the highs and lows of university life.',
    href: '/committee',
  },
]

export default function AboutPage() {
  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      <header className="max-w-[720px]">
        <h1 className="page-title enter">Who we are</h1>
        <p className="page-lede mt-3 enter" style={{ '--i': 1 } as React.CSSProperties}>
          BCUComputingSoc is the computing society at Birmingham City University. We exist to support, connect, and empower every student in the computing faculty.
        </p>
      </header>

      {/* Mission: the one statement on the page, in the brand's own colours */}
      <section
        aria-labelledby="mission"
        className="enter relative overflow-hidden mt-10 rounded-3xl border border-white/10 px-6 py-10 sm:px-12 sm:py-14"
        style={{ '--i': 2, background: 'var(--navy)' } as React.CSSProperties}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[20%] glow-drift"
          style={{ background: 'radial-gradient(40% 60% at 90% 10%, rgba(59,130,246,0.22) 0%, transparent 70%)' }}
        />
        <h2 id="mission" className="relative text-[14px] font-semibold text-[#8FBAFF]">Our mission</h2>
        <p
          className="relative mt-3 font-semibold text-white max-w-[30ch]"
          style={{ fontSize: 'clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem)', letterSpacing: '-0.025em', lineHeight: 1.2 }}
        >
          To make the path from BCU student to tech professional as clear, supported, and accessible as possible, for everyone.
        </p>
      </section>

      {/* What we do */}
      <section aria-labelledby="what-we-do" className="mt-16">
        <h2 id="what-we-do" className="reveal display-headline text-[26px] sm:text-[32px] mb-6">What we do</h2>
        <div className="reveal card grid sm:grid-cols-2 overflow-hidden">
          {whatWeDo.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex gap-4 p-5 sm:p-6 hover:bg-[var(--color-surface-hover)] transition-colors duration-150 focus-ring border-[var(--color-border-subtle)]
                ${i > 0 ? 'border-t' : ''} ${i === 1 ? 'sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:border-l' : ''}`}
            >
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}
              >
                <item.Icon size={18} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[16px] font-semibold text-[var(--color-text)]">{item.label}</span>
                  <ArrowRight
                    size={16}
                    className="text-[var(--color-muted-2)] group-hover:text-[var(--color-accent-text)] group-hover:translate-x-0.5 transition-all duration-150"
                    aria-hidden="true"
                  />
                </span>
                <span className="block mt-1.5 text-[14px] text-[var(--color-muted)] leading-relaxed">{item.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values" className="mt-16">
        <h2 id="values" className="reveal display-headline text-[26px] sm:text-[32px] mb-8">Our values</h2>
        <ul className="grid md:grid-cols-3 gap-8 md:gap-10">
          {values.map((v, i) => (
            <li key={v.title} className="reveal" style={{ '--i': i } as React.CSSProperties}>
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent-text)' }}
              >
                <v.Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">{v.title}</h3>
              <p className="mt-2 text-[15px] text-[var(--color-muted)] leading-relaxed">{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Position on defence */}
      <section
        aria-labelledby="position"
        className="reveal mt-16 flex gap-4 rounded-2xl border p-5 sm:p-6"
        style={{ background: 'var(--color-warn-dim)', borderColor: 'color-mix(in srgb, var(--color-warn) 28%, transparent)' }}
      >
        <ShieldOff size={20} className="flex-shrink-0 mt-0.5 text-[var(--color-warn)]" aria-hidden="true" />
        <div>
          <h2 id="position" className="text-[15px] font-semibold text-[var(--color-text)]">Our position</h2>
          <p className="mt-1.5 text-[15px] text-[var(--color-muted)] leading-relaxed max-w-[70ch]">
            We aim to share as many opportunities as possible, but we are selective about what we promote. We will not list roles from defence companies. We believe every student deserves access to opportunity, and we take seriously our responsibility in shaping what that looks like.
          </p>
        </div>
      </section>

      {/* Get involved */}
      <section aria-labelledby="get-involved" className="mt-16">
        <h2 id="get-involved" className="reveal display-headline text-[26px] sm:text-[32px] mb-6">Get involved</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="reveal card p-6 flex flex-col">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}>
              <Users size={18} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">Join BCUComputingSoc</h3>
            <p className="mt-1.5 text-[15px] text-[var(--color-muted)] leading-relaxed flex-1">
              Open to all BCU computing students. Follow us and stay up to date with everything we are doing.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="https://uk.linkedin.com/company/bcu-computing-society" target="_blank" rel="noopener noreferrer" className="btn-primary focus-ring">
                <Linkedin size={15} aria-hidden="true" />
                Follow on LinkedIn
              </Link>
              <Link href="https://www.instagram.com/bcucompsoc" target="_blank" rel="noopener noreferrer" className="btn-ghost focus-ring">
                <Instagram size={15} aria-hidden="true" />
                Follow on Instagram
              </Link>
            </div>
          </div>
          <div className="reveal card p-6 flex flex-col" style={{ '--i': 1 } as React.CSSProperties}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}>
              <UserPlus size={18} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--color-text)]">Join the committee</h3>
            <p className="mt-1.5 text-[15px] text-[var(--color-muted)] leading-relaxed flex-1">
              Want to help shape BCUComputingSoc? We are always looking for students to join the committee and contribute to what we build.
            </p>
            <div className="mt-5">
              <Link href="https://tally.so/r/681g7e" target="_blank" rel="noopener noreferrer" className="btn-primary focus-ring">
                Apply to join
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
