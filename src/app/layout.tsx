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
import { Wordmark } from '@/components/ui/Wordmark'

export const metadata: Metadata = {
  // Absolute base for the link-preview image, so shared links show the logo
  metadataBase: new URL('https://bcucompsoc.com'),
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
  { href: '/sca-opportunities', label: 'Internal Roles' },
  { href: '/events', label: 'Events' },
  { href: '/committee', label: 'Committee' },
  { href: '/research', label: 'Research' },
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
      <body className="min-h-screen flex flex-col text-[var(--color-text)] antialiased">
        <AnimatedBackground />
        <Navbar />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>

        {/* Navy in both themes: the footer bookends every page in the logo's
            own colours, so its text uses fixed on-navy values. */}
        <footer style={{ background: 'var(--footer-gradient)' }} className="text-[#A3B1C6]">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 pt-14 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-10 pb-12">

              <div>
                <Link href="/" className="inline-block rounded-md focus-ring" aria-label="BCU Computing Society home">
                  <Wordmark size="lg" onNavy />
                </Link>
                <p className="mt-5 text-[15px] leading-relaxed max-w-[34ch]">
                  From your first lecture to your first offer. Run by students at Birmingham City University.
                </p>
                <div className="flex items-center gap-2 mt-6">
                  <a
                    href="https://uk.linkedin.com/company/bcu-computing-society"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="BCU Computing Society on LinkedIn"
                    className="w-10 h-10 rounded-lg border border-white/15 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors focus-ring"
                  >
                    <Linkedin size={17} aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.instagram.com/bcucompsoc"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="BCU Computing Society on Instagram"
                    className="w-10 h-10 rounded-lg border border-white/15 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors focus-ring"
                  >
                    <Instagram size={17} aria-hidden="true" />
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-white mb-4">Explore</p>
                <nav className="flex flex-col gap-2.5" aria-label="Footer">
                  {footerLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm hover:text-white transition-colors w-fit rounded focus-ring"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-white mb-4">Contact</p>
                <div className="flex flex-col gap-2.5">
                  <a
                    href="mailto:bilal.arshad2@mail.bcu.ac.uk"
                    className="text-sm hover:text-white transition-colors break-all w-fit rounded focus-ring"
                  >
                    bilal.arshad2@mail.bcu.ac.uk
                  </a>
                  <FooterReportIssue />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
              <span>© {new Date().getFullYear()} BCU Computing Society</span>
              <a
                href="https://www.keystonedigitalstrategy.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors rounded focus-ring"
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
