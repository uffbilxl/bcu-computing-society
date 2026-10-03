/* ── CV Builder: types, default template, ATS heuristics ────── */

export interface CVEntry {
  id: string
  org: string
  role: string
  location: string
  dates: string
  bullets: string[]
}

export interface SkillRow {
  id: string
  label: string
  value: string
}

export type SectionKey = 'summary' | 'education' | 'experience' | 'extracurricular' | 'skills'

export interface CVData {
  version: 1
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  portfolio: string
  summary: string
  education: CVEntry[]
  experience: CVEntry[]
  extracurricular: CVEntry[]
  skills: SkillRow[]
  sectionOrder: SectionKey[]
}

export const SECTION_TITLES: Record<SectionKey, string> = {
  summary:         'Professional Summary',
  education:       'Education',
  experience:      'Work Experience',
  extracurricular: 'Extracurricular Activities',
  skills:          'Skills & Interests',
}

export const SUMMARY_MAX = 360
export const BULLET_MAX  = 230

export const STORAGE_KEY = 'sca-cv-builder-v1'

/* Default document: the SCA one-page template. Users edit this in place. */
export const DEFAULT_CV: CVData = {
  version: 1,
  name: 'NAME',
  email: 'EMAIL@gmail.com',
  phone: '+44 number',
  linkedin: 'LinkedIn',
  github: '',
  portfolio: '',
  summary: '',
  sectionOrder: ['summary', 'education', 'experience', 'extracurricular', 'skills'],
  education: [
    {
      id: 'edu-1',
      org: 'Birmingham City University',
      role: 'Bachelor of Science: Computer Science',
      location: 'Birmingham, UK',
      dates: '2025 – 2028',
      bullets: [
        'Average Grade: 83% (First Class)',
        'Key Modules: Module (%), Module (%)',
      ],
    },
  ],
  experience: [
    {
      id: 'exp-1',
      org: 'National Gas',
      role: 'Software Engineer Summer Intern',
      location: 'London, UK',
      dates: 'Jun 2026 – Sep 2026',
      bullets: [
        'Developed and contributed to software features within a collaborative engineering environment, working across both frontend and backend systems.',
        'Participated in debugging, testing, and code reviews to improve application performance, reliability, and user experience.',
        'Contributed to the delivery of 8+ feature updates and fixes across the internship, working within weekly sprint cycles and collaborating with a team of 5+ developers.',
      ],
    },
    {
      id: 'exp-2',
      org: 'BCU Computing Society',
      role: 'Data Analytics Intern',
      location: 'Birmingham, UK',
      dates: 'Sep 2025 – May 2026',
      bullets: [
        'Collected and analysed performance data across 15+ basketball fixtures, supporting post-match analysis and opposition preparation for the university team.',
        'Used tools such as Excel, Python, and video analysis software to track player and team performance metrics, contributing to weekly analytical reports.',
        'Worked within a student-led analytics team to deliver data-driven insights for coaches and players.',
      ],
    },
    {
      id: 'exp-3',
      org: 'Barclays',
      role: 'Insight Day',
      location: 'Knutsford, UK',
      dates: 'April 2026',
      bullets: [
        'Participated in a competitive spring insight programme at Barclays, gaining exposure to financial services, technology, and investment banking operations.',
        'Took part in networking sessions, commercial awareness workshops, and team-based case studies with Barclays professionals and fellow students.',
      ],
    },
    {
      id: 'exp-4',
      org: 'Argos',
      role: 'Sales Assistant',
      location: 'Birmingham, UK',
      dates: 'Oct 2023 – Jun 2025',
      bullets: [
        'Delivered customer service in a fast-paced retail environment while supporting daily store operations and sales targets.',
      ],
    },
  ],
  extracurricular: [
    {
      id: 'ext-1',
      org: 'BCU Computing Society',
      role: 'Events Coordinator',
      location: 'Birmingham, UK',
      dates: 'May 2026 – Present',
      bullets: [
        'Coordinated and supported the delivery of student-focused technology events, workshops, and networking sessions across the university computing community.',
        'Worked with committee members, university staff, and external partners to manage event logistics, promotion, and attendee engagement.',
      ],
    },
  ],
  skills: [
    { id: 'skl-1', label: 'Technical Skills', value: 'Python, C++, SQL, HTML/CSS, Metasploit, Splunk' },
    { id: 'skl-2', label: 'Certifications',   value: 'CompTIA Security+, CCNA 1, CCNA 2' },
    { id: 'skl-3', label: 'Interests',        value: 'Badminton, Rock-Climbing, Chess, Painting' },
  ],
}

/* ── Wording heuristics ──────────────────────────────────────── */

/* Curated subset shown as one-click suggestion chips on the template —
 * kept smaller than the full detection whitelist below so the chips stay
 * varied without overwhelming the popover. */
