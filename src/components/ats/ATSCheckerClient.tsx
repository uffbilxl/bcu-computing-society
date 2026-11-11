'use client'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowRight, Check, ChevronDown, FileText, FileUp, Lightbulb, Loader2, Lock, RotateCcw, X,
} from 'lucide-react'
import { analyse } from '@/lib/ats/analyse'
import { extractDocx } from '@/lib/ats/extract-docx'
import { extractPdf, type PdfJs } from '@/lib/ats/extract-pdf'
import type { Check as AtsCheck, ExtractedDoc, Report } from '@/lib/ats/types'

const MAX_BYTES = 10 * 1024 * 1024

/* pdf.js is only fetched when someone actually drops a PDF, and once per
 * visit. Its worker is a static file kept in step by scripts/copy-pdf-worker. */
let pdfjsLoader: Promise<PdfJs> | null = null
function loadPdfJs(): Promise<PdfJs> {
  pdfjsLoader ??= import('pdfjs-dist/legacy/build/pdf.mjs').then(pdfjs => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    return pdfjs as unknown as PdfJs
  })
  pdfjsLoader.catch(() => { pdfjsLoader = null })
  return pdfjsLoader
}

async function readFile(file: File): Promise<ExtractedDoc> {
  const name = file.name.toLowerCase()
  if (file.size > MAX_BYTES) throw new Error('That file is over 10 MB. A CV should be well under 2 MB. Export it again without images.')
  if (name.endsWith('.doc')) throw new Error('That is the old Word format (.doc). Open it in Word and use Save As to make a .docx or a PDF, then try again.')
  const isPdf = name.endsWith('.pdf') || file.type === 'application/pdf'
  const isDocx = name.endsWith('.docx')
  if (!isPdf && !isDocx) throw new Error('Upload a PDF or a Word document (.docx). Those are the two formats employers ask for.')

  const data = new Uint8Array(await file.arrayBuffer())
  if (isDocx) {
    try { return extractDocx(data, file.name) }
    catch { throw new Error('That Word file could not be opened. It may be damaged. Try saving it again from Word.') }
  }
  try {
    return await extractPdf(await loadPdfJs(), data, file.name)
  } catch (err) {
    if (err instanceof Error && err.name === 'PasswordException') {
      throw new Error('That PDF is password-protected. An ATS cannot open it either. Export it again without a password.')
    }
    throw new Error('That PDF could not be opened. It may be damaged. Try exporting it again.')
  }
}

const BAND_COLOR: Record<Report['band'], string> = {
  strong: 'var(--color-ok)',
  good: 'var(--color-accent-text)',
  fair: 'var(--color-warn)',
  poor: 'var(--color-danger)',
}

/* ── Score ring ────────────────────────────────────────────── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  // Start empty so the stroke draws in once mounted
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score))
    return () => cancelAnimationFrame(id)
  }, [score])

  return (
    <div className="relative w-[132px] h-[132px] flex-shrink-0" role="img" aria-label={`ATS score: ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border-subtle)" strokeWidth="9" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-[38px] font-bold leading-none tabular-nums tracking-[-0.03em] text-[var(--color-text)]">{score}</span>
        <span className="text-[12px] text-[var(--color-muted)] mt-1">out of 100</span>
      </div>
    </div>
  )
}

/* ── One finding ───────────────────────────────────────────── */
function StatusIcon({ status }: { status: AtsCheck['status'] }) {
  const style = {
    pass: { bg: 'var(--color-ok-dim)', fg: 'var(--color-ok)' },
    warn: { bg: 'var(--color-warn-dim)', fg: 'var(--color-warn)' },
    fail: { bg: 'var(--color-danger-dim)', fg: 'var(--color-danger)' },
  }[status]
  const Icon = status === 'pass' ? Check : status === 'warn' ? AlertTriangle : X
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: style.bg, color: style.fg }}
      aria-hidden="true"
    >
      <Icon size={13} strokeWidth={2.5} />
    </span>
  )
}

