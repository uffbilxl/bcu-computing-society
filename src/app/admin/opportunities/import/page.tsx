'use client'
import { useState, useRef } from 'react'

type ImportResult = {
  added: number
  updated: number
  closed: number
  skipped: number
  errors: string[]
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/admin/opportunities/import', {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Import failed')
      } else {
        setResult(data)
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-[20px] font-black tracking-[-0.4px] text-[var(--t1)]">Import CSV</h1>
        <p className="text-[12px] text-[var(--t4)] mt-1">
          Upload a CSV file to add new opportunities, close expired ones, and remove duplicates. Changes go live instantly.
        </p>
      </div>

      {/* Format guide */}
      <div className="bg-[var(--bg2)] border border-[var(--b1)] p-5 mb-5">
        <div className="text-[10px] font-semibold text-[var(--t4)] uppercase tracking-widest mb-3">Expected columns</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {[
            ['Title', 'Required, role name'],
            ['Company', 'Required, company name'],
            ['Type', 'INTERNSHIP / PLACEMENT / GRADUATE / SPRING_WEEK / INSIGHT'],
            ['Location', 'e.g. London or United Kingdom'],
            ['Work Mode', 'REMOTE / HYBRID / ONSITE (default: HYBRID)'],
            ['Apply URL', 'Full URL to application page'],
            ['Status', 'OPEN / CLOSING_SOON / CLOSED (default: OPEN)'],
            ['Description', 'Optional, auto-generated if blank'],
            ['Start Date', 'Optional, e.g. Summer 2026'],
            ['Deadline', 'Optional, e.g. 2026-08-31'],
            ['Featured', 'Optional, true / false'],
            ['Sponsored', 'Optional, true / false'],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-2">
              <span className="text-[11px] font-semibold text-[var(--t2)] min-w-[80px]">{col}</span>
              <span className="text-[11px] text-[var(--t4)]">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[var(--t4)] mt-3 pt-3 border-t border-[var(--b1)]">
          Column names are matched flexibly. Casing and spacing don&apos;t matter. Duplicate rows (same Apply URL) are skipped automatically.
        </p>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="bg-[var(--bg2)] border border-[var(--b1)] p-5 space-y-4">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--t4)] uppercase tracking-widest mb-2">CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[12px] text-[var(--t2)] file:mr-3 file:py-1.5 file:px-3 file:border file:border-[var(--b1)] file:bg-[var(--bg3)] file:text-[11px] file:font-mono file:font-medium file:text-[var(--t2)] file:cursor-pointer hover:file:bg-[var(--bg4)] file:transition-colors"
            required
          />
          {file && (
            <p className="text-[11px] text-[var(--t4)] mt-1.5">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>
          )}
        </div>

        {error && (
          <div className="text-[12px] font-mono text-red-700 border border-red-700/30 bg-red-50 px-3 py-2">{error}</div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="px-5 py-2.5 bg-[var(--t1)] text-[var(--bg)] text-[13px] font-semibold hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Processing...' : 'Import →'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-5 bg-[var(--bg2)] border border-[var(--b1)] p-5">
          <div className="text-[10px] font-semibold text-[var(--t4)] uppercase tracking-widest mb-4">Import complete</div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { n: result.added, label: 'Added', colour: 'text-[var(--color-ok)]' },
              { n: result.updated, label: 'Updated', colour: 'text-[var(--t2)]' },
              { n: result.closed, label: 'Closed', colour: 'text-[var(--color-warn)]' },
              { n: result.skipped, label: 'Skipped', colour: 'text-[var(--t4)]' },
            ].map(s => (
              <div key={s.label} className="text-center bg-[var(--bg3)] border border-[var(--b1)] py-3">
                <div className={`text-[22px] font-bold ${s.colour}`}>{s.n}</div>
                <div className="text-[9px] text-[var(--t4)] uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--t4)] uppercase tracking-widest mb-2">Warnings ({result.errors.length})</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-[11px] font-mono text-[var(--color-warn)] border border-[var(--color-warn)] bg-[var(--color-warn-dim)] px-2 py-1">{e}</div>
                ))}
              </div>
            </div>
          )}

          <a
            href="/admin/opportunities"
            className="inline-block mt-4 text-[12px] font-mono text-[var(--t1)] hover:underline"
          >
            View all opportunities →
          </a>
        </div>
      )}
    </div>
  )
}
