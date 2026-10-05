/* Sitewide backdrop. Was a stack of indigo/purple radial washes; the
 * navy palette carries depth through surface steps instead, so this is a
 * flat theme-aware fill kept as a component so the layout doesn't change. */
export function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1, background: 'var(--color-bg)' }}
      aria-hidden="true"
    />
  )
}