export const ACTION_VERBS = [
  'Developed', 'Engineered', 'Led', 'Improved', 'Designed', 'Optimised',
  'Automated', 'Secured', 'Reduced', 'Increased', 'Built', 'Created',
  'Delivered', 'Implemented', 'Launched', 'Coordinated', 'Analysed',
  'Collected', 'Managed', 'Contributed',
]

/* Full detection whitelist used for scoring — deliberately broader than
 * ACTION_VERBS above so the "starts with an action verb" check doesn't
 * unfairly flag reasonable openings the chip list just doesn't surface. */
const STRONG_STARTS = new Set(
  [
    ...ACTION_VERBS,
    'Participated', 'Collaborated', 'Used', 'Took', 'Supported', 'Presented',
    'Researched', 'Tested', 'Maintained', 'Deployed', 'Streamlined', 'Founded',
    'Organised', 'Mentored', 'Achieved', 'Won', 'Produced', 'Wrote', 'Migrated',
    'Architected', 'Spearheaded', 'Piloted', 'Remediated', 'Investigated',
    'Configured', 'Authored', 'Mitigated', 'Consolidated', 'Established',
    'Pioneered', 'Executed', 'Formulated', 'Devised', 'Enhanced', 'Expanded',
    'Strengthened', 'Facilitated', 'Negotiated', 'Resolved', 'Diagnosed',
  ].map(v => v.toLowerCase())
)

export const WEAK_PHRASES = [
  'worked on', 'helped with', 'helped to', 'responsible for', 'assisted with',
  'was involved in', 'duties included', 'tasked with', 'things like',
  'in charge of', 'worked as', 'familiar with', 'exposure to',
  'basic knowledge of', 'good understanding of', 'exposed to', 'involved with',
]

export function startsWithActionVerb(bullet: string): boolean {
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  if (!first) return false
  return STRONG_STARTS.has(first)
}

export function findWeakPhrases(text: string): string[] {
  const lower = text.toLowerCase()
  return WEAK_PHRASES.filter(p => lower.includes(p))
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/* Every pattern this is meant to catch — a bare digit sequence, a
 * percentage, a currency amount, "15+", or "2x" — necessarily contains at
 * least one digit, so a single digit test covers all of them. */
export function hasQuantifiedMetric(bullet: string): boolean {
  return /\d/.test(bullet)
}

/* Independent of scoring — surfaced as a UI nudge on the template.
 * Deliberately a wider dead zone than the scoring "ideal range" (8–30
 * words) below, so a bullet isn't simultaneously scored as non-ideal and
 * flagged as an outlier. */
export function bulletLengthIssue(bullet: string): 'short' | 'long' | null {
  if (!bullet.trim()) return null
  const wc = wordCount(bullet)
  if (wc < 5) return 'short'
  if (wc > 35) return 'long'
  return null
}

/* ── Date formatting/chronology heuristics ────────────────────── */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

type DateToken = 'YYYY' | 'MMM YYYY' | 'PRESENT' | 'OTHER'

function classifyDateToken(token: string): DateToken {
  const t = token.trim()
  if (/^present$/i.test(t)) return 'PRESENT'
  if (/^\d{4}$/.test(t)) return 'YYYY'
  if (/^[A-Za-z]{3,9}\.?\s+\d{4}$/.test(t)) return 'MMM YYYY'
  return 'OTHER'
}

/* Structural signature for a date string, e.g. "MMM YYYY:range" — an
 * ongoing "Present" end date is folded into the same bucket as its start
 * format rather than treated as its own pattern, since that's a normal,
 * expected exception rather than an inconsistency. */
function dateSignature(dateStr: string): string | null {
  const raw = dateStr.trim()
  if (!raw) return null
  const parts = raw.split(/[–—-]/).map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return null
  const startFmt = classifyDateToken(parts[0])
  if (parts.length < 2) return `${startFmt}:single`
  const endFmt = classifyDateToken(parts[1])
  if (endFmt === 'PRESENT') return `${startFmt}:range`
  return startFmt === endFmt ? `${startFmt}:range` : `${startFmt}-${endFmt}:range`
}

/* Sortable "months since year 0" value for the start of a date range, so
 * entries within a section can be checked for descending (most-recent-
 * first) order. Returns null when the start can't be confidently parsed —
 * such entries are skipped rather than penalised. */
function parseStartValue(dateStr: string): number | null {
  const startToken = dateStr.trim().split(/[–—-]/)[0]?.trim()
  if (!startToken) return null
  const mmm = startToken.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/)
  if (mmm) {
    const mi = MONTHS.indexOf(mmm[1].slice(0, 3).toLowerCase())
    return parseInt(mmm[2], 10) * 12 + (mi >= 0 ? mi : 0)
  }
  const y = startToken.match(/^(\d{4})$/)
  if (y) return parseInt(y[1], 10) * 12
  return null
}

