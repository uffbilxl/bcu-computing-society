'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onClose: () => void
}

const perks = [
  'Organise events & workshops',
  'Grow the BCUComputingSoc community',
  'Build real leadership experience',
  'Network with industry professionals',
]

export function CommitteeModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative z-10 w-full max-w-[480px] rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'var(--card-gradient)',
            border: '1px solid rgba(var(--hairline-rgb),0.09)',
          }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--t4)', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(var(--hairline-rgb),0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t4)' }}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Icon */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>

          <p className="eyebrow mb-2">Get involved</p>
          <h2
            className="font-bold mb-3 leading-snug"
            style={{ fontSize: '1.25rem', color: 'var(--t1)', letterSpacing: '-0.02em' }}
          >
            Join the BCUComputingSoc Committee
          </h2>

          <p style={{ fontSize: '0.8125rem', color: 'var(--t2)', lineHeight: 1.65, marginBottom: '0.75rem' }}>
            The BCU Computing Society is always looking for passionate BCU computing
            students to join the committee and help shape the society.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--t3)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            Whether you're interested in organising events, managing social media, building tech
            projects, or leading sponsorship. There's a role for you.
          </p>

          {/* Perks list */}
          <div
            className="flex flex-col gap-2.5 p-4 rounded-xl mb-6"
            style={{ background: 'rgba(var(--hairline-rgb),0.03)', border: '1px solid rgba(var(--hairline-rgb),0.07)' }}
          >
            {perks.map((item, i) => (
              <motion.div
                key={item}
                className="flex items-center gap-2.5"
                style={{ fontSize: '0.8125rem', color: 'var(--t2)' }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.06, duration: 0.22, ease: 'easeOut' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--acc)' }}
                />
                {item}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://tally.so/r/681g7e"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient flex items-center justify-center gap-2 w-full py-3 rounded-xl"
            style={{ fontSize: '0.9375rem' }}
          >
            Apply now →
          </a>

          <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--b2)', marginTop: '0.75rem' }}>
            Takes less than 5 minutes · Open to all BCU computing students
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
