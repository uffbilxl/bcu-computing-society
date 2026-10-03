'use client'
import {
  useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback,
} from 'react'
import {
  Download, RotateCcw, Plus, Trash2, ChevronUp, ChevronDown,
  Check, X, ChevronRight, Sparkles,
} from 'lucide-react'
import {
  CVData, CVEntry, SectionKey, DEFAULT_CV, STORAGE_KEY, SECTION_TITLES,
  SUMMARY_MAX, BULLET_MAX, atsReport,
} from '@/lib/cv'
import { CVPreview, PAGE_W, PAGE_H, Density } from '@/components/cv/CVPreview'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

type EntrySectionKey = 'education' | 'experience' | 'extracurricular'

const ENTRY_LABELS: Record<EntrySectionKey, { org: string; role: string; dates: string }> = {
  education:       { org: 'University',   role: 'Degree',   dates: 'Years' },
  experience:      { org: 'Company',      role: 'Position', dates: 'Dates' },
  extracurricular: { org: 'Organisation', role: 'Role',     dates: 'Dates' },
}

/* ── Small form primitives ───────────────────────────────────── */

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function Card({
  title, note, onMoveUp, onMoveDown, children,
}: {
  title: string
  note?: string
  onMoveUp?: () => void
  onMoveDown?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
        {note && <span className="text-[11px] text-[var(--color-muted-2)]">{note}</span>}
        {(onMoveUp || onMoveDown) && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label={`Move ${title} up`}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-25 transition-colors focus-ring"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label={`Move ${title} down`}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-25 transition-colors focus-ring"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Bullet editor (suggestions live on the CV preview) ─────── */

function BulletEditor({
  bullet, onChange, onRemove,
}: {
  bullet: string
  onChange: (v: string) => void
  onRemove: () => void
}) {
  return (
    <div>
      <div className="flex items-start gap-2">
        <textarea
          className="input resize-none"
          rows={2}
          value={bullet}
          maxLength={BULLET_MAX}
          placeholder="What did you do, and what was the result?"
          onChange={e => onChange(e.target.value)}
        />
        <button
          onClick={onRemove}
          aria-label="Remove bullet point"
          className="mt-2 w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-muted-2)] hover:text-red-400 transition-colors focus-ring flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {bullet.length > BULLET_MAX * 0.75 && (
        <div className="text-right text-[10px] tabular-nums text-[var(--color-muted-2)] mt-1">
          {bullet.length}/{BULLET_MAX}
        </div>
      )}
    </div>
  )
}

/* ── Main client ─────────────────────────────────────────────── */

export function CVBuilderClient() {
  const [data, setData]       = useState<CVData>(DEFAULT_CV)
  const [loaded, setLoaded]   = useState(false)
  const [density, setDensity] = useState<Density>(0)
  const [fits, setFits]       = useState(true)
  const [view, setView]       = useState<'edit' | 'preview'>('edit')
  const [showAts, setShowAts] = useState(false)
  const [scale, setScale]     = useState(0.5)
  const [downloading, setDownloading] = useState(false)
  const [dismissedSugg, setDismissedSugg] = useState<Set<string>>(new Set())

  const innerRef     = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const dataKey = JSON.stringify(data)

  /* Load saved CV once on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.version === 1) setData(parsed)
      }
    } catch { /* corrupted save — fall back to template */ }
    setLoaded(true)
  }, [])

  /* Debounced autosave */
  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, dataKey) } catch { /* storage full/blocked */ }
    }, 400)
    return () => clearTimeout(t)
  }, [dataKey, loaded])

  /* Auto one-page fit: re-try from the roomiest density on every edit,
     escalate only while the page overflows. */
  useLayoutEffect(() => { setDensity(0) }, [dataKey])
  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    const overflow = el.scrollHeight > PAGE_H + 1
    if (overflow && density < 2) {
      setDensity((density + 1) as Density)
      return
    }
    setFits(!overflow)
  })

  /* Scale preview to its container */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / PAGE_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [view])

  const report = useMemo(() => atsReport(data, fits), [dataKey, fits]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Update helpers ──────────────────────────────────────── */

  const patch = useCallback((p: Partial<CVData>) => setData(d => ({ ...d, ...p })), [])

  const patchEntry = (section: EntrySectionKey, id: string, p: Partial<CVEntry>) =>
    setData(d => ({ ...d, [section]: d[section].map(e => (e.id === id ? { ...e, ...p } : e)) }))

  const addEntry = (section: EntrySectionKey) =>
    setData(d => ({
      ...d,
      [section]: [...d[section], { id: uid(), org: '', role: '', location: '', dates: '', bullets: [''] }],
    }))

  const removeEntry = (section: EntrySectionKey, id: string) =>
    setData(d => ({ ...d, [section]: d[section].filter(e => e.id !== id) }))

  const moveEntry = (section: EntrySectionKey, id: string, dir: -1 | 1) =>
    setData(d => {
      const arr = [...d[section]]
      const i = arr.findIndex(e => e.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, [section]: arr }
    })

  const moveSection = (key: SectionKey, dir: -1 | 1) =>
    setData(d => {
      const order = [...d.sectionOrder]
      const i = order.indexOf(key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= order.length) return d
      ;[order[i], order[j]] = [order[j], order[i]]
      return { ...d, sectionOrder: order }
    })

  const reset = () => {
    if (confirm('Reset the CV back to the BCUComputingSoc template? Your edits will be lost.')) {
      setData(DEFAULT_CV)
    }
  }

  /* Direct PDF download — @react-pdf/renderer is loaded on demand so the
     page itself stays light. Output is real text (ATS-parseable). */
  const downloadPdf = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const [{ pdf }, { CvPdfDoc }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/cv/CvPdfDoc'),
      ])
      const blob = await pdf(<CvPdfDoc data={data} density={density} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safe = (data.name || 'CV').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-')
      a.href = url
      a.download = `${safe || 'CV'}-CV.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* fall back to the browser print dialog if generation fails */
      window.print()
    } finally {
      setDownloading(false)
    }
  }

  const scoreColor = report.score >= 80 ? '#22c55e' : report.score >= 60 ? '#f59e0b' : '#ef4444'

  /* ── Section editors, rendered in CV order ───────────────── */

  const orderIndex = (key: SectionKey) => data.sectionOrder.indexOf(key)

  const entrySectionEditor = (section: EntrySectionKey) => {
    const labels = ENTRY_LABELS[section]
    const entries = data[section]
    const idx = orderIndex(section)
    return (
      <Card
        key={section}
        title={SECTION_TITLES[section]}
        note={entries.length === 0 ? 'Empty (hidden on the CV)' : undefined}
        onMoveUp={idx > 0 ? () => moveSection(section, -1) : undefined}
        onMoveDown={idx < data.sectionOrder.length - 1 ? () => moveSection(section, 1) : undefined}
      >
        <div className="flex flex-col gap-5">
          {entries.map((e, ei) => (
            <div key={e.id} className="rounded-xl border border-[var(--color-border-subtle)] p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={labels.org}  value={e.org}      onChange={v => patchEntry(section, e.id, { org: v })} />
                <Field label="Location"    value={e.location} onChange={v => patchEntry(section, e.id, { location: v })} />
                <Field label={labels.role} value={e.role}     onChange={v => patchEntry(section, e.id, { role: v })} />
                <Field label={labels.dates} value={e.dates}   onChange={v => patchEntry(section, e.id, { dates: v })} placeholder="e.g. Jun 2026 – Sep 2026" />
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <span className="label mb-0">Bullet points</span>
                {e.bullets.map((b, bi) => (
                  <BulletEditor
                    key={bi}
                    bullet={b}
                    onChange={v => patchEntry(section, e.id, { bullets: e.bullets.map((x, i) => (i === bi ? v : x)) })}
                    onRemove={() => patchEntry(section, e.id, { bullets: e.bullets.filter((_, i) => i !== bi) })}
                  />
                ))}
                <button
                  onClick={() => patchEntry(section, e.id, { bullets: [...e.bullets, ''] })}
                  className="self-start inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-ring rounded-md"
                >
                  <Plus size={12} /> Add bullet
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-1">
                <button
                  onClick={() => moveEntry(section, e.id, -1)}
                  disabled={ei === 0}
                  aria-label="Move entry up"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-muted-2)] hover:text-[var(--color-text)] disabled:opacity-25 transition-colors focus-ring"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveEntry(section, e.id, 1)}
                  disabled={ei === entries.length - 1}
                  aria-label="Move entry down"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-muted-2)] hover:text-[var(--color-text)] disabled:opacity-25 transition-colors focus-ring"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => removeEntry(section, e.id)}
                  className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted-2)] hover:text-red-400 transition-colors focus-ring rounded-md"
                >
                  <Trash2 size={12} /> Remove entry
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => addEntry(section)}
            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--color-muted)] border border-[var(--color-border-subtle)] rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-colors focus-ring"
          >
            <Plus size={13} /> Add {section === 'education' ? 'education' : section === 'experience' ? 'experience' : 'activity'}
          </button>
        </div>
      </Card>
    )
  }

  const sectionEditors: Record<SectionKey, React.ReactNode> = {
    summary: (
      <Card
        key="summary"
        title={SECTION_TITLES.summary}
        note="Optional (hidden when empty)"
        onMoveUp={orderIndex('summary') > 0 ? () => moveSection('summary', -1) : undefined}
        onMoveDown={orderIndex('summary') < data.sectionOrder.length - 1 ? () => moveSection('summary', 1) : undefined}
      >
        <textarea
          className="input resize-none"
          rows={3}
          maxLength={SUMMARY_MAX}
          value={data.summary}
          placeholder="2–4 lines: who you are, what you study, and what you're looking for."
          onChange={e => patch({ summary: e.target.value })}
        />
        <div className="mt-1 text-right text-[10px] tabular-nums text-[var(--color-muted-2)]">
          {data.summary.length}/{SUMMARY_MAX}
        </div>
      </Card>
    ),
    education: entrySectionEditor('education'),
    experience: entrySectionEditor('experience'),
    extracurricular: entrySectionEditor('extracurricular'),
    skills: (
      <Card
        key="skills"
        title={SECTION_TITLES.skills}
        onMoveUp={orderIndex('skills') > 0 ? () => moveSection('skills', -1) : undefined}
        onMoveDown={orderIndex('skills') < data.sectionOrder.length - 1 ? () => moveSection('skills', 1) : undefined}
      >
        <div className="flex flex-col gap-3">
          {data.skills.map(s => (
            <div key={s.id} className="flex items-start gap-2">
              <input
                className="input max-w-[160px]"
                value={s.label}
                aria-label="Row label"
                onChange={e => setData(d => ({ ...d, skills: d.skills.map(x => x.id === s.id ? { ...x, label: e.target.value } : x) }))}
              />
              <input
                className="input"
                value={s.value}
                aria-label="Row content"
                placeholder="Comma-separated list"
                onChange={e => setData(d => ({ ...d, skills: d.skills.map(x => x.id === s.id ? { ...x, value: e.target.value } : x) }))}
              />
              <button
                onClick={() => setData(d => ({ ...d, skills: d.skills.filter(x => x.id !== s.id) }))}
                aria-label="Remove row"
                className="mt-2 w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-muted-2)] hover:text-red-400 transition-colors focus-ring flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setData(d => ({ ...d, skills: [...d.skills, { id: uid(), label: 'Languages', value: '' }] }))}
            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--color-muted)] border border-[var(--color-border-subtle)] rounded-full hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-colors focus-ring"
          >
            <Plus size={13} /> Add row
          </button>
        </div>
      </Card>
    ),
  }

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12">

      {/* Header + toolbar */}
      <div className="mb-8 print:hidden">
        <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-[var(--color-text)]">
          BCUComputingSoc CV Builder
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-2 max-w-xl leading-relaxed">
          Build your CV. Land your opportunity. Completely free. Made by students, for students.
          The classic one-page, ATS-friendly template UK employers expect.
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-5">
          <button
            onClick={() => setShowAts(o => !o)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-border-subtle)] text-[13px] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)] transition-colors focus-ring"
            aria-expanded={showAts}
          >
            <span className="font-semibold tabular-nums" style={{ color: scoreColor }}>{report.score}</span>
            <span>ATS score</span>
            <ChevronRight size={13} className={`transition-transform ${showAts ? 'rotate-90' : ''}`} />
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] border ${
              fits
                ? 'text-emerald-400 border-emerald-400/25'
                : 'text-red-400 border-red-400/25'
            }`}
          >
            {fits ? <Check size={12} /> : <X size={12} />}
            {fits ? 'Fits on one page' : 'Over one page, trim some bullets'}
          </span>

          {report.hasDifferentiator && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] border text-[var(--color-accent)]"
              style={{ borderColor: 'rgba(99,102,241,0.3)' }}
              title="A section like Research, Projects, Certifications, or Leadership makes your CV stand out"
            >
              <Sparkles size={12} /> Differentiator section detected
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-ring"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="btn-gradient inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] focus-ring disabled:opacity-60"
            >
              <Download size={14} /> {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* ATS breakdown */}
        {showAts && (
          <div className="card p-5 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {report.checks.map(c => (
                <div key={c.label} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      c.ok ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'
                    }`}
                  >
                    {c.ok ? <Check size={10} /> : <X size={10} />}
                  </span>
                  <div>
                    <p className="text-[12.5px] text-[var(--color-text)] leading-snug">
                      {c.label}
                      <span className="ml-1.5 text-[10px] tabular-nums text-[var(--color-muted-2)]">
                        {c.points}/{c.max}
                      </span>
                    </p>
                    {!c.ok && <p className="text-[11px] text-[var(--color-muted)] leading-snug mt-0.5">{c.tip}</p>}
                  </div>
                </div>
              ))}
            </div>
            {report.repeatedStarts.length > 0 && (
              <p className="text-[11px] text-amber-400 mt-4">
                {report.repeatedStarts.length > 1 ? 'Several bullets start' : 'Three or more bullets start'} with
                “{report.repeatedStarts.join('”, “')}”. Vary your opening verbs.
              </p>
            )}
            {report.lengthWarnings.length > 0 && (
              <p className="text-[11px] text-amber-400 mt-2">
                {report.lengthWarnings.length} bullet{report.lengthWarnings.length > 1 ? 's are' : ' is'} too short or too long — check the highlighted ones on your CV.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mobile view switcher */}
      <div className="lg:hidden mb-6 print:hidden">
        <div className="inline-flex p-1 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          {(['edit', 'preview'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-medium transition-colors focus-ring ${
                view === v
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {v === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-8 items-start">

        {/* Editor column */}
        <div className={`flex-col gap-5 print:hidden ${view === 'edit' ? 'flex' : 'hidden'} lg:flex`}>
          <Card title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" value={data.name}     onChange={v => patch({ name: v })} />
              <Field label="Email"     value={data.email}    onChange={v => patch({ email: v })} />
              <Field label="Phone"     value={data.phone}    onChange={v => patch({ phone: v })} placeholder="+44 …" />
              <Field label="LinkedIn"  value={data.linkedin} onChange={v => patch({ linkedin: v })} placeholder="linkedin.com/in/…" />
              <Field label="GitHub (optional)"    value={data.github}    onChange={v => patch({ github: v })} placeholder="github.com/…" />
              <Field label="Portfolio (optional)" value={data.portfolio} onChange={v => patch({ portfolio: v })} placeholder="yoursite.co.uk" />
            </div>
          </Card>

          {data.sectionOrder.map(key => sectionEditors[key])}
        </div>

        {/* Preview column */}
        <div className={`cv-preview-pane lg:sticky lg:top-20 ${view === 'preview' ? 'block' : 'hidden'} lg:block`}>
          <div ref={containerRef} className="w-full">
            <div style={{ height: Math.ceil(PAGE_H * scale) }} className="overflow-hidden rounded-sm">
              <div
                className="cv-scale-wrapper"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: PAGE_W }}
              >
                <CVPreview
                  data={data}
                  density={density}
                  innerRef={innerRef}
                  uiScale={1 / Math.max(scale, 0.25)}
                  dismissed={dismissedSugg}
                  onDismiss={key => setDismissedSugg(prev => new Set(prev).add(key))}
                  onApplyVerb={(section, entryId, bulletIdx, verb) =>
                    setData(d => ({
                      ...d,
                      [section]: d[section].map(e =>
                        e.id === entryId
                          ? { ...e, bullets: e.bullets.map((b, i) => (i === bulletIdx ? `${verb} ${b.trimStart()}` : b)) }
                          : e
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[var(--color-muted-2)] mt-3 print:hidden">
            Download PDF saves your CV instantly as a real-text A4 file that ATS systems can read word for word.
            Your CV autosaves in this browser.
          </p>
        </div>
      </div>
    </div>
  )
}