function isSectionDescending(entries: CVEntry[]): boolean {
  const values = entries.map(e => parseStartValue(e.dates)).filter((v): v is number => v !== null)
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) return false
  }
  return true
}

/* "Differentiator" signal — a section beyond the standard Education/
 * Experience/Skills set. The CV data model doesn't have freeform custom
 * sections, so this reads the signal from the two places that already
 * carry that kind of free text: skills row labels and entry role titles. */
const DIFFERENTIATOR_KEYWORDS = ['research', 'project', 'publication', 'certification', 'leadership']

export function hasDifferentiatorSection(data: CVData): boolean {
  const haystack = [
    ...data.skills.map(s => s.label),
    ...data.experience.map(e => e.role),
    ...data.extracurricular.map(e => e.role),
  ].map(s => s.toLowerCase())
  return haystack.some(text => DIFFERENTIATOR_KEYWORDS.some(kw => text.includes(kw)))
}

/* ── ATS report ──────────────────────────────────────────────── */

export interface ATSCheck {
  label: string
  ok: boolean
  points: number   /* earned */
  max: number
  tip: string
}

export interface ATSReport {
  score: number
  checks: ATSCheck[]
  weakHits: { section: string; bullet: string; phrases: string[] }[]
  repeatedStarts: string[]
  lengthWarnings: { section: string; bullet: string; issue: 'short' | 'long' }[]
  hasDifferentiator: boolean
}

function contentBullets(data: CVData): { section: string; bullet: string }[] {
  return [
    ...data.experience.flatMap(e => e.bullets.map(b => ({ section: e.org, bullet: b }))),
    ...data.extracurricular.flatMap(e => e.bullets.map(b => ({ section: e.org, bullet: b }))),
  ].filter(x => x.bullet.trim().length > 0)
}

