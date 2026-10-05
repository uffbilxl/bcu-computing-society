/* The society wordmark, set in type rather than shipped as an image so it
 * follows the theme: navy ink on light, white on dark. Mirrors the logo —
 * a heavy "BCU" with a tracked "COMPUTING SOCIETY", "SOCIETY" in brand blue.
 *
 * `onNavy` pins it to the white-on-navy treatment for the brand bands
 * (hero, footer), which are navy in both themes. */
export function Wordmark({
  size = 'md',
  onNavy = false,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  onNavy?: boolean
  className?: string
}) {
  const s = {
    sm: { bcu: 18, sub: 7.5, gap: 7 },
    md: { bcu: 22, sub: 8.5, gap: 8 },
    lg: { bcu: 34, sub: 12, gap: 12 },
  }[size]

  const ink = onNavy ? '#FFFFFF' : 'var(--color-text)'
  const blue = onNavy ? '#5B9BFF' : 'var(--color-accent-text)'

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap: s.gap }}
      aria-label="BCU Computing Society"
      role="img"
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: s.bcu,
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: ink,
        }}
      >
        BCU
      </span>
      <span
        aria-hidden="true"
        className="flex flex-col font-semibold uppercase"
        style={{ fontSize: s.sub, letterSpacing: '0.2em', lineHeight: 1.25 }}
      >
        <span style={{ color: ink }}>Computing</span>
        <span style={{ color: blue }}>Society</span>
      </span>
    </span>
  )
}
