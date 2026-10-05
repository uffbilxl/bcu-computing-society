'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, FileText, FolderOpen, Rocket, ArrowUpRight, Menu, X, Linkedin } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Wordmark } from '@/components/ui/Wordmark'

/* "Resources" sits between Research and About as a dropdown (see below) */
const navLinks = [
  { href: '/',                  label: 'Home' },
  { href: '/opportunities',     label: 'Opportunities' },
  { href: '/sca-opportunities', label: 'Internal Roles' },
  { href: '/events',            label: 'Events' },
  { href: '/committee',         label: 'Committee' },
  { href: '/research',          label: 'Research' },
]
const navLinksAfterResources = [
  { href: '/about', label: 'About' },
]

const resourceLinks = [
  { href: '/cv-builder', label: 'CV Builder', desc: 'Build and download your CV', Icon: FileText, external: false },
  { href: '/resources',  label: 'Documents',  desc: 'Templates, guides and cheat sheets', Icon: FolderOpen, external: false },
  { href: 'https://sca-project-finder.vercel.app/', label: 'Project Marketplace', desc: 'Find and join student project teams', Icon: Rocket, external: true },
]

const JOIN_URL = 'https://uk.linkedin.com/company/bcu-computing-society'

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href))
}

const linkBase =
  'relative inline-flex items-center h-9 px-3 rounded-lg text-[14px] whitespace-nowrap transition-colors duration-150 focus-ring'
const linkIdle = 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
const linkActive = 'text-[var(--color-text)] font-medium'

/* The highlight is one element that moves between links (shared layoutId),
 * so changing page reads as the marker sliding to its new place. */
function ActivePill() {
  return (
    <motion.span
      layoutId="nav-active"
      className="absolute inset-0 rounded-lg bg-[var(--color-surface-2)]"
      style={{ zIndex: -1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 40 }}
    />
  )
}

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = isActive(pathname, href)
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${linkBase} isolate ${active ? linkActive : linkIdle}`}
    >
      {active && <ActivePill />}
      {label}
    </Link>
  )
}

/* Desktop dropdown for CV Builder, Documents and the Project Marketplace */
function ResourcesDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = resourceLinks.some(l => !l.external && isActive(pathname, l.href))

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${linkBase} isolate gap-1 ${active ? linkActive : linkIdle}`}
      >
        {active && <ActivePill />}
        Resources
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-1/2 -ml-36 mt-2 w-72 rounded-xl border p-1.5 origin-top"
          style={{
            zIndex: 'var(--z-dropdown)' as unknown as number,
            background: 'var(--dropdown-bg)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {resourceLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
              className="group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] focus-ring"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}
              >
                <l.Icon size={15} aria-hidden="true" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="flex items-center gap-1 text-[14px] font-medium text-[var(--color-text)]">
                  {l.label}
                  {l.external && <ArrowUpRight size={13} className="text-[var(--color-muted-2)]" aria-label="(opens in a new tab)" />}
                </span>
                <span className="text-[13px] text-[var(--color-muted)] mt-0.5">{l.desc}</span>
              </span>
            </Link>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Lock page scroll behind the open mobile menu
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const toggleClass =
    'w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors duration-150 focus-ring'

  return (
    <>
      <header
        className="sticky top-0 transition-[background-color,border-color] duration-200"
        style={{
          zIndex: 'var(--z-sticky)' as unknown as number,
          background: scrolled || mobileOpen ? 'var(--navbar-glass-bg)' : 'var(--navbar-glass-bg-top)',
          backdropFilter: scrolled ? 'saturate(160%) blur(14px)' : undefined,
          WebkitBackdropFilter: scrolled ? 'saturate(160%) blur(14px)' : undefined,
          borderBottom: `1px solid ${scrolled || mobileOpen ? 'var(--color-border-subtle)' : 'transparent'}`,
        }}
      >
        <nav
          className="max-w-[1200px] mx-auto flex items-center h-16 px-5 sm:px-8 gap-6"
          aria-label="Main navigation"
        >
          <Link href="/" className="flex-shrink-0 rounded-md focus-ring" aria-label="BCU Computing Society home">
            <Wordmark size="md" />
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(link => <NavLink key={link.href} {...link} pathname={pathname} />)}
            <ResourcesDropdown pathname={pathname} />
            {navLinksAfterResources.map(link => <NavLink key={link.href} {...link} pathname={pathname} />)}
          </div>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <ThemeToggle className={toggleClass} />
            <a href={JOIN_URL} target="_blank" rel="noopener noreferrer" className="btn-primary h-9 focus-ring">
              Join the society
            </a>
          </div>

          {/* Compact: theme + menu */}
          <div className="flex lg:hidden items-center gap-2 ml-auto">
            <ThemeToggle className={toggleClass} />
            <button
              onClick={() => setMobileOpen(o => !o)}
              className={toggleClass}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
      {mobileOpen && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-16 inset-x-0 bottom-0 lg:hidden overflow-y-auto"
          style={{ zIndex: 'var(--z-overlay)' as unknown as number, background: 'var(--mobile-menu-bg)' }}
        >
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-4 flex flex-col">
            {[...navLinks, ...navLinksAfterResources].map((link, i) => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  style={{ '--i': i } as React.CSSProperties}
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`fade-in flex items-center h-12 px-3 rounded-lg text-[16px] transition-colors ${
                    active
                      ? 'text-[var(--color-text)] font-semibold bg-[var(--color-surface-2)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

            <p className="mt-5 mb-1 px-3 text-[13px] font-semibold text-[var(--color-muted-2)]">Resources</p>
            {resourceLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 h-12 px-3 rounded-lg text-[16px] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <l.Icon size={17} className="flex-shrink-0 text-[var(--color-accent-text)]" aria-hidden="true" />
                {l.label}
                {l.external && <ArrowUpRight size={14} className="text-[var(--color-muted-2)]" aria-label="(opens in a new tab)" />}
              </Link>
            ))}

            <a
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-lg mt-6 w-full"
            >
              <Linkedin size={16} aria-hidden="true" />
              Join the society
            </a>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  )
}