/* 100-point rubric: 10+5+10+5+15+5+8+15+5+7+5+10 = 100. */
export function atsReport(data: CVData, fitsOnePage: boolean): ATSReport {
  const checks: ATSCheck[] = []
  const bullets = contentBullets(data)

  // 1. Contact details — 10 (email 4, phone 3, LinkedIn/portfolio 3)
  const emailOk = /.+@.+\..+/.test(data.email) && !data.email.toUpperCase().startsWith('EMAIL')
  const phoneOk = /\d{6,}/.test(data.phone.replace(/\s/g, ''))
  const linkedinFilled = data.linkedin.trim().length > 3 && data.linkedin.trim().toLowerCase() !== 'linkedin'
  const portfolioFilled = data.portfolio.trim().length > 3
  const linkOk = linkedinFilled || portfolioFilled
  const contactPts = (emailOk ? 4 : 0) + (phoneOk ? 3 : 0) + (linkOk ? 3 : 0)
  checks.push({
    label: 'Contact details complete',
    ok: contactPts === 10, points: contactPts, max: 10,
    tip: 'Use a real email, phone number, and a LinkedIn or portfolio link so recruiters and ATS parsers can reach you.',
  })

  // 2. Education present — 5
  const eduOk = data.education.some(e => e.org.trim() && e.role.trim())
  checks.push({
    label: 'Education section present',
    ok: eduOk, points: eduOk ? 5 : 0, max: 5,
    tip: 'Include your university, degree title, and expected grade.',
  })

  // 3. Work experience present — 10
  const expOk = data.experience.some(e => e.org.trim())
  checks.push({
    label: 'Work experience present',
    ok: expOk, points: expOk ? 10 : 0, max: 10,
    tip: 'Any experience counts: internships, part-time work, insight days, society roles.',
  })

  // 4. Enough detail — 5 (full marks at 6+ bullets, else 1pt per bullet)
  const enoughBullets = bullets.length >= 6
  checks.push({
    label: 'Enough detail (6+ bullet points)',
    ok: enoughBullets, points: enoughBullets ? 5 : Math.min(5, bullets.length), max: 5,
    tip: 'Aim for 2-3 bullet points per role describing what you did and the result.',
  })

  // 5. Action verb starts — 15
  const verbCount = bullets.filter(b => startsWithActionVerb(b.bullet)).length
  const verbRatio = bullets.length ? verbCount / bullets.length : 0
  const verbPts = Math.round(verbRatio * 15)
  checks.push({
    label: 'Bullets start with action verbs',
    ok: verbRatio >= 0.7, points: verbPts, max: 15,
    tip: `Start bullets with verbs like ${ACTION_VERBS.slice(0, 6).join(', ')}…`,
  })

  // 6. Action verb variety — 5 (penalise leaning on the same opening word)
  const startCounts = new Map<string, number>()
  for (const b of bullets) {
    const first = b.bullet.trim().split(/\s+/)[0]?.toLowerCase()
    if (first) startCounts.set(first, (startCounts.get(first) ?? 0) + 1)
  }
  const totalBullets = bullets.length
  const maxFreq = startCounts.size ? Math.max(...Array.from(startCounts.values())) : 0
  const varietyThreshold = Math.max(2, Math.ceil(0.2 * totalBullets))
  let varietyPts = 5
  if (totalBullets > 0 && maxFreq > varietyThreshold) {
    varietyPts = Math.max(0, Math.round(5 * (1 - (maxFreq - varietyThreshold) / totalBullets)))
  }
  checks.push({
    label: 'Action verb variety',
    ok: maxFreq <= varietyThreshold, points: varietyPts, max: 5,
    tip: 'Avoid opening several bullets with the same verb — vary how each one starts.',
  })

  // 7. No weak wording — 8 (2pts off per hit)
  const weakHits = bullets
    .map(b => ({ ...b, phrases: findWeakPhrases(b.bullet) }))
    .filter(b => b.phrases.length > 0)
  const weakPts = Math.max(0, 8 - weakHits.length * 2)
  checks.push({
    label: 'No weak wording',
    ok: weakHits.length === 0, points: weakPts, max: 8,
    tip: 'Replace phrases like "worked on" or "familiar with" with a specific action and outcome.',
  })

  // 8. Quantified achievements — 15
  const bulletsWithMetric = bullets.filter(b => hasQuantifiedMetric(b.bullet)).length
  const metricPts = bullets.length ? Math.round(15 * (bulletsWithMetric / bullets.length)) : 0
  checks.push({
    label: 'Quantified achievements',
    ok: bullets.length > 0 && bulletsWithMetric === bullets.length, points: metricPts, max: 15,
    tip: 'Back up bullets with numbers — team size, % improvement, time saved, users reached.',
  })

  // 9. Bullet length in ideal range — 5 (8–30 words)
  const bulletsInRange = bullets.filter(b => { const wc = wordCount(b.bullet); return wc >= 8 && wc <= 30 }).length
  const lengthPts = bullets.length ? Math.round(5 * (bulletsInRange / bullets.length)) : 0
  checks.push({
    label: 'Bullet length in ideal range',
    ok: bullets.length > 0 && bulletsInRange === bullets.length, points: lengthPts, max: 5,
    tip: 'Aim for 8-30 words per bullet — enough detail without rambling.',
  })

  // 10. Skills filled in — 7
  const skillsOk = data.skills.some(s => s.value.trim().length > 0)
  checks.push({
    label: 'Skills section filled in',
    ok: skillsOk, points: skillsOk ? 7 : 0, max: 7,
    tip: 'List concrete tools and languages; ATS keyword matching relies on these.',
  })

  // 11. Date formatting & chronology — 5 (4 consistency + 1 ordering)
  const allDated = [...data.education, ...data.experience, ...data.extracurricular]
  const signatures = allDated.map(e => dateSignature(e.dates)).filter((s): s is string => s !== null)
  let dateFormatPts = 4
  if (signatures.length > 1) {
    const counts = new Map<string, number>()
    for (const s of signatures) counts.set(s, (counts.get(s) ?? 0) + 1)
    const modeCount = Math.max(...Array.from(counts.values()))
    dateFormatPts = Math.round(4 * (modeCount / signatures.length))
  }
  const chronologyOk = [data.education, data.experience, data.extracurricular].every(isSectionDescending)
  const datePts = dateFormatPts + (chronologyOk ? 1 : 0)
  checks.push({
    label: 'Date formatting & chronology',
    ok: dateFormatPts === 4 && chronologyOk, points: datePts, max: 5,
    tip: 'Use one consistent date format throughout, and list entries most-recent-first within each section.',
  })

  // 12. Fits on one page — 10
  checks.push({
    label: 'Fits on one page',
    ok: fitsOnePage, points: fitsOnePage ? 10 : 0, max: 10,
    tip: 'Trim the least relevant bullets. One page is the UK standard for student CVs.',
  })

  const repeatedStarts = Array.from(startCounts.entries())
    .filter(([, n]) => n >= 3)
    .map(([w]) => w[0].toUpperCase() + w.slice(1))

  const lengthWarnings = bullets
    .map(b => ({ ...b, issue: bulletLengthIssue(b.bullet) }))
    .filter((b): b is { section: string; bullet: string; issue: 'short' | 'long' } => b.issue !== null)

  const score = checks.reduce((sum, c) => sum + c.points, 0)
  return { score, checks, weakHits, repeatedStarts, lengthWarnings, hasDifferentiator: hasDifferentiatorSection(data) }
}