function Finding({ check }: { check: AtsCheck }) {
  const lost = Math.round((check.max - check.points) * 10) / 10
  return (
    <li className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <StatusIcon status={check.status} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="text-[15px] font-semibold text-[var(--color-text)]">{check.label}</h3>
            {check.max === 0
              ? <span className="badge-gray">Tip</span>
              : <span className={check.status === 'fail' ? 'badge-red' : 'badge-amber'}>−{lost} {lost === 1 ? 'point' : 'points'}</span>}
          </div>
          <p className="text-[14px] leading-relaxed text-[var(--color-muted)] mt-1.5">{check.detail}</p>

          {check.evidence.length > 0 && (
            <ul className="mt-2.5 flex flex-col gap-1.5">
              {check.evidence.map((e, i) => (
                <li
                  key={i}
                  className="text-[13px] leading-snug text-[var(--color-text)] pl-3 border-l-2 border-[var(--color-border)] break-words"
                >
                  {e}
                </li>
              ))}
            </ul>
          )}

          {check.fix && (
            <p className="mt-3 flex items-start gap-2 text-[14px] leading-relaxed text-[var(--color-text)]">
              <Lightbulb size={15} className="mt-[3px] flex-shrink-0 text-[var(--color-accent-text)]" aria-hidden="true" />
              <span>{check.fix}</span>
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

/* ── What the parser pulled out ────────────────────────────── */
function ParsedRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-[var(--color-border-subtle)] last:border-b-0">
      <dt className="text-[13px] text-[var(--color-muted)] flex-shrink-0">{label}</dt>
      <dd className={`text-[13px] text-right min-w-0 break-words ${value ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-danger)]'}`}>
        {value ?? 'Not found'}
      </dd>
    </div>
  )
}

function Chips({ items, tone }: { items: string[]; tone: 'ok' | 'missing' }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <li key={item} className={tone === 'ok' ? 'badge-green' : 'badge-gray'}>{item}</li>
      ))}
    </ul>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export function ATSCheckerClient() {
  const [doc, setDoc] = useState<ExtractedDoc | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [job, setJob] = useState('')
  const [showPassed, setShowPassed] = useState(false)
  const [showText, setShowText] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Re-scoring is instant, but there's no need to do it on every keystroke
  const deferredJob = useDeferredValue(job)
  const report = useMemo(() => (doc ? analyse(doc, deferredJob) : null), [doc, deferredJob])

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      setDoc(await readFile(file))
      setShowPassed(false)
      setShowText(false)
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (err) {
      setDoc(null)
      setError(err instanceof Error ? err.message : 'That file could not be read.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [])

  const issues = useMemo(
    () => (report?.checks ?? [])
      .filter(c => c.status !== 'pass')
      // biggest losses first, then advice that carries no points
      .sort((a, b) => (b.max - b.points) - (a.max - a.points) || Number(a.max === 0) - Number(b.max === 0)),
    [report],
  )
  const passed = useMemo(() => (report?.checks ?? []).filter(c => c.status === 'pass'), [report])

  return (
    <div className="max-w-[1080px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      <header className="enter">
        <h1 className="page-title">ATS CV Checker</h1>
        <p className="page-lede mt-3">
          Most large employers put your CV through an applicant tracking system before a person reads it.
          Upload yours to see what the software would read, get a score out of 100, and find out exactly what to fix.
        </p>
      </header>

      {/* ── Upload ─────────────────────────────────────────── */}
      <section aria-label="Upload your CV" className="enter mt-8" style={{ '--i': 1 } as React.CSSProperties}>
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          className={`relative flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed px-6 cursor-pointer transition-colors duration-150 focus-within:ring-2 focus-within:ring-[var(--color-accent)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-bg)] ${
            doc ? 'py-6' : 'py-12 sm:py-14'
          } ${dragging ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={e => handleFile(e.target.files?.[0])}
            disabled={busy}
          />
          <span
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}
            aria-hidden="true"
          >
            {busy ? <Loader2 size={22} className="animate-spin" /> : <FileUp size={22} />}
          </span>
          <span className="text-[16px] font-semibold text-[var(--color-text)]">
            {busy ? 'Reading your CV…' : doc ? 'Check a different CV' : 'Drop your CV here, or click to choose a file'}
          </span>
          <span className="text-[14px] text-[var(--color-muted)] mt-1">PDF or Word (.docx), up to 10 MB</span>
        </label>

        <p className="mt-3 flex items-start gap-2 text-[13px] text-[var(--color-muted)]">
          <Lock size={13} className="mt-[3px] flex-shrink-0" aria-hidden="true" />
          Your CV never leaves your device. It is read and scored in your browser, and nothing is uploaded or stored.
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border px-4 py-3 text-[14px] text-[var(--color-text)] flex items-start gap-2.5"
            style={{ background: 'var(--color-danger-dim)', borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)' }}>
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-[var(--color-danger)]" aria-hidden="true" />
            {error}
          </p>
        )}
      </section>

      {/* ── Results ────────────────────────────────────────── */}
      <div ref={resultsRef} className="scroll-mt-20" aria-live="polite">
        {report && doc && (
          <div className="mt-10">
            {/* Score */}
            <section aria-label="Your score" className="card p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
                <ScoreRing score={report.score} color={BAND_COLOR[report.band]} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13px] text-[var(--color-muted)] min-w-0">
                    <FileText size={14} className="flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{doc.fileName}</span>
                  </p>
                  <h2 className="mt-1.5 text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] leading-tight text-[var(--color-text)]">
                    {report.verdict}
                  </h2>
                  {report.readable && (
                    <p className="text-[14px] text-[var(--color-muted)] mt-2">
                      {issues.filter(i => i.max > 0).length === 0
                        ? 'Every scored check passed.'
                        : `${issues.filter(i => i.max > 0).length} thing${issues.filter(i => i.max > 0).length === 1 ? '' : 's'} to fix, listed below with the biggest wins first.`}
                    </p>
                  )}
                </div>
              </div>

              {report.readable && (
                <dl className="mt-6 pt-5 border-t border-[var(--color-border-subtle)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-4">
                  {report.categories.map(cat => {
                    const share = cat.max ? cat.earned / cat.max : 0
                    const color = share >= 0.85 ? 'var(--color-ok)' : share >= 0.6 ? 'var(--color-warn)' : 'var(--color-danger)'
                    return (
                      <div key={cat.id}>
                        <dt className="text-[13px] text-[var(--color-muted)]">{cat.label}</dt>
                        <dd className="mt-1">
                          <span className="text-[15px] font-semibold tabular-nums text-[var(--color-text)]">
                            {Math.round(cat.earned)}<span className="text-[var(--color-muted-2)] font-normal">/{cat.max}</span>
                          </span>
                          <span className="block mt-1.5 h-1.5 rounded-full bg-[var(--color-border-subtle)] overflow-hidden" aria-hidden="true">
                            <span className="block h-full rounded-full" style={{ width: `${Math.round(share * 100)}%`, background: color }} />
                          </span>
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              )}
            </section>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
              {/* Findings */}
              <div className="min-w-0 flex flex-col gap-6">
                {issues.length > 0 && (
                  <section aria-labelledby="fix-title">
                    <h2 id="fix-title" className="text-[18px] font-semibold text-[var(--color-text)] mb-3">
                      {report.readable ? 'Fix these first' : 'What went wrong'}
                    </h2>
                    <ul className="card divide-y divide-[var(--color-border-subtle)]">
                      {issues.map(c => <Finding key={c.id} check={c} />)}
                    </ul>
                  </section>
                )}

                {passed.length > 0 && (
                  <section aria-labelledby="passed-title">
                    <button
                      onClick={() => setShowPassed(s => !s)}
                      aria-expanded={showPassed}
                      className="w-full flex items-center justify-between gap-3 rounded-xl px-1 py-1 text-left focus-ring"
                    >
                      <h2 id="passed-title" className="text-[18px] font-semibold text-[var(--color-text)]">
                        {passed.length} check{passed.length === 1 ? '' : 's'} passed
                      </h2>
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={`text-[var(--color-muted)] transition-transform duration-200 ${showPassed ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {showPassed && (
                      <ul className="card mt-3 divide-y divide-[var(--color-border-subtle)]">
                        {passed.map(c => (
                          <li key={c.id} className="flex items-start gap-3 p-4">
                            <StatusIcon status="pass" />
                            <div className="min-w-0">
                              <h3 className="text-[15px] font-medium text-[var(--color-text)]">{c.label}</h3>
                              <p className="text-[13px] leading-relaxed text-[var(--color-muted)] mt-0.5 break-words">{c.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {report.readable && report.score < 70 && (
                  <section className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-[var(--color-text)]">Quicker to start from a clean layout?</p>
                      <p className="text-[14px] text-[var(--color-muted)] mt-0.5">
                        The CV Builder produces a one-column, real-text PDF that passes every formatting check here.
                      </p>
                    </div>
                    <Link href="/cv-builder" className="group btn-primary focus-ring">
                      Open the CV Builder
                      <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </section>
                )}
              </div>

              {/* Side panel */}
              <aside className="min-w-0 flex flex-col gap-6 lg:sticky lg:top-20">
                {report.readable && (
                  <section aria-labelledby="parsed-title" className="card p-5">
                    <h2 id="parsed-title" className="text-[15px] font-semibold text-[var(--color-text)]">What an ATS reads</h2>
                    <p className="text-[13px] text-[var(--color-muted)] mt-1 mb-3">
                      The fields a parser would fill in from your file. Anything wrong here is wrong on the recruiter’s screen.
                    </p>
                    <dl>
                      <ParsedRow label="Name" value={report.parsed.name} />
                      <ParsedRow label="Email" value={report.parsed.email} />
                      <ParsedRow label="Phone" value={report.parsed.phone} />
                      <ParsedRow label="LinkedIn" value={report.parsed.linkedin} />
                      <ParsedRow label="Location" value={report.parsed.location} />
                      <ParsedRow
                        label="Sections"
                        value={report.parsed.sections.length ? report.parsed.sections.map(s => s.toLowerCase().replace(/^\w/, c => c.toUpperCase())).join(', ') : null}
                      />
                      <ParsedRow
                        label="Length"
                        value={`${report.parsed.pagesEstimated ? 'About ' : ''}${report.parsed.pages} page${report.parsed.pages === 1 ? '' : 's'}, ${report.parsed.words.toLocaleString('en-GB')} words`}
                      />
                    </dl>

                    {report.parsed.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[13px] text-[var(--color-muted)] mb-2">Skills it can search for ({report.parsed.skills.length})</p>
                        <Chips items={report.parsed.skills} tone="ok" />
                      </div>
                    )}
                  </section>
                )}

                {report.readable && (
                  <section aria-labelledby="job-title" className="card p-5">
                    <h2 id="job-title" className="text-[15px] font-semibold text-[var(--color-text)]">Match it to a job</h2>
                    <label htmlFor="job-text" className="block text-[13px] text-[var(--color-muted)] mt-1 mb-3">
                      Paste a job description to see which of its keywords your CV is missing. Optional.
                    </label>
                    <textarea
                      id="job-text"
                      value={job}
                      onChange={e => setJob(e.target.value)}
                      rows={5}
                      placeholder="Paste the job advert here…"
                      className="input resize-y text-[14px]"
                    />

                    {job.trim() && !report.jobMatch && (
                      <p className="text-[13px] text-[var(--color-muted)] mt-3">Paste a little more of the advert (the requirements section is the part that matters).</p>
                    )}

                    {report.jobMatch && (
                      <div className="mt-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[13px] text-[var(--color-muted)]">Keyword match</span>
                          <span className="text-[22px] font-bold tabular-nums text-[var(--color-text)]">{report.jobMatch.score}%</span>
                        </div>
                        <span className="block mt-1.5 h-1.5 rounded-full bg-[var(--color-border-subtle)] overflow-hidden" aria-hidden="true">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${report.jobMatch.score}%`,
                              background: report.jobMatch.score >= 70 ? 'var(--color-ok)' : report.jobMatch.score >= 45 ? 'var(--color-warn)' : 'var(--color-danger)',
                            }}
                          />
                        </span>

                        {report.jobMatch.missingSkills.length + report.jobMatch.missingTerms.length > 0 && (
                          <div className="mt-4">
                            <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">In the advert, not in your CV</p>
                            <Chips items={[...report.jobMatch.missingSkills, ...report.jobMatch.missingTerms]} tone="missing" />
                            <p className="text-[13px] leading-relaxed text-[var(--color-muted)] mt-2.5">
                              Add the ones you can genuinely back up, using the advert’s exact wording. Never add a skill you don’t have.
                            </p>
                          </div>
                        )}
                        {report.jobMatch.matchedSkills.length + report.jobMatch.matchedTerms.length > 0 && (
                          <div className="mt-4">
                            <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">Already matched</p>
                            <Chips items={[...report.jobMatch.matchedSkills, ...report.jobMatch.matchedTerms]} tone="ok" />
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {report.plainText && (
                  <section className="card p-5">
                    <button
                      onClick={() => setShowText(s => !s)}
                      aria-expanded={showText}
                      className="w-full flex items-center justify-between gap-3 text-left rounded focus-ring"
                    >
                      <span className="text-[15px] font-semibold text-[var(--color-text)]">See the raw text</span>
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`text-[var(--color-muted)] transition-transform duration-200 ${showText ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <p className="text-[13px] text-[var(--color-muted)] mt-1">
                      Your CV with the design stripped away, in the order software reads it. If it looks scrambled here, it is scrambled for the ATS.
                    </p>
                    {showText && (
                      <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-3 text-[12px] leading-relaxed text-[var(--color-text)] whitespace-pre-wrap break-words font-mono">
                        {report.plainText}
                      </pre>
                    )}
                  </section>
                )}

                <button onClick={() => inputRef.current?.click()} className="btn-ghost focus-ring">
                  <RotateCcw size={15} aria-hidden="true" />
                  Check another CV
                </button>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* ── How it works ───────────────────────────────────── */}
      <section aria-labelledby="how-title" className="reveal mt-16">
        <h2 id="how-title" className="text-[22px] font-bold tracking-[-0.02em] text-[var(--color-text)]">How the score works</h2>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'What an ATS actually does',
              body: 'It converts your file to plain text, sorts that text into fields (contact, education, experience, skills), then lets a recruiter search and rank candidates by keyword. If the conversion goes wrong, you are invisible in those searches.',
            },
            {
              title: 'What we score',
              body: 'Two things. Whether software can read your CV correctly: real text, one column, standard headings, consistent dates, contact details in plain sight. And whether what it reads is strong: action verbs, numbers, named skills, sensible length.',
            },
            {
              title: 'What it can’t tell you',
              body: 'There is no universal ATS score. Every employer configures their own system, and a person makes the final call. The “75% of CVs are auto-rejected” figure is a myth. A high score here means nothing is holding your CV back, not that the job is yours.',
            },
          ].map(item => (
            <div key={item.title} className="card p-5">
              <h3 className="text-[15px] font-semibold text-[var(--color-text)]">{item.title}</h3>
              <p className="text-[14px] leading-relaxed text-[var(--color-muted)] mt-1.5">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
