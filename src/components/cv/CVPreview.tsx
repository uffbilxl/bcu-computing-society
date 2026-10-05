'use client'
import { RefObject, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import {
  CVData, CVEntry, SectionKey, SECTION_TITLES, ACTION_VERBS,
  startsWithActionVerb, findWeakPhrases, bulletLengthIssue,
} from '@/lib/cv'

/* A4 at 96dpi */
export const PAGE_W = 794
export const PAGE_H = 1123

export type Density = 0 | 1 | 2

/* Spacing/type scale per density level — level rises only when content
   would overflow the page, mimicking "auto one-page optimisation". */
const D = [
  { font: 12.5, lh: 1.45, sectionGap: 18, entryGap: 11, bulletGap: 3, namePt: 30, padY: 54, padX: 62 },
  { font: 12,   lh: 1.34, sectionGap: 13, entryGap: 8,  bulletGap: 2, namePt: 28, padY: 46, padX: 58 },
  { font: 11.5, lh: 1.26, sectionGap: 10, entryGap: 6,  bulletGap: 1, namePt: 26, padY: 38, padX: 54 },
] as const

type SuggestSection = 'experience' | 'extracurricular'

interface Props {
  data: CVData
  density: Density
  innerRef: RefObject<HTMLDivElement>
  /* Optional in-template suggestions */
  uiScale?: number
  dismissed?: Set<string>
  onDismiss?: (key: string) => void
  onApplyVerb?: (section: SuggestSection, entryId: string, bulletIdx: number, verb: string) => void
}

function hasEntries(entries: CVEntry[]) {
  return entries.some(e => e.org.trim() || e.role.trim() || e.bullets.some(b => b.trim()))
}

export function CVPreview({
  data, density, innerRef, uiScale = 1, dismissed, onDismiss, onApplyVerb,
}: Props) {
  const d = D[density]
  const [openKey, setOpenKey] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  /* Click anywhere off the popover closes it */
  useEffect(() => {
    if (!openKey) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpenKey(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openKey])

  const suggestionsOn = !!(dismissed && onDismiss)

  const contactParts = [data.email, data.phone, data.linkedin, data.github, data.portfolio]
    .map(s => s.trim())
    .filter(Boolean)

  const sectionVisible: Record<SectionKey, boolean> = {
    summary: data.summary.trim().length > 0,
    education: hasEntries(data.education),
    experience: hasEntries(data.experience),
    extracurricular: hasEntries(data.extracurricular),
    skills: data.skills.some(s => s.value.trim()),
  }

  const sectionTitle = (key: SectionKey) => (
    <h2
      style={{
        fontSize: d.font + 1,
        fontWeight: 700,
        textTransform: 'uppercase',
        textDecoration: 'underline',
        textUnderlineOffset: 2,
        marginTop: d.sectionGap,
        marginBottom: Math.max(4, d.entryGap - 3),
        letterSpacing: '0.02em',
      }}
    >
      {SECTION_TITLES[key]}
    </h2>
  )

  /* One flagged-bullet popover: stacks whichever notes apply (weak wording,
     length outlier, weak opening) plus verb chips. Counter-scaled so it
     stays readable inside the shrunk preview. */
  const suggestionPopover = (
    key: string, section: SuggestSection, entryId: string, bulletIdx: number,
    weak: string[], needsVerb: boolean, lengthIssue: 'short' | 'long' | null, seed: number,
  ) => {
    const verbs = [0, 1, 2].map(i => ACTION_VERBS[(seed * 3 + i * 7) % ACTION_VERBS.length])
    const notes: React.ReactNode[] = []
    if (weak.length > 0) {
      notes.push(<>Weak wording: <em style={{ color: '#f59e0b' }}>“{weak[0]}”</em>. Describe a specific action and its outcome.</>)
    }
    if (lengthIssue === 'short') {
      notes.push(<>This bullet looks too vague — add more detail about what you did and the result.</>)
    } else if (lengthIssue === 'long') {
      notes.push(<>This bullet is quite long — consider splitting it or trimming it down.</>)
    }
    if (needsVerb && weak.length === 0) {
      notes.push(<>This bullet starts weakly. Try opening with an action verb:</>)
    }
    return (
      <div
        ref={popoverRef}
        className="cv-sugg"
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: 0,
          top: '100%',
          zIndex: 20,
          transform: `scale(${uiScale})`,
          transformOrigin: 'top left',
          width: 280,
          background: '#16161f',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '10px 12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
          fontFamily: 'var(--font-geist-sans), -apple-system, sans-serif',
          fontSize: 12,
          lineHeight: 1.45,
          color: '#d6d6dc',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notes.map((note, i) => <p key={i} style={{ margin: 0 }}>{note}</p>)}
          </div>
          <button
            onClick={() => setOpenKey(null)}
            aria-label="Close suggestion"
            style={{ background: 'none', border: 0, color: '#86868b', cursor: 'pointer', padding: 2 }}
          >
            <X size={12} />
          </button>
        </div>
        {needsVerb && weak.length === 0 && onApplyVerb && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {verbs.map(v => (
              <button
                key={v}
                onClick={() => { onApplyVerb(section, entryId, bulletIdx, v); setOpenKey(null) }}
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 999,
                  border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.12)',
                  color: '#a5a7f7', cursor: 'pointer',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => { onDismiss?.(key); setOpenKey(null) }}
          style={{
            marginTop: 8, fontSize: 11, background: 'none', border: 0,
            color: '#86868b', cursor: 'pointer', padding: 0, textDecoration: 'underline',
          }}
        >
          Ignore this suggestion
        </button>
      </div>
    )
  }

  const bulletItem = (
    b: string, i: number, e: CVEntry, section: SectionKey,
  ) => {
    const canSuggest = suggestionsOn && (section === 'experience' || section === 'extracurricular')
    const weak = canSuggest ? findWeakPhrases(b) : []
    const needsVerb = canSuggest && b.trim().length > 0 && !startsWithActionVerb(b)
    const lengthIssue = canSuggest ? bulletLengthIssue(b) : null
    const key = `${e.id}:${i}:${b}`
    const flagged = canSuggest && (weak.length > 0 || needsVerb || lengthIssue !== null) && !dismissed?.has(key)

    return (
      <li key={i} style={{ marginBottom: d.bulletGap, position: 'relative' }}>
        {flagged ? (
          <span
            className="cv-flag"
            onMouseDown={ev => { ev.stopPropagation(); setOpenKey(openKey === key ? null : key) }}
            style={{
              cursor: 'pointer',
              background: 'rgba(245,158,11,0.13)',
              borderBottom: '1.5px dashed #d97706',
            }}
            title="Suggestion available, click to view"
          >
            {b}
          </span>
        ) : (
          b
        )}
        {flagged && openKey === key && suggestionPopover(
          key, section as SuggestSection, e.id, i, weak, needsVerb, lengthIssue,
          e.id.length + i,
        )}
      </li>
    )
  }

  const entryBlock = (e: CVEntry, last: boolean, section: SectionKey) => (
    <div key={e.id} style={{ marginBottom: last ? 0 : d.entryGap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 700 }}>{e.org}</span>
        <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{e.location}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontStyle: 'italic' }}>{e.role}</span>
        <span style={{ whiteSpace: 'nowrap' }}>{e.dates}</span>
      </div>
      <ul style={{ margin: `${d.bulletGap}px 0 0`, paddingLeft: 22, listStyleType: 'disc' }}>
        {e.bullets.map((b, i) => (b.trim() ? bulletItem(b, i, e, section) : null))}
      </ul>
    </div>
  )

  const renderSection = (key: SectionKey) => {
    if (!sectionVisible[key]) return null
    switch (key) {
      case 'summary':
        return (
          <section key={key}>
            {sectionTitle(key)}
            <p>{data.summary}</p>
          </section>
        )
      case 'education':
      case 'experience':
      case 'extracurricular': {
        const entries = data[key].filter(e => e.org.trim() || e.role.trim() || e.bullets.some(b => b.trim()))
        return (
          <section key={key}>
            {sectionTitle(key)}
            {entries.map((e, i) => entryBlock(e, i === entries.length - 1, key))}
          </section>
        )
      }
      case 'skills':
        return (
          <section key={key}>
            {sectionTitle(key)}
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {data.skills.filter(s => s.value.trim()).map(s => (
                  <tr key={s.id}>
                    <td style={{ fontStyle: 'italic', paddingRight: 18, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      {s.label}:
                    </td>
                    <td>{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
    }
  }

  return (
    <div
      id="cv-print-area"
      style={{
        width: PAGE_W,
        minHeight: PAGE_H,
        background: '#ffffff',
        color: '#000000',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        fontSize: d.font,
        lineHeight: d.lh,
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}
    >
      <div ref={innerRef} style={{ padding: `${d.padY}px ${d.padX}px` }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: d.namePt, fontWeight: 400, letterSpacing: '0.04em', lineHeight: 1.15 }}>
            {data.name || 'YOUR NAME'}
          </h1>
          {contactParts.length > 0 && (
            <p style={{ marginTop: 2 }}>{contactParts.join(' | ')}</p>
          )}
        </div>

        {data.sectionOrder.map(renderSection)}
      </div>
    </div>
  )
}
