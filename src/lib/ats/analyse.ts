import { findWeakPhrases, startsWithActionVerb } from '../cv'
import { matchJob } from './jobmatch'
import { findSkills } from './skills'
import type { CategoryId, CategoryScore, Check, CheckStatus, ExtractedDoc, Line, ParsedFields, Report } from './types'

/* ── What this measures ───────────────────────────────────────────────────
 * An applicant tracking system does two things with a CV: it parses the
 * file into fields (name, contact, education, jobs, skills), then lets a
 * recruiter search and rank on those fields. There is no universal "ATS
 * score" — so this rubric scores the two things that are real:
 *
 *   1. Will a parser read the file correctly?   (parsing, contact, structure)
 *   2. Is what it reads worth ranking?          (content, length & keywords)
 *
 * Every check states what was found and how to fix it. Checks a file type
 * can't answer (tables in a PDF) are left out and the total is rescaled, so
 * a PDF and a DOCX of the same CV score alike.
 * ──────────────────────────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<CategoryId, string> = {
  parsing: 'Can it be read',
  contact: 'Contact details',
  structure: 'Sections and dates',
  content: 'Bullet points',
  length: 'Length and keywords',
}

/* ── Section headings ─────────────────────────────────────────────────── */
type SectionId =
  | 'summary' | 'education' | 'experience' | 'projects' | 'skills' | 'certifications'
  | 'awards' | 'activities' | 'publications' | 'interests' | 'languages' | 'references' | 'additional'

const SECTION_NAMES: Record<SectionId, string> = {
  summary: 'Summary', education: 'Education', experience: 'Experience', projects: 'Projects',
  skills: 'Skills', certifications: 'Certifications', awards: 'Awards', activities: 'Activities',
  publications: 'Research', interests: 'Interests', languages: 'Languages', references: 'References',
  additional: 'Additional',
}

const HEADINGS: Record<SectionId, string[]> = {
  summary: ['summary', 'professional summary', 'personal statement', 'profile', 'personal profile', 'professional profile',
    'about me', 'about', 'objective', 'career objective', 'career summary', 'executive summary', 'personal summary', 'overview'],
  education: ['education', 'education and qualifications', 'academic background', 'academic history', 'qualifications',
    'academic qualifications', 'education and training', 'academic education', 'education and certifications'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history',
    'career history', 'relevant experience', 'industry experience', 'internships', 'internship experience',
    'technical experience', 'work and experience', 'experience and employment', 'placements', 'employment experience',
    'relevant work experience', 'professional background'],
  projects: ['projects', 'personal projects', 'academic projects', 'technical projects', 'key projects', 'selected projects',
    'project experience', 'university projects', 'side projects', 'notable projects', 'projects and research', 'software projects'],
  skills: ['skills', 'technical skills', 'key skills', 'core skills', 'skills and interests', 'core competencies', 'competencies',
    'technical proficiencies', 'technologies', 'tools and technologies', 'skills summary', 'it skills', 'programming languages',
    'languages and technologies', 'skills and technologies', 'skills and tools', 'technical skills and tools', 'key competencies',
    'skills and competencies', 'relevant skills', 'professional skills', 'technical summary', 'additional skills', 'skills and abilities'],
  certifications: ['certifications', 'certificates', 'courses', 'training', 'licenses and certifications', 'licences and certifications',
    'certifications and courses', 'professional development', 'accreditations', 'courses and certifications', 'certifications and training',
    'professional certifications', 'relevant coursework', 'coursework'],
  awards: ['awards', 'achievements', 'honours', 'honors', 'awards and achievements', 'honours and awards', 'honors and awards',
    'scholarships', 'accomplishments', 'key achievements', 'achievements and awards', 'awards and honours', 'awards and scholarships'],
  activities: ['extracurricular activities', 'extracurricular', 'extracurriculars', 'activities', 'leadership', 'leadership experience',
    'positions of responsibility', 'volunteering', 'volunteer experience', 'voluntary work', 'societies', 'leadership and activities',
    'community involvement', 'volunteer work', 'leadership and volunteering', 'activities and societies', 'extra curricular activities',
    'extra curricular', 'volunteering experience', 'leadership and extracurricular', 'leadership and extracurriculars',
    'activities and interests', 'extracurricular activities and leadership'],
  publications: ['publications', 'research', 'research experience', 'publications and research', 'research and publications', 'papers'],
  interests: ['interests', 'hobbies', 'hobbies and interests', 'interests and hobbies', 'personal interests'],
  languages: ['languages', 'spoken languages'],
  references: ['references', 'referees'],
  additional: ['additional information', 'additional', 'other', 'miscellaneous', 'other information', 'further information'],
}

const HEADING_LOOKUP = new Map<string, SectionId>()
for (const [id, names] of Object.entries(HEADINGS) as [SectionId, string[]][]) {
  for (const name of names) HEADING_LOOKUP.set(name, id)
}

function headingKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchHeading(text: string): SectionId | null {
  if (text.length > 48) return null
  return HEADING_LOOKUP.get(headingKey(text)) ?? null
}

/* ── Word lists ───────────────────────────────────────────────────────── */
const EXTRA_VERBS = new Set(
  `accelerated accomplished achieved acquired adapted addressed administered advanced advised advocated aligned allocated
  analysed analyzed applied appointed architected arranged assembled assessed attained audited authored automated awarded
  benchmarked boosted briefed budgeted built calculated captured chaired championed coached coded collaborated collected
  communicated compiled completed composed computed conceived conducted configured consolidated constructed consulted
  containerised containerized contributed controlled converted coordinated created cut debugged decreased defined delivered
  demonstrated deployed designed detected determined developed devised diagnosed directed discovered documented doubled drafted
  drove earned edited eliminated enabled engineered enhanced ensured established evaluated examined exceeded executed expanded
  expedited experimented explored extended extracted facilitated finalised finalized fixed forecast formulated founded
  gathered generated guided handled hardened headed hosted identified implemented improved increased initiated innovated
  inspected installed instructed integrated interviewed introduced investigated launched lectured led leveraged maintained
  managed mapped marketed maximised maximized measured mentored merged migrated minimised minimized modelled modeled modernised
  modernized monitored negotiated obtained onboarded operated optimised optimized orchestrated organised organized overhauled
  oversaw partnered performed piloted pioneered planned prepared presented prevented prioritised prioritized processed produced
  profiled programmed proposed prototyped provided published queried raised ran ranked rebuilt recommended reduced refactored
  refined remediated reorganised reorganized repaired replaced reported represented researched resolved restructured revamped
  reviewed rewrote saved scaled scheduled scraped secured selected served shaped shipped simplified simulated sold solved
  spearheaded standardised standardized started steered streamlined strengthened structured studied supervised supported
  surveyed sustained synthesised synthesized taught tested tracked trained transformed translated triaged troubleshot tuned
  tutored uncovered unified updated upgraded utilised utilized validated verified visualised visualized volunteered won wrote`
    .split(/\s+/)
    .filter(Boolean),
)

