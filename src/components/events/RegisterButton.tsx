'use client'
interface Props {
  eventId: string
  disabled: boolean
  registrationUrl: string | null
}

/* Three states: full, a real registration link, or no link yet. The last
 * used to be a button that fired alert(); it now says so in place instead
 * of pretending to be an action. */
export function RegisterButton({ disabled, registrationUrl }: Props) {
  if (disabled) {
    return (
      <button disabled className="btn-sm btn-ghost" aria-disabled="true">
        Full
      </button>
    )
  }
  if (registrationUrl) {
    return (
      <a
        href={registrationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-sm btn-primary focus-ring"
      >
        Register
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    )
  }
  return (
    <span className="text-[13px] text-[var(--color-muted)] whitespace-nowrap">
      Registration opens soon
    </span>
  )
}
