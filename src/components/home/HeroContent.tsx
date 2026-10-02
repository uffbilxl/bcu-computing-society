'use client'
import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      delay: i * 0.12,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

export function HeroContent() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const bgY      = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const opacity  = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const scale    = useTransform(scrollYProgress, [0, 0.55], [1, 0.97])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: 'var(--hero-bg)' }}
    >
      {/* Layered gradient light sources — background layer (parallax) */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Aurora sweep — slow horizontal colour shift */}
        <div className="hero-aurora absolute inset-0" />

        {/* Primary: indigo bloom from top-center */}
        <div
          className="hero-blob-1 absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(99,102,241,0.38) 0%, rgba(99,102,241,0.1) 35%, transparent 60%)',
          }}
        />
        {/* Secondary: purple glow — bottom-right */}
        <div
          className="hero-blob-2 absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 55% at 90% 75%, rgba(168,85,247,0.22) 0%, transparent 55%)',
          }}
        />
        {/* Tertiary: blue glow — bottom-left */}
        <div
          className="hero-blob-3 absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 8% 80%, rgba(59,130,246,0.16) 0%, transparent 55%)',
          }}
        />
        {/* Bottom-up fade */}
        <div
          className="absolute bottom-0 inset-x-0 h-48"
          style={{ background: 'linear-gradient(to top, var(--hero-fade-color), transparent)' }}
        />
        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--hero-grain) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </motion.div>

      {/* ── Content layer (moves faster = parallax depth) ── */}
      <motion.div
        style={{ y: contentY, opacity, scale }}
        className="relative z-10 flex flex-col items-center text-center px-6 sm:px-10 pt-24 pb-32 max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.span
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="eyebrow mb-8 tracking-[0.18em]"
        >
          BCU Computing Society
        </motion.span>

        {/* Display headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            fontSize: 'clamp(3.2rem, 9vw, 6.5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.04,
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            marginBottom: '1.75rem',
          }}
        >
          {/* "Your computing" — primary hero text */}
          <span style={{ color: 'var(--hero-text)' }}>Your computing</span>
          <br />
          {/* "community." — gradient for depth, theme-aware */}
          <span
            style={{
              background: 'var(--hero-gradient-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            community.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            fontWeight: 400,
            color: 'var(--hero-muted)',
            maxWidth: '520px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}
        >
          From your first lecture to your first offer: internships, graduate
          roles, events, and a community built around every BCU computing student.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="/opportunities"
            className="btn-gradient inline-flex items-center gap-2 px-7 py-3.5 rounded-full focus-ring"
            style={{ fontSize: '0.9375rem', boxShadow: '0 0 32px rgba(99,102,241,0.3)' }}
          >
            Explore Opportunities
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-7 py-3.5 font-medium rounded-full border transition-all duration-200 focus-ring"
            style={{
              fontSize: '0.9375rem',
              color: 'var(--hero-btn-text)',
              borderColor: 'rgba(var(--hero-btn-border-rgb),0.15)',
              background: 'rgba(var(--hero-btn-border-rgb),0.05)',
              backdropFilter: 'blur(12px)',
            }}
          >
            Upcoming Events
          </Link>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            marginTop: '2.5rem',
            fontSize: '11px',
            color: 'var(--hero-text)',
            maxWidth: '360px',
            lineHeight: 1.6,
          }}
        >
          Not affiliated with BCUSU, BCU Computer Science Society, or BCU
          Cyber Security Society.
        </motion.p>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={18} style={{ color: 'var(--hero-subtle)' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}