const BUZZWORDS = [
  'hard-working', 'hardworking', 'hard working', 'team player', 'detail-oriented', 'detail oriented', 'attention to detail',
  'highly motivated', 'self-motivated', 'self motivated', 'go-getter', 'think outside the box', 'synergy', 'results-driven',
  'results driven', 'self-starter', 'dynamic individual', 'passionate about', 'fast learner', 'quick learner', 'people person',
  'excellent communication skills', 'good communication skills', 'works well under pressure', 'work well under pressure',
  'proactive', 'enthusiastic individual', 'motivated individual', 'strong work ethic', 'problem solver',
]

const PERSONAL_DATA: [RegExp, string][] = [
  [/\b(date of birth|d\.?o\.?b\.?)\b/i, 'date of birth'],
  [/\bmarital status\b/i, 'marital status'],
  [/\b(gender|sex)\s*:/i, 'gender'],
  [/\breligion\s*:/i, 'religion'],
  [/\bnational insurance\b|\bNI number\b/i, 'National Insurance number'],
  [/\bnationality\s*:/i, 'nationality'],
  [/\bage\s*:\s*\d/i, 'age'],
]

const SPELLING_PAIRS: [string, string][] = [
  ['organis', 'organiz'], ['optimis', 'optimiz'], ['analys', 'analyz'], ['utilis', 'utiliz'], ['prioritis', 'prioritiz'],
  ['specialis', 'specializ'], ['recognis', 'recogniz'], ['colour', 'color'], ['centre', 'center'], ['behaviour', 'behavior'],
  ['modell', 'modeled'], ['visualis', 'visualiz'], ['standardis', 'standardiz'],
]

const UK_PLACES = [
  'london', 'birmingham', 'manchester', 'leeds', 'liverpool', 'sheffield', 'bristol', 'newcastle', 'nottingham', 'leicester',
  'coventry', 'wolverhampton', 'cardiff', 'edinburgh', 'glasgow', 'belfast', 'oxford', 'cambridge', 'reading', 'derby',
  'southampton', 'portsmouth', 'brighton', 'york', 'milton keynes', 'luton', 'stoke', 'solihull', 'walsall', 'dudley',
  'west midlands', 'sandwell', 'bradford', 'hull', 'plymouth', 'swansea', 'aberdeen', 'dundee', 'norwich', 'exeter',
  'united kingdom', 'england', 'scotland', 'wales',
]

const DESIGN_TOOLS = /canva|illustrator|photoshop|indesign|figma|affinity|publisher|coreldraw|inkscape|sketch\b/i
const SYMBOL_FONT = /symbol|wingding|webding|dingbat|fontawesome|icon|emoji/i

const BULLET_GLYPH = /^\s*(?:[•·●○◦▪▫■□‣⁃∙➢➤►▶▸✓✔❖★☆➔→◆◇♦⦿]|[-]|[-–—*](?=\s)|o(?=\s+[A-Z]))\s*/
const DECORATIVE_BULLET = /^\s*[➢➤►▶▸✓✔❖★☆➔→◆◇♦]/

const MONTH = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const MONTH_YEAR = new RegExp(`\\b(${MONTH})\\.?,?\\s+(['’]\\d{2}|\\d{4})\\b`, 'gi')
const NUMERIC_DATE = /\b(?:0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}\b/g
const YEAR_RANGE = /\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current|now|ongoing)\b/gi
const ANY_YEAR = /\b(?:19|20)\d{2}\b/

/* ── Small helpers ────────────────────────────────────────────────────── */
function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function quote(text: string, max = 110): string {
  const t = text.trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/* Ligatures and odd spaces come out of PDFs as single code points; fold
 * them so "proﬁcient" still reads as "proficient". */
function clean(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[​-‍﻿­]/g, '')
    .replace(/[  -  　]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/* "J O H N   S M I T H" → "JOHN SMITH". Letter-spaced headings are stored
 * as separate letters, which is exactly how a parser receives them. */
const LETTER_SPACED = /(?:\b[A-Za-z] ){4,}[A-Za-z]\b/g
function collapseLetterSpacing(text: string): string {
  return text.replace(LETTER_SPACED, run => run.replace(/ /g, ''))
}

function isQuantified(bullet: string): boolean {
  if (/[£$€]\s?\d|\d\s?(%|percent\b|x\b|k\b|m\b|\+)|\b\d{1,3}(,\d{3})+\b/i.test(bullet)) return true
  if (/\b(doubled|tripled|halved|twice|dozens|hundreds|thousands|millions)\b/i.test(bullet)) return true
  // any number that isn't just a year
  return (bullet.match(/\b\d+(\.\d+)?\b/g) ?? []).some(n => !/^(19|20)\d{2}$/.test(n))
}

function startsWithVerb(bullet: string): boolean {
  if (startsWithActionVerb(bullet)) return true
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z-]/g, '') ?? ''
  return EXTRA_VERBS.has(first) || EXTRA_VERBS.has(first.replace(/^(co|re)-/, ''))
}

interface Bullet { text: string; section: SectionId | null }
interface Section { id: SectionId | null; title: string; lines: Line[] }

