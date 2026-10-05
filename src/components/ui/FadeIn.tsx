/* Previously a scroll-triggered reveal. Content started at opacity 0 and
 * only appeared once an IntersectionObserver fired, so anything that didn't
 * scroll it into view (link previews, print, full-page captures, a fast
 * jump to an anchor) saw blank sections. Product pages load straight into
 * the task, so this now renders its children as-is; the API is kept so
 * existing call sites don't change. */
export function FadeIn({
  children,
  className,
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return <div className={className}>{children}</div>
}
