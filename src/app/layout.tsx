import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Link from 'next/link'
import { Linkedin, Instagram } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Toaster } from '@/components/ui/Toaster'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { PageTransition } from '@/components/layout/PageTransition'
import { FooterReportIssue } from '@/components/layout/FooterReportIssue'
import { themeInitScript } from '@/components/layout/ThemeToggle'

export const metadata: Metadata = {
  title: 'BCUComputingSoc - Birmingham City University Computing Society',
  description: 'From your first lecture to your first offer.',
  keywords: ['internship', 'placement', 'graduate', 'BCU', 'computing', 'tech', 'BCUComputingSoc'],
  icons: {
    icon: '/logo-navy.png',
    apple: '/logo-navy.png',
  },
  openGraph: {
    title: 'BCUComputingSoc - Birmingham City University Computing Society: From your first lecture to your first offer.',
    description: 'From your first lecture to your first offer.',
    type: 'website',
    images: [{ url: '/logo-navy.png', width: 1600, height: 1600, alt: 'BCUComputingSoc - Birmingham City University Computing Society' }],
  },
  twitter: {
    card: 'summary',
    title: 'BCUSCA - Student Computing Association: From your first lecture to your first offer.',
    description: 'From your first lecture to your first offer.',
    images: ['/logo-navy.png'],
  },
}

const footerLinks = [
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/events', label: 'Events' },
  { href: '/committee', label: 'Committee' },
  { href: '/cv-builder', label: 'CV Builder' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen text-[var(--color-text)] antialiased" style={{ background: 'transparent' }}>
        <AnimatedBackground />
        <Navbar />
        <main>
          <PageTransition>{children}</PageTransition>
        </main>

        <footer
          className="border-t border-[var(--color-border-subtle)]"
          style={{ background: 'var(--footer-gradient)' }}
        >
          <div className="max-w-[1280px] mx-auto px-6 sm:px-10 py-14">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

              {/* Logo + tagline */}
              <div>
                <div className="mb-4">
                  <span className="text-xl font-bold tracking-tight text-[var(--color-text)]">BCUComputingSoc</span>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">Birmingham City University</p>
                </div>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-[220px]">
                  From your first lecture to your first offer.
                </p>
                <div className="flex items-center gap-2 mt-5">
                  <a
                    href="https://uk.linkedin.com/company/bcu-computing-society"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="BCUComputingSoc on LinkedIn"
                    className="w-8 h-8 rounded-full border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-colors focus-ring"
                  >
                    <Linkedin size={15} aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.instagram.com/bcucompsoc"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="BCUComputingSoc on Instagram"
                    className="w-8 h-8 rounded-full border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-colors focus-ring"
                  >
                    <Instagram size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <p className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-5">Navigation</p>
                <nav className="flex flex-col gap-3">
                  {footerLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-widest mb-5">Contact</p>
                <div className="flex flex-col gap-3">
                  <a
                    href="mailto:bilal.arshad2@mail.bcu.ac.uk"
                    className="text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors break-all"
                  >
                    bilal.arshad2@mail.bcu.ac.uk
                  </a>
                  <FooterReportIssue />
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[var(--color-muted)] text-center sm:text-left">
                © 2026 BCUComputingSoc
              </span>
              <a
                href="https://www.keystonedigitalstrategy.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Made by Keystone
              </a>
            </div>
          </div>
        </footer>

        <Toaster />
      </body>
    </html>
  )
}
