'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, FileText, FolderOpen, Rocket } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

/* "Resources" sits between Committee and About as a dropdown (see below) */
const navLinks = [
  { href: '/',                label: 'Home' },
  { href: '/opportunities',   label: 'Opportunities' },
  { href: '/sca-opportunities', label: 'Internal Roles' },
  { href: '/events',          label: 'Events' },
  { href: '/committee',       label: 'Committee' },
  { href: '/research',        label: 'Research' },
]
const navLinksAfterResources = [
  { href: '/about',           label: 'About' },
]

const resourceLinks = [
  { href: '/cv-builder', label: 'CV Builder', desc: 'Build & download your CV', Icon: FileText, external: false },
  { href: '/resources',  label: 'Documents',   desc: 'Templates, guides & cheat sheets', Icon: FolderOpen, external: false },
  { href: 'https://sca-project-finder.vercel.app/', label: 'Project Marketplace', desc: 'Find and join student project teams', Icon: Rocket, external: true },
]

/* Desktop dropdown for CV Builder + Documents, triggered from "Resources" */
function ResourcesDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = resourceLinks.some(l => pathname === l.href || pathname.startsWith(l.href))

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`relative flex items-center gap-1 px-3 py-2 rounded-md transition-colors duration-150 focus-ring group ${
          active ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
        style={{ fontSize: '0.8125rem', fontWeight: active ? 500 : 400 }}
      >
        Resources
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        {active && (
          <span className="absolute bottom-[4px] left-3 right-6 h-px bg-[var(--color-text)] origin-center" />
        )}
        {!active && (
          <span className="absolute bottom-[4px] left-3 right-6 h-px bg-[var(--color-muted)] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
        )}
      </button>

      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl border p-1.5 focus-ring"
          style={{
            background: 'var(--dropdown-bg)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderColor: 'var(--color-border-subtle)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          }}
        >
          {resourceLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
              className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/5 focus-ring"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)' }}
              >
                <l.Icon size={15} />
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] font-medium text-[var(--color-text)]">{l.label}</span>
                <span className="text-[11.5px] text-[var(--color-muted)] mt-0.5">{l.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [mobileResOpen, setMobileResOpen] = useState(false)
  const [scrolled, setScrolled]           = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 1)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileOpen(false); setMobileResOpen(false) }, [pathname])

  const glassStyle = scrolled
    ? {
        /* Apple's exact nav glass formula */
        background: 'var(--navbar-glass-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(var(--hairline-rgb),0.06)',
      }
    : {
        background: 'var(--navbar-glass-bg-top)',
        backdropFilter: 'saturate(180%) blur(0px)',
        WebkitBackdropFilter: 'saturate(180%) blur(0px)',
        borderBottom: '1px solid transparent',
      }

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-500"
        style={glassStyle}
      >
        <nav
          className="max-w-[1080px] mx-auto flex items-center h-12 px-6 sm:px-10"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex flex-col leading-none flex-shrink-0 mr-10 focus-ring rounded-sm"
          >
            <span
              className="font-bold tracking-tight text-[var(--color-text)]"
              style={{
                fontSize: '1rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              BCUComputingSoc
            </span>
            <span
              className="text-[var(--color-muted)]"
              style={{ fontSize: '0.5625rem', letterSpacing: '0.03em', marginTop: '1px' }}
            >
              Birmingham City University
            </span>
          </Link>

          {/* Desktop links — centered */}
          <div className="hidden md:flex items-center gap-0 flex-1 justify-center">
            {navLinks.map(link => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 rounded-md transition-colors duration-150 focus-ring group ${
                    active
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                  style={{ fontSize: '0.8125rem', fontWeight: active ? 500 : 400 }}
                >
                  {link.label}
                  {/* Underline slides from center */}
                  {active && (
                    <span
                      className="absolute bottom-[4px] left-3 right-3 h-px bg-[var(--color-text)] origin-center"
                      style={{ transform: 'scaleX(1)' }}
                    />
                  )}
                  {!active && (
                    <span
                      className="absolute bottom-[4px] left-3 right-3 h-px bg-[var(--color-muted)] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                    />
                  )}
                </Link>
              )
            })}
            <ResourcesDropdown pathname={pathname} />
            {navLinksAfterResources.map(link => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 rounded-md transition-colors duration-150 focus-ring group ${
                    active
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                  style={{ fontSize: '0.8125rem', fontWeight: active ? 500 : 400 }}
                >
                  {link.label}
                  {active && (
                    <span
                      className="absolute bottom-[4px] left-3 right-3 h-px bg-[var(--color-text)] origin-center"
                      style={{ transform: 'scaleX(1)' }}
                    />
                  )}
                  {!active && (
                    <span
                      className="absolute bottom-[4px] left-3 right-3 h-px bg-[var(--color-muted)] origin-center scale-x-0 group-hover:scale-x-100 transition-transform duration-200"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-auto">
            <ThemeToggle
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--b2)] transition-all duration-200 focus-ring"
            />
            <Link
              href="https://uk.linkedin.com/company/bcu-computing-society"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient px-4 py-1.5 rounded-full focus-ring"
              style={{ fontSize: '0.8125rem' }}
            >
              Join BCUComputingSoc
            </Link>
          </div>

          {/* Mobile: theme toggle + Join + hamburger */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <ThemeToggle
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-ring"
            />
            <Link
              href="https://uk.linkedin.com/company/bcu-computing-society"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient px-3 py-1.5 rounded-full focus-ring"
              style={{ fontSize: '0.75rem' }}
            >
              Join BCUComputingSoc
            </Link>
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-white/5 transition-colors focus-ring"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span
                className={`w-5 h-px bg-[var(--color-muted)] transition-all duration-200 origin-center ${
                  mobileOpen ? 'rotate-45 translate-y-[3px]' : ''
                }`}
              />
              <span
                className={`w-5 h-px bg-[var(--color-muted)] transition-all duration-200 ${
                  mobileOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-5 h-px bg-[var(--color-muted)] transition-all duration-200 origin-center ${
                  mobileOpen ? '-rotate-45 -translate-y-[3px]' : ''
                }`}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile fullscreen overlay */}
      {mobileOpen && (
        <div
          className="fixed top-12 inset-x-0 bottom-0 z-40 md:hidden flex flex-col overflow-y-auto"
          style={{
            background: 'var(--mobile-menu-bg)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderTop: '1px solid rgba(var(--hairline-rgb),0.06)',
          }}
        >
          <div className="px-6 py-6 flex flex-col gap-1">
            {navLinks.map(link => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-4 rounded-xl transition-colors text-[15px] font-medium ${
                    active
                      ? 'text-[var(--color-text)] bg-white/5'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Resources disclosure */}
            <button
              onClick={() => setMobileResOpen(o => !o)}
              aria-expanded={mobileResOpen}
              className={`flex items-center justify-between px-4 py-4 rounded-xl transition-colors text-[15px] font-medium ${
                resourceLinks.some(l => pathname === l.href || pathname.startsWith(l.href))
                  ? 'text-[var(--color-text)] bg-white/5'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
              }`}
            >
              Resources
              <ChevronDown size={16} className={`transition-transform duration-200 ${mobileResOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileResOpen && (
              <div className="flex flex-col gap-1 pl-4 pb-1">
                {resourceLinks.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    target={l.external ? '_blank' : undefined}
                    rel={l.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-colors"
                  >
                    <l.Icon size={15} className="flex-shrink-0" />
                    {l.label}
                  </Link>
                ))}
              </div>
            )}

            {navLinksAfterResources.map(link => {
              const active =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-4 rounded-xl transition-colors text-[15px] font-medium ${
                    active
                      ? 'text-[var(--color-text)] bg-white/5'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

          </div>
        </div>
      )}

    </>
  )
}