/* ── Structure ────────────────────────────────────────────────────────── */
function splitSections(lines: Line[], unknown: Set<string> = new Set()): { header: Line[]; sections: Section[]; headingLines: Line[] } {
  const header: Line[] = []
  const sections: Section[] = []
  const headingLines: Line[] = []
  let current: Section | null = null

  for (const line of lines) {
    const bare = line.text.replace(BULLET_GLYPH, '').replace(/[:\s]+$/, '')
    const id = !line.bullet && words(bare).length <= 5 ? matchHeading(bare) : null
    // "Languages: Python, Java" is a skills row, not a heading
    if (id && !/:\s*\S/.test(line.text)) {
      current = { id, title: bare, lines: [] }
      sections.push(current)
      headingLines.push(line)
    } else if (unknown.has(line.text)) {
      // A heading no parser maps to a field still ends the section above it
      current = { id: null, title: line.text, lines: [] }
      sections.push(current)
    } else if (current) current.lines.push(line)
    else header.push(line)
  }
  return { header, sections, headingLines }
}

/* Lines styled like the recognised headings but with a title no parser
 * maps to a field ("My Journey", "What I Bring"). */
function findUnknownHeadings(lines: Line[], headingLines: Line[]): string[] {
  if (headingLines.length < 2) return []
  const signature = (l: Line) =>
    `${l.text === l.text.toUpperCase() && /[A-Z]{3}/.test(l.text) ? 'caps' : 'mixed'}|${l.size ? Math.round(l.size * 2) / 2 : '-'}|${l.bold ? 'b' : 'n'}|${l.heading ? 'h' : '-'}`

  const counts = new Map<string, number>()
  for (const h of headingLines) counts.set(signature(h), (counts.get(signature(h)) ?? 0) + 1)
  const [style, n] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
  if (n < headingLines.length * 0.6) return []
  // A style with no distinguishing feature would match ordinary body lines
  if (style.startsWith('mixed|') && style.endsWith('|n|-')) return []

  const known = new Set(headingLines)
  const candidates = lines.filter(l =>
    !known.has(l) &&
    !l.bullet &&
    signature(l) === style &&
    words(l.text).length <= 4 &&
    l.text.length >= 4 &&
    !/[\d@:,.|]/.test(l.text) &&
    !BULLET_GLYPH.test(l.text),
  )
  // If the "heading style" is everywhere it isn't a heading style
  if (candidates.length > headingLines.length) return []
  // The name at the top shares the style in some templates
  return candidates.filter(l => lines.indexOf(l) > 2).map(l => l.text)
}

function collectBullets(sections: Section[], header: Line[]): { bullets: Bullet[]; decorative: boolean; glyphBullets: number } {
  const bullets: Bullet[] = []
  let decorative = false
  let glyphBullets = 0

  const scan = (lines: Line[], section: SectionId | null) => {
    let open: { bullet: Bullet; x?: number; page: number; extra: number } | null = null
    for (const line of lines) {
      const glyph = BULLET_GLYPH.test(line.text)
      if (line.bullet || glyph) {
        if (glyph) { glyphBullets++; if (DECORATIVE_BULLET.test(line.text)) decorative = true }
        const bullet = { text: line.text.replace(BULLET_GLYPH, '').trim(), section }
        if (bullet.text) { bullets.push(bullet); open = { bullet, x: line.x, page: line.page, extra: 0 } }
        continue
      }
      // A wrapped bullet continues on lines indented past its glyph
      if (open && open.x !== undefined && line.x !== undefined && line.x > open.x + 2 && line.page === open.page && open.extra < 4 && !/ {2}/.test(line.text)) {
        open.bullet.text += ` ${line.text}`
        open.extra++
      } else open = null
    }
  }

  scan(header, null)
  for (const s of sections) scan(s.lines, s.id)
  if (bullets.length >= 3) return { bullets, decorative, glyphBullets }

  /* Some PDF exporters draw bullet dots as shapes, not characters, so there
   * is no glyph to find. The bullets are still there as lines indented from
   * the margin; one that stops short of the right edge ends its bullet. */
  const body = sections.flatMap(s => s.lines).filter(l => l.x !== undefined && l.end !== undefined)
  if (body.length < 6) return { bullets, decorative, glyphBullets }
  const tally = new Map<number, number>()
  for (const l of body) tally.set(Math.round(l.x!), (tally.get(Math.round(l.x!)) ?? 0) + 1)
  const margin = Math.min(...Array.from(tally.entries()).filter(([, c]) => c >= 3).map(([x]) => x))
  const rightEdge = Math.max(...body.map(l => l.end!))
  const inferred: Bullet[] = []
  for (const s of sections) {
    let open: { bullet: Bullet; full: boolean } | null = null
    for (const l of s.lines) {
      const indented = l.x !== undefined && l.x >= margin + 10 && l.x <= margin + 60 && !/ {2}/.test(l.text)
      if (!indented) { open = null; continue }
      if (open && open.full) open.bullet.text += ` ${l.text}`
      else { const bullet = { text: l.text, section: s.id }; inferred.push(bullet); open = { bullet, full: false } }
      open.full = l.end! >= rightEdge - 36
    }
  }
  return inferred.length >= 3 ? { bullets: inferred, decorative, glyphBullets: inferred.length } : { bullets, decorative, glyphBullets }
}

/* ── Contact ──────────────────────────────────────────────────────────── */
function findPhone(text: string): string | null {
  const candidates = text.match(/(?:\+|00)?\(?\d[\d\s().-]{8,18}\d/g) ?? []
  for (const c of candidates) {
    const digits = c.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 13) continue
    // two years side by side ("2021 - 2024") are not a phone number
    if (/^(19|20)\d{2}\D+(19|20)\d{2}/.test(c.trim())) continue
    return c.trim()
  }
  return null
}

