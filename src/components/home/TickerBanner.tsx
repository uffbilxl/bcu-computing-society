const companies = [
  'Google', 'Amazon', 'Apple', 'Cloudflare', 'Microsoft',
  'Quantinuum', 'Arm', 'DRW', 'IBM', 'Accenture',
  'Mastercard', 'Visa', 'TPP', 'G-Research',
]

const phrases = [
  'Internships & Placements',
  'Graduate Schemes',
  'Spring Weeks',
  'Career Events',
  'CV Templates',
  'From first year to first job',
  'Built by BCU students',
  'Community first',
]

const items: { text: string; isCompany: boolean }[] = companies.flatMap((c, i) => [
  { text: c, isCompany: true },
  { text: phrases[i % phrases.length], isCompany: false },
])

/* Decorative strip of employers students have reached through the society.
 * aria-hidden: it repeats, scrolls, and carries nothing a reader needs. */
export function TickerBanner() {
  const doubled = [...items, ...items]

  return (
    <div
      className="overflow-hidden py-4 select-none border-b border-[var(--color-border-subtle)] ticker-mask"
      style={{ background: 'var(--color-bg)' }}
      aria-hidden="true"
    >
      <div className="ticker-track flex whitespace-nowrap w-max items-center">
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`px-6 text-[14px] ${
              item.isCompany
                ? 'font-semibold text-[var(--color-text)] tracking-[-0.01em]'
                : 'text-[var(--color-muted-2)]'
            }`}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}
