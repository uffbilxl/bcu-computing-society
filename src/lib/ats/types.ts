/* Shared shapes for the ATS checker. Extraction (PDF / DOCX → lines) and
 * analysis (lines → report) only meet through these types, so the analysis
 * stays a pure function that can be run and tested outside the browser. */

export interface Line {
  text: string
  page: number
  /** Left edge in points (PDF only) — used to tell wrapped bullets from new lines. */
  x?: number
  /** Right edge in points (PDF only) — a line that reaches the margin has wrapped. */
  end?: number
  /** Font size in points, when the file exposes it. */
  size?: number
  bold?: boolean
  /** The file marks this as a list item (DOCX numbering) — no glyph in the text. */
  bullet?: boolean
  /** The file marks this as a heading (DOCX heading style). */
  heading?: boolean
  inTable?: boolean
}

export interface DocSignals {
  images: number
  /** DOCX only. */
  tables: number
  /** DOCX only. */
  textBoxes: number
  /** Share of the words that sit inside tables (DOCX only), 0–1. */
  tableWordShare: number
  columns: boolean
  /** Font family names, de-duplicated, where the file exposes them. */
  fonts: string[]
  /** Median body text size in points. */
  bodySize?: number
  producer?: string
  creator?: string
  /** Link targets behind clickable text (PDF annotations, DOCX relationships). */
  linkTargets: string[]
  /** Text found in page headers and footers (DOCX only). */
  headerFooterText: string
}

export interface ExtractedDoc {
  kind: 'pdf' | 'docx'
  fileName: string
  fileSize: number
  pages: number
  /** True when the page count is a guess (DOCX has no fixed pages). */
  pagesEstimated: boolean
  lines: Line[]
  signals: DocSignals
}

export type CheckStatus = 'pass' | 'warn' | 'fail'

export type CategoryId = 'parsing' | 'contact' | 'structure' | 'content' | 'length'

export interface Check {
  id: string
  category: CategoryId
  label: string
  status: CheckStatus
  points: number
  /** 0 for advice that doesn't move the score. */
  max: number
  /** What we found. */
  detail: string
  /** How to fix it — empty when the check passed. */
  fix: string
  /** Quoted examples from the CV. */
  evidence: string[]
}

export interface CategoryScore {
  id: CategoryId
  label: string
  earned: number
  max: number
}

export interface ParsedFields {
  name: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  github: string | null
  location: string | null
  sections: string[]
  skills: string[]
  pages: number
  pagesEstimated: boolean
  words: number
  bullets: number
}

export interface JobMatch {
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  matchedTerms: string[]
  missingTerms: string[]
}

export interface Report {
  score: number
  band: 'strong' | 'good' | 'fair' | 'poor'
  verdict: string
  /** False when no usable text came out of the file — nothing else can be trusted. */
  readable: boolean
  categories: CategoryScore[]
  checks: Check[]
  parsed: ParsedFields
  /** The CV as plain text, in the order a parser reads it. */
  plainText: string
  jobMatch: JobMatch | null
}