function findName(header: Line[]): { name: string | null; titleLine: boolean } {
  let titleLine = false
  for (const line of header.slice(0, 4)) {
    const text = line.text.split('  ')[0].trim()
    if (/^(curriculum vitae|cv|resume|résumé)$/i.test(text)) { titleLine = true; continue }
    const parts = words(text)
    if (parts.length >= 2 && parts.length <= 5 && /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s.'’-]+$/.test(text) && !matchHeading(text)) {
      const name = text === text.toUpperCase()
        ? text.toLowerCase().replace(/(^|[\s'’-])[a-zà-öø-ÿ]/g, c => c.toUpperCase())
        : text
      return { name, titleLine }
    }
    break
  }
  return { name: null, titleLine }
}

function findLocation(text: string): string | null {
  const lower = text.toLowerCase()
  const place = UK_PLACES.find(p => new RegExp(`\\b${p}\\b`).test(lower))
  if (place) return place.replace(/\b\w/g, c => c.toUpperCase())
  const postcode = text.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/)
  if (postcode) return postcode[0]
  if (/\b(UK|U\.K\.)\b/.test(text)) return 'UK'
  return null
}

/* ── The report ───────────────────────────────────────────────────────── */
export function analyse(doc: ExtractedDoc, jobDescription = ''): Report {
  const checks: Check[] = []
  const add = (
    id: string, category: CategoryId, label: string, points: number, max: number,
    detail: string, fix = '', evidence: string[] = [], forced?: CheckStatus,
  ) => {
    const earned = clamp(Math.round(points * 10) / 10, 0, max)
    const status: CheckStatus = forced ?? (max === 0 ? 'warn' : earned >= max ? 'pass' : earned >= max * 0.5 ? 'warn' : 'fail')
    checks.push({ id, category, label, status, points: earned, max, detail, fix: status === 'pass' ? '' : fix, evidence: evidence.slice(0, 4) })
  }

  const { signals } = doc
  const rawText = doc.lines.map(l => l.text).join('\n')
  const letterSpaced = (rawText.match(LETTER_SPACED) ?? []).length

  const lines: Line[] = doc.lines
    .map(l => ({ ...l, text: collapseLetterSpacing(clean(l.text)) }))
    .filter(l => l.text.length > 0)
  const text = lines.map(l => l.text).join('\n')
  const allWords = words(text)
  const wordTotal = allWords.length
  const isPdf = doc.kind === 'pdf'

  /* ── No text at all: nothing else is worth reporting ─────────────── */
  const readable = wordTotal >= 40
  if (!readable) {
    add('text', 'parsing', 'Text can be read', 0, 10,
      wordTotal === 0
        ? 'No text could be read from this file. It is almost certainly a scan or an image saved as a PDF.'
        : `Only ${plural(wordTotal, 'word')} could be read from this file. Most of it is probably an image.`,
      'An ATS would receive a blank CV. Rebuild it as real text: export to PDF from Word, Google Docs or the CV Builder rather than scanning, photographing, or exporting as an image.')
    return {
      score: wordTotal === 0 ? 0 : 5,
      band: 'poor',
      verdict: 'An ATS cannot read this file.',
      readable: false,
      categories: [{ id: 'parsing', label: CATEGORY_LABELS.parsing, earned: 0, max: 10 }],
      checks,
      parsed: {
        name: null, email: null, phone: null, linkedin: null, github: null, location: null,
        sections: [], skills: [], pages: doc.pages, pagesEstimated: doc.pagesEstimated, words: wordTotal, bullets: 0,
      },
      plainText: text,
      jobMatch: null,
    }
  }

  const firstPass = splitSections(lines)
  const unknownHeadings = findUnknownHeadings(lines, firstPass.headingLines)
  const { header, sections, headingLines } = splitSections(lines, new Set(unknownHeadings))
  const has = (id: SectionId) => sections.some(s => s.id === id)
  const sectionText = (id: SectionId) => sections.filter(s => s.id === id).flatMap(s => s.lines.map(l => l.text)).join('\n')
  const { bullets, decorative, glyphBullets } = collectBullets(sections, header)

  /* ═══ 1. Can it be read ═══════════════════════════════════════════════ */

  // Text quality
  const garbled = (text.match(/�|\(cid:\d+\)|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) ?? []).length
    + (text.replace(/^[-]/gm, '').match(/[-]/g) ?? []).length
  const garbledShare = garbled / Math.max(1, text.length)
  if (garbledShare > 0.02) {
    add('text', 'parsing', 'Text can be read', garbledShare > 0.1 ? 2 : 5, 10,
      `${Math.round(garbledShare * 100)}% of the characters come out as unreadable symbols. The font doesn't map its letters to real text.`,
      'Switch to a standard font (Arial, Calibri, Times New Roman) and export again. Test it yourself: copy the text out of the PDF and paste it into a blank document.')
  } else if (letterSpaced >= 2) {
    add('text', 'parsing', 'Text can be read', 7, 10,
      'Some text is letter-spaced (S P A C E D  O U T). A parser reads each letter as a separate word, so those headings and names are not recognised.',
      'Remove the character spacing from headings and your name. Use size and bold for emphasis instead.',
      (rawText.match(LETTER_SPACED) ?? []).map(s => quote(s, 60)))
  } else {
    add('text', 'parsing', 'Text can be read', 10, 10,
      `Real, selectable text: ${wordTotal.toLocaleString('en-GB')} words read cleanly from the file.`)
  }

  // Layout
  if (signals.columns) {
    add('columns', 'parsing', 'Single-column layout', 0, 7,
      isPdf
        ? 'This looks like a multi-column layout. Parsers read straight across the page, so text from the two columns gets interleaved into nonsense.'
        : 'The document uses Word columns. Many parsers read straight across the page and interleave the two columns.',
      'Move everything into one column that reads top to bottom. Put skills in their own section below, not in a sidebar.')
  } else {
    add('columns', 'parsing', 'Single-column layout', 7, 7, 'One column that reads top to bottom, the layout every parser handles.')
  }

  // Tables and text boxes — only a DOCX can tell us
  if (!isPdf) {
    if (signals.textBoxes > 0) {
      add('tables', 'parsing', 'No tables or text boxes', signals.tables > 0 ? 0 : 1, 5,
        `${plural(signals.textBoxes, 'text box', 'text boxes')} found${signals.tables > 0 ? `, plus ${plural(signals.tables, 'table')}` : ''}. Text inside a text box is often skipped completely by parsers.`,
        'Delete the text boxes and type their content straight into the page as normal paragraphs.')
    } else if (signals.tables > 0) {
      const share = Math.round(signals.tableWordShare * 100)
      add('tables', 'parsing', 'No tables or text boxes', signals.tableWordShare >= 0.3 ? 0 : 3, 5,
        `${plural(signals.tables, 'table')} found, holding ${share}% of your text. Parsers often read table cells out of order or drop them.`,
        'Replace tables with plain paragraphs. To push dates to the right, use a right-aligned tab stop instead of a table column.')
    } else {
      add('tables', 'parsing', 'No tables or text boxes', 5, 5, 'No tables or text boxes. All text flows in normal paragraphs.')
    }
  }

  // Images
  if (signals.images === 0) {
    add('images', 'parsing', 'No images or icons', 3, 3, 'No images. Nothing here is invisible to a parser.')
  } else {
    add('images', 'parsing', 'No images or icons', signals.images <= 2 ? 1 : 0, 3,
      `${plural(signals.images, 'image')} found. A parser ignores images completely, so a photo, logo, icon or skill bar adds nothing, and any text inside one is lost.`,
      'Remove photos, logos and icons. UK employers do not expect a photo. Replace skill bars and rating dots with plain words.')
  }

  // File
  {
    const base = doc.fileName.replace(/\.[^.]+$/, '')
    const problems: string[] = []
    if (doc.fileSize > 2 * 1024 * 1024) problems.push(`it is ${(doc.fileSize / 1024 / 1024).toFixed(1)} MB (many application forms cap uploads at 2 MB)`)
    const messy = /\b(final|copy|draft|new|updated?|v\d+|version|edit(ed)?|latest)\b|\(\d+\)|untitled|^document\d*$|template/i.test(base.replace(/[_-]+/g, ' '))
    const generic = /^(my )?(cv|resume|curriculum vitae)$/i.test(base.replace(/[_-]+/g, ' ').trim())
    if (messy) problems.push('the name looks like a working draft')
    else if (generic) problems.push('the name doesn’t say whose CV it is')
    add('file', 'parsing', 'File type, size and name', 3 - problems.length * (problems.length > 1 ? 1.5 : 1), 3,
      problems.length
        ? `“${doc.fileName}”: ${problems.join(', and ')}. Recruiters see the file name.`
        : `${isPdf ? 'PDF' : 'Word'} file, ${(doc.fileSize / 1024).toFixed(0)} KB, sensibly named.`,
      'Name it Firstname-Lastname-CV and keep it under 2 MB.')
  }

  // Fonts
  {
    const families = signals.fonts.filter(f => !SYMBOL_FONT.test(f))
    const tiny = signals.bodySize !== undefined && signals.bodySize < 9.4
    const many = families.length > 3
    const detail = tiny
      ? `Body text is about ${signals.bodySize!.toFixed(1)}pt. That is hard for a recruiter to read and suggests the page is over-packed.`
      : many
        ? `${families.length} different fonts are used (${families.slice(0, 5).join(', ')}).`
        : signals.bodySize
          ? `Body text is about ${signals.bodySize.toFixed(1)}pt${families.length ? ` in ${families.slice(0, 3).join(', ')}` : ''}.`
          : 'Font use looks consistent.'
    add('fonts', 'parsing', 'Readable, consistent fonts', 2 - (tiny ? 1 : 0) - (many ? 1 : 0), 2, detail,
      tiny ? 'Use 10–12pt for body text. Cut content rather than shrinking the font.' : 'Stick to one font, two at most: one for headings, one for body.')
  }

  // Design tools — advice only
  const tool = `${signals.creator ?? ''} ${signals.producer ?? ''}`.match(DESIGN_TOOLS)?.[0]
  if (tool) {
    add('tool', 'parsing', `Made with ${tool.replace(/^\w/, c => c.toUpperCase())}`, 0, 0,
      `This file was exported from ${tool.replace(/^\w/, c => c.toUpperCase())}. Design-tool templates lean on columns, shapes and text boxes that parsers handle badly, even when the text is selectable.`,
      'For online applications, keep a plain version made in Word, Google Docs or the CV Builder. Save the designed one for handing over in person.')
  }

  if (decorative) {
    add('glyphs', 'parsing', 'Standard bullet characters', 0, 0,
      'Your bullets use decorative symbols (arrows, ticks or diamonds). These often turn into “?” or empty boxes once parsed.',
      'Use the plain round bullet (•) or a hyphen.')
  }

  /* ═══ 2. Contact details ═════════════════════════════════════════════ */
  const top = [...header, ...lines.slice(0, 8)].map(l => l.text).join('\n')
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null
  const phone = findPhone(top) ?? findPhone(text)
  const linkedin = text.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[\w%-]+/i)?.[0] ?? null
  const github = text.match(/(?:https?:\/\/)?github\.com\/[\w-]+/i)?.[0] ?? null
  const portfolio = text.match(/\b(?:https?:\/\/|www\.)[^\s|,]+|\b[\w-]+\.(?:dev|io|me|tech|co\.uk|uk|app|xyz)\b/i)?.[0] ?? null
  const location = findLocation(top)
  const { name, titleLine } = findName(header.length ? header : lines.slice(0, 3))

  const linkedEmail = signals.linkTargets.find(t => /^mailto:/i.test(t))?.replace(/^mailto:/i, '')
  const linkedLinkedin = signals.linkTargets.find(t => /linkedin\.com\/(in|pub)\//i.test(t))
  const hfEmail = signals.headerFooterText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]

  if (email) {
    const unprofessional = /\d{4,}|xx|420|69|babe|sexy|cool|swag|gamer|ninja/i.test(email.split('@')[0])
    add('email', 'contact', 'Email address', unprofessional ? 3 : 4, 4,
      unprofessional ? `${email} reads as a personal handle, not a professional address.` : `Found: ${email}`,
      'Use a plain firstname.lastname address. Your university email is fine while you are a student.')
  } else if (hfEmail) {
    add('email', 'contact', 'Email address', 1, 4,
      `Your email (${hfEmail}) is in the page header or footer. Many parsers skip headers and footers entirely, so they would find no email.`,
      'Move your contact details into the main body, at the top of the first page.')
  } else if (linkedEmail) {
    add('email', 'contact', 'Email address', 1, 4,
      `Your email (${linkedEmail}) only exists as a clickable link behind other text or an icon. A parser reads the visible text, not the link.`,
      'Write the address out in full as plain text.')
  } else {
    add('email', 'contact', 'Email address', 0, 4, 'No email address found. A recruiter has no way to reply.',
      'Add your email as plain text at the top of the first page.')
  }

  if (phone) add('phone', 'contact', 'Phone number', 3, 3, `Found: ${phone}`)
  else if (/\d{6,}/.test(signals.headerFooterText.replace(/\s/g, ''))) {
    add('phone', 'contact', 'Phone number', 1, 3, 'Your phone number is in the page header or footer, which many parsers skip.',
      'Move it into the main body with the rest of your contact details.')
  } else add('phone', 'contact', 'Phone number', 0, 3, 'No phone number found.', 'Add a mobile number, ideally in the +44 7… format.')

  if (linkedin) add('links', 'contact', 'LinkedIn profile', 2, 2, `Found: ${linkedin}${github ? `, plus ${github}` : ''}`)
  else if (linkedLinkedin || /\blinkedin\b/i.test(top)) {
    add('links', 'contact', 'LinkedIn profile', 1, 2,
      'LinkedIn is mentioned, but the address is hidden behind a link or icon. A parser cannot follow links.',
      'Write the address out: linkedin.com/in/your-name')
  } else if (github || portfolio) {
    add('links', 'contact', 'LinkedIn profile', 1, 2, `No LinkedIn address, though ${github ?? portfolio} is listed.`,
      'Add linkedin.com/in/your-name. Recruiters check it for almost every tech application.')
  } else add('links', 'contact', 'LinkedIn profile', 0, 2, 'No LinkedIn, GitHub or portfolio link found.',
    'Add linkedin.com/in/your-name, and your GitHub if you have projects on it.')

  if (location) add('location', 'contact', 'Location', 1, 1, `Found: ${location}`)
  else add('location', 'contact', 'Location', 0, 1, 'No town or city found near your contact details.',
    'Add your city and country (“Birmingham, UK”). Recruiters filter by location. You do not need your full address.')

  {
    const emailNearTop = email ? lines.slice(0, 12).some(l => l.text.includes(email)) : false
    const problems: string[] = []
    if (!name) problems.push(titleLine ? 'the first line is a title like “Curriculum Vitae”, which a parser can mistake for your name' : 'the first line does not look like a name')
    if (email && !emailNearTop) problems.push('your contact details are not at the top of the page')
    add('top', 'contact', 'Name and contact details come first', 2 - problems.length, 2,
      problems.length ? `${problems.join(', and ')}.`.replace(/^\w/, c => c.toUpperCase()) : `Name read as “${name}”, with contact details directly underneath.`,
      'Start the page with your name on its own line, then one line of contact details. No “Curriculum Vitae” title.')
  }

  const personal = PERSONAL_DATA.filter(([re]) => re.test(text)).map(([, label]) => label)
  if (personal.length) {
    add('personal', 'contact', 'Personal details to leave out', 0, 0,
      `Your CV includes your ${personal.join(', ')}. UK employers should not see these and some will discard a CV that lists them, to avoid bias claims.`,
      'Remove them. Name, email, phone, city and links are all a CV needs.')
  }

  /* ═══ 3. Sections and dates ══════════════════════════════════════════ */
  const found = Array.from(new Set(sections.map(s => s.id).filter((id): id is SectionId => id !== null)))

  if (has('education')) add('education', 'structure', 'Education section', 5, 5, 'Found under a heading a parser recognises.')
  else {
    const mentioned = /\b(university|bsc|ba \(|beng|meng|msc|degree|a-?levels?|gcses?)\b/i.test(text)
    add('education', 'structure', 'Education section', mentioned ? 2 : 0, 5,
      mentioned ? 'Your studies are mentioned, but not under a heading a parser recognises, so they may not be filed as education.' : 'No education section found.',
      'Add a section headed exactly “Education”, with your university, degree title, dates and expected grade.')
  }

  if (has('experience')) add('experience', 'structure', 'Experience section', 5, 5, 'Found under a heading a parser recognises.')
  else if (has('projects') || has('activities')) {
    add('experience', 'structure', 'Experience section', 4, 5,
      `No work experience section, but ${has('projects') ? 'projects' : 'activities'} are there to stand in for it.`,
      'If you have any paid work, internship, insight week or society role, put it under a heading called “Experience”. Parsers look for that word.')
  } else add('experience', 'structure', 'Experience section', 0, 5, 'No experience or projects section found under a recognised heading.',
    'Add a section headed “Experience” (part-time work and society roles count) or “Projects”.')

  if (has('skills')) add('skills-section', 'structure', 'Skills section', 4, 4, 'Found under a heading a parser recognises.')
  else add('skills-section', 'structure', 'Skills section', 0, 4, 'No skills section found. This is the first place a recruiter’s keyword search looks.',
    'Add a section headed “Skills” listing your languages, frameworks and tools by name.')

  // Dates
  {
    const monthMatches = Array.from(text.matchAll(MONTH_YEAR))
    const shortMonths = monthMatches.filter(m => m[1].replace('.', '').length <= 4 && !/^(may|june|july)$/i.test(m[1])).length
    const longMonths = monthMatches.filter(m => m[1].length > 4).length
    const twoDigitYears = monthMatches.filter(m => /^['’]/.test(m[2])).map(m => m[0])
    const numeric = (text.match(NUMERIC_DATE) ?? []).length
    const yearRanges = (text.match(YEAR_RANGE) ?? []).filter(r => !new RegExp(`${MONTH}\\.?,?\\s+$`, 'i').test(text.slice(0, text.indexOf(r))))
    const yearOnly = monthMatches.length + numeric === 0 ? yearRanges.length : Math.max(0, yearRanges.length - monthMatches.length)
    const styles = [shortMonths > 0, longMonths > 0, numeric > 0].filter(Boolean).length
    const anyDates = monthMatches.length + numeric + yearRanges.length > 0 || ANY_YEAR.test(text)

    if (!anyDates) {
      add('dates', 'structure', 'Dates are present and consistent', 0, 4, 'No dates found. A parser cannot work out when or for how long you did anything.',
        'Give every role and course a start and end date, written like “Sep 2024 – Jun 2025”.')
    } else {
      const problems: string[] = []
      let pts = 4
      if (styles > 1) { pts -= 1.5; problems.push(`dates are written ${styles} different ways (${[shortMonths && 'Sep 2024', longMonths && 'September 2024', numeric && '09/2024'].filter(Boolean).join(', ')})`) }
      if (twoDigitYears.length) { pts -= 1; problems.push('some years are shortened to two digits') }
      if (monthMatches.length + numeric === 0) { pts -= 1.5; problems.push('dates give the year only, so a parser cannot measure how long each role lasted') }
      else if (yearOnly >= 2) { pts -= 0.5; problems.push('some date ranges give the year only') }
      add('dates', 'structure', 'Dates are present and consistent', pts, 4,
        problems.length ? `${problems.join('; ')}.`.replace(/^\w/, c => c.toUpperCase()) : 'Every date uses the same month-and-year format.',
        'Pick one format with the month and a four-digit year (“Sep 2024 – Jun 2025”) and use it everywhere.',
        twoDigitYears.slice(0, 3))
    }
  }

  // Headings
  {
    const unknown = unknownHeadings
    if (headingLines.length === 0) {
      add('headings', 'structure', 'Standard section headings', 0, 2,
        'No recognisable section headings found at all. A parser would file the whole CV as one unsorted block.',
        'Split the CV under plain headings on their own lines: Education, Experience, Projects, Skills.')
    } else if (unknown.length) {
      add('headings', 'structure', 'Standard section headings', unknown.length > 2 ? 0 : 1, 2,
        `${plural(unknown.length, 'heading')} a parser will not recognise. The content underneath may be filed in the wrong place or dropped.`,
        'Rename them to the standard words: Education, Experience, Projects, Skills, Certifications, Awards, Interests.',
        unknown.map(u => quote(u, 50)))
    } else {
      add('headings', 'structure', 'Standard section headings', 2, 2, `${plural(found.length, 'section')} recognised: ${found.map(id => SECTION_NAMES[id]).join(', ')}.`)
    }
  }

  if (/references?\s+(are\s+)?available\s+(up)?on\s+request/i.test(text) || has('references')) {
    add('references', 'structure', 'References line', 0, 0,
      'Your CV spends space on references. Employers ask for them at offer stage, and never search for them.',
      'Delete the references section and use the lines for another achievement.')
  }

  /* ═══ 4. Bullet points ═══════════════════════════════════════════════ */
  const BULLET_SECTIONS: (SectionId | null)[] = ['experience', 'projects', 'activities', 'awards', 'publications', 'additional', null]
  let judged = bullets.filter(b => BULLET_SECTIONS.includes(b.section))
  let proseFallback = false
  if (judged.length < 3) {
    // No bullet characters: judge the sentences in the same sections instead
    const prose = sections
      .filter(s => BULLET_SECTIONS.includes(s.id))
      .flatMap(s => s.lines
        // entry headers ("Role, Company   Sep 2024 – Jun 2025") are not prose
        .filter(l => words(l.text).length >= 7 && !/ {2}/.test(l.text) && !ANY_YEAR.test(l.text))
        .map(l => ({ text: l.text, section: s.id })))
    if (prose.length > judged.length) { judged = prose; proseFallback = true }
  }
  const n = judged.length

  if (n === 0) {
    add('bullets', 'content', 'Achievements written as bullet points', 0, 4,
      'No bullet points found under your experience or projects. Parsers and recruiters both expect achievements as bullets.',
      'Under each role or project, add 2–4 bullets. Each one: an action verb, what you did, and the result.')
    add('verbs', 'content', 'Bullets start with action verbs', 0, 8, 'Nothing to assess yet.', 'Add bullet points first.')
    add('metrics', 'content', 'Achievements include numbers', 0, 8, 'Nothing to assess yet.', 'Add bullet points first.')
  } else {
    if (proseFallback) {
      add('bullets', 'content', 'Achievements written as bullet points', 1, 4,
        'Your experience is written as paragraphs, not bullet points. Recruiters skim a CV in seconds and paragraphs hide your achievements.',
        'Break each paragraph into 2–4 bullets, one achievement per bullet.')
    } else {
      add('bullets', 'content', 'Achievements written as bullet points', n >= 8 ? 4 : n >= 5 ? 3 : 2, 4,
        n >= 8 ? `${n} bullet points across your experience and projects.` : `Only ${plural(n, 'bullet point')} across your experience and projects. That is thin.`,
        'Aim for 2–4 bullets per role or project, and 8 or more overall.')
    }

    const noVerb = judged.filter(b => !startsWithVerb(b.text))
    const verbShare = 1 - noVerb.length / n
    add('verbs', 'content', 'Bullets start with action verbs', (verbShare / 0.8) * 8, 8,
      `${n - noVerb.length} of ${n} start with a strong action verb.`,
      'Open each bullet with what you did: Built, Designed, Led, Automated, Reduced, Analysed. Drop openers like “I was” or “Responsible for”.',
      noVerb.map(b => quote(b.text)))

    const plain = judged.filter(b => !isQuantified(b.text))
    const metricShare = 1 - plain.length / n
    add('metrics', 'content', 'Achievements include numbers', (metricShare / 0.5) * 8, 8,
      `${n - plain.length} of ${n} include a number.`,
      'Add scale or results to at least half: users, records, team size, % faster, hours saved, marks achieved. “Built a scraper” becomes “Built a scraper collecting 800 listings a day”.',
      plain.map(b => quote(b.text)))

    const weak = judged.map(b => ({ b, phrases: findWeakPhrases(b.text) })).filter(x => x.phrases.length)
    add('weak', 'content', 'No vague wording', 3 - weak.length, 3,
      weak.length ? `${plural(weak.length, 'bullet')} ${weak.length === 1 ? 'leans' : 'lean'} on vague phrases that describe a duty, not an achievement.` : 'No vague phrases like “responsible for” or “helped with”.',
      'Say what you actually did and what changed because of it.',
      weak.map(x => `“${x.phrases[0]}” in: ${quote(x.b.text, 90)}`))

    const badLength = judged.filter(b => { const w = words(b.text).length; return w < 6 || w > 35 })
    add('bullet-length', 'content', 'Bullets are a sensible length', badLength.length / n <= 0.2 ? 3 : badLength.length / n <= 0.4 ? 2 : 1, 3,
      badLength.length ? `${badLength.length} of ${n} bullets ${badLength.length === 1 ? 'is' : 'are'} under 6 or over 35 words.` : 'Every bullet is between 6 and 35 words.',
      'One or two lines each. Split long ones, and give short ones a result.',
      badLength.map(b => quote(b.text)))

    const starts = new Map<string, number>()
    for (const b of judged) {
      const first = b.text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
      if (first) starts.set(first, (starts.get(first) ?? 0) + 1)
    }
    const repeated = Array.from(starts.entries()).filter(([, c]) => c >= Math.max(3, Math.ceil(n * 0.25))).map(([w]) => w)
    add('variety', 'content', 'Varied opening words', repeated.length ? 0 : 2, 2,
      repeated.length ? `“${repeated.join('”, “')}” ${repeated.length > 1 ? 'open' : 'opens'} several bullets each.` : 'Bullets open with a good mix of verbs.',
      'Swap repeats for a more precise verb: built → engineered, designed, automated, shipped.')
  }

  // Advice that doesn't move the score
  {
    const pronouns = (text.match(/(^|[\s(“"])(I|I'm|I’m|I've|I’ve|my|My|myself)(?=[\s,.])/g) ?? []).length
    if (pronouns >= 3) {
      add('pronouns', 'content', 'First-person pronouns', 0, 0,
        `“I” or “my” appears ${pronouns} times. CVs are written without pronouns, which also saves space.`,
        '“I developed a web app” becomes “Developed a web app”.')
    }
    const lower = text.toLowerCase()
    const buzz = BUZZWORDS.filter(b => lower.includes(b))
    if (buzz.length >= 2) {
      add('buzzwords', 'content', 'Clichés', 0, 0,
        `${plural(buzz.length, 'stock phrase')} that every CV uses and no recruiter searches for.`,
        'Cut them and let a bullet prove the point: not “team player” but “Worked in a team of 4 to ship…”.',
        buzz.slice(0, 5).map(b => `“${b}”`))
    }
    const mixed = SPELLING_PAIRS.filter(([uk, us]) => lower.includes(uk) && lower.includes(us))
    if (mixed.length) {
      add('spelling', 'content', 'British and American spelling mixed', 0, 0,
        'Both British and American spellings appear. It reads as careless, and a keyword search for one spelling misses the other.',
        'Use British spelling throughout for UK roles (optimised, analysed, organised).',
        mixed.map(([uk, us]) => `“${uk}…” and “${us}…”`))
    }
  }

  /* ═══ 5. Length and keywords ═════════════════════════════════════════ */
  {
    const pagesLabel = `${doc.pagesEstimated ? 'about ' : ''}${plural(doc.pages, 'page')}`
    let pts = 5
    let detail = `${pagesLabel}, ${wordTotal.toLocaleString('en-GB')} words. A good length for a student or graduate CV.`
    let fix = ''
    if (doc.pages >= 3) {
      pts = 1
      detail = `${pagesLabel}, ${wordTotal.toLocaleString('en-GB')} words. Too long: recruiters rarely read past page two.`
      fix = 'Cut to one page (two at most). Drop older, weaker and repeated points first.'
    } else if (wordTotal < 220) {
      pts = 2
      detail = `Only ${wordTotal} words. There is too little here for a search to match or a recruiter to judge.`
      fix = 'Add projects, society roles and part-time work, each with 2–4 bullets. Aim for 350–700 words.'
    } else if (wordTotal > 1100) {
      pts = 2
      detail = `${wordTotal.toLocaleString('en-GB')} words on ${pagesLabel}. Too dense to skim.`
      fix = 'Cut to 350–700 words for one page. Keep the bullets with numbers; drop the rest.'
    } else if (doc.pages === 2) {
      pts = 4
      detail = `${pagesLabel}, ${wordTotal.toLocaleString('en-GB')} words. Fine, but one page is the norm for students and most graduate schemes.`
      fix = 'If you have under two years of experience, tighten it to one page.'
    } else if (wordTotal < 320 || wordTotal > 850) {
      pts = 4
      detail = `${pagesLabel}, ${wordTotal.toLocaleString('en-GB')} words. ${wordTotal < 320 ? 'A little light.' : 'A little dense for one page.'}`
      fix = wordTotal < 320 ? 'Add a project or a few more bullets. 350–700 words fills a page well.' : 'Trim towards 700 words so the page has room to breathe.'
    }
    add('length', 'length', 'Length', pts, 5, detail, fix)
  }

  const skills = findSkills(text)
  {
    const inSection = has('skills') ? findSkills(sectionText('skills')).length : 0
    const c = skills.length
    add('keywords', 'length', 'Searchable technical skills', c >= 10 ? 5 : c >= 6 ? 4 : c >= 3 ? 2 : c >= 1 ? 1 : 0, 5,
      c
        ? `${plural(c, 'recognised technical skill')} named${has('skills') ? `, ${inSection} of them in your skills section` : ''}: ${skills.slice(0, 12).join(', ')}${c > 12 ? '…' : ''}.`
        : 'No recognised technical skills found. A recruiter searching for “Python” or “SQL” would never see this CV.',
      'Name every language, framework and tool you have genuinely used, spelled the way job adverts spell them. Aim for 10 or more.')
  }

  /* ── Totals ──────────────────────────────────────────────────────── */
  const categories: CategoryScore[] = (Object.keys(CATEGORY_LABELS) as CategoryId[]).map(id => {
    const own = checks.filter(c => c.category === id)
    return { id, label: CATEGORY_LABELS[id], earned: own.reduce((a, c) => a + c.points, 0), max: own.reduce((a, c) => a + c.max, 0) }
  })
  const earned = categories.reduce((a, c) => a + c.earned, 0)
  const possible = categories.reduce((a, c) => a + c.max, 0)
  const score = Math.round((earned / possible) * 100)

  const band: Report['band'] = score >= 85 ? 'strong' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor'
  const verdict = {
    strong: 'ATS-ready. A parser will read this cleanly and the content is strong.',
    good: 'Good. It will parse, and a few fixes would make it rank higher.',
    fair: 'Needs work. Parts of this will be misread or will rank low.',
    poor: 'High risk. A parser is likely to misread this CV or rank it near the bottom.',
  }[band]

  const parsed: ParsedFields = {
    name, email: email ?? null, phone, linkedin, github, location,
    sections: sections.filter(s => s.id !== null).map(s => s.title),
    skills,
    pages: doc.pages,
    pagesEstimated: doc.pagesEstimated,
    words: wordTotal,
    bullets: glyphBullets || bullets.length,
  }

  return {
    score, band, verdict, readable: true, categories, checks, parsed,
    plainText: text,
    jobMatch: matchJob(text, jobDescription),
  }
}
