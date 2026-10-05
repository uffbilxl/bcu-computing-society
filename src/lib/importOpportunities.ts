import { prisma } from './prisma'
import { openDeadlineFloor } from './time'
import type { OpportunityType, WorkMode, Status } from '@prisma/client'

/* Core "structured rows → DB" logic, shared by:
 *  - the manual CSV upload at /admin/opportunities/import (via the API route)
 *  - the automated scrape pipeline (scripts/pipeline/run.ts), called in-process
 *
 * Both feed the exact same row shape (Record<string,string> with the same
 * flexible column names) so this function never needs to know whether a row
 * came from an uploaded file or a scraper — CSV is just the schema shape.
 */

// ─── Defence company blocklist ───────────────────────────────────────────────
const DEFENCE_BLOCKLIST = new Set([
  'bae systems', 'leonardo', 'ultra', 'ultra electronics',
  'lockheed martin', 'raytheon', 'rtx', 'northrop grumman',
  'general dynamics', 'l3harris', 'qinetiq', 'dstl', 'mbda',
  'thales', 'saab', 'rheinmetall', 'elbit systems',
  'rafael', 'airbus defence', 'airbus defence and space',
  'serco', 'leidos', 'saic', 'dyncorp', 'mantech',
  'rolls-royce defence', 'cobham', 'ultra intelligence',
  'chemring', 'meggitt', 'avon protection', 'babcock',
  'cern', // nuclear/particle-physics research — excluded per site policy
])

/* Exact-set matching let every naming variant straight through: the list has
 * "lockheed martin" but the listing said "Lockheed Martin UK", so it imported.
 * Same for "Thales Group", "BAE Systems plc" and so on.
 *
 * Match on a normalised word prefix instead. A blocklisted name matches when
 * its words are the leading words of the company name, which covers arbitrary
 * trailing suffixes (UK / plc / Group / International) without the false
 * positives a plain substring test would cause — "Cerner" does not start with
 * the word "cern", though it does contain it as a substring.
 *
 * Prefix matching also keeps the list's existing intent for partial entries:
 * "rolls-royce defence" still requires that third word, so plain "Rolls-Royce"
 * (civil aerospace and power systems) stays allowed. */
function normaliseCompany(name: string): string[] {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  return words[0] === 'the' ? words.slice(1) : words
}

function isDefenceCompany(name: string): boolean {
  const words = normaliseCompany(name)
  if (words.length === 0) return false

  for (const blocked of Array.from(DEFENCE_BLOCKLIST)) {
    const blockedWords = normaliseCompany(blocked)
    if (blockedWords.length > words.length) continue
    if (blockedWords.every((w, i) => words[i] === w)) return true
  }
  return false
}

// ─── URL normalisation ───────────────────────────────────────────────────────
export function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, '')
}

export function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

// ─── Row field matching (flexible column names) ─────────────────────────────
export function field(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const norm = k.toLowerCase().replace(/[^a-z0-9]+/g, '')
    if (row[norm] !== undefined && row[norm] !== '') return row[norm]
  }
  return ''
}

// ─── Type inference ───────────────────────────────────────────────────────────
/* Handles both kinds of input this sees: the free text a hand-written CSV
 * carries ("Spring week", "Insight day"), and the exact enum values the
 * scraper pipeline emits ("SPRING_WEEK", "INSIGHT"). Separators are
 * flattened to spaces first so both spellings take the same branch —
 * without that, "SPRING_WEEK" matched none of the phrases below and every
 * pipeline-structured spring week and insight day was silently filed as an
 * INTERNSHIP. */
function inferType(raw: string): OpportunityType {
  const t = raw.toLowerCase().replace(/[_-]+/g, ' ')
  // 'spring insight' contains 'insight', so spring has to be tested first.
  if (t.includes('spring week') || t.includes('spring insight') || t.includes('spring programme')) return 'SPRING_WEEK'
  if (t.includes('insight')) return 'INSIGHT'
  if (t.includes('placement') || t.includes('industrial placement') || t.includes('year in industry')) return 'PLACEMENT'
  if (t.includes('graduate') || t.includes('grad ') || t.includes('new grad') || t.includes('new analyst') || t.includes('apprenticeship')) return 'GRADUATE'
  return 'INTERNSHIP'
}

function normalizeWorkMode(raw: string): WorkMode {
  const t = raw.trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (t === 'REMOTE') return 'REMOTE'
  if (['ONSITE', 'ON_SITE', 'IN_PERSON', 'IN_OFFICE', 'OFFICE'].includes(t)) return 'ONSITE'
  return 'HYBRID'
}

function normalizeStatus(raw: string): Status {
  const t = raw.trim().toUpperCase()
  if (t === 'CLOSED' || t === 'CLOSE' || t === 'EXPIRED') return 'CLOSED'
  if (t === 'CLOSING_SOON' || t === 'CLOSING SOON' || t === 'CLOSING') return 'CLOSING_SOON'
  return 'OPEN'
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 60)
}

// ─── Result shape ────────────────────────────────────────────────────────────
export interface ImportResults {
  added: number
  updated: number
  closed: number
  skipped: number
  blocked: number
  errors: string[]
}

export interface ImportOptions {
  /**
   * Hostnames actually (re-)covered by this batch, e.g. ['gradcracker.com'].
   * When provided, the "close anything no longer listed" sweep only ever
   * touches opportunities whose applyUrl hostname is in this set — so a
   * scrape run covering source A never closes opportunities that came from
   * source B (or from a manual CSV import) just because A didn't happen to
   * carry them. Omit this (as the manual CSV upload does) to preserve the
   * original behaviour: the batch is treated as the complete list and
   * anything open-but-absent gets closed, regardless of domain.
   */
  sourceDomains?: string[]
}

export async function importOpportunityRows(
  rows: Record<string, string>[],
  options: ImportOptions = {}
): Promise<ImportResults> {
  const results: ImportResults = {
    added: 0, updated: 0, closed: 0, skipped: 0, blocked: 0, errors: [],
  }

  // Collect all normalised URLs in this batch for the "close unlisted" pass
  const batchUrls = new Set<string>()
  const seenUrls = new Set<string>()

  for (const row of rows) {
    const title = field(row, 'opportunity name', 'title', 'role', 'job title', 'position', 'job')
    const companyName = field(row, 'company name', 'company', 'employer', 'organization', 'organisation')
    const rawType = field(row, 'opportunity type', 'type', 'category', 'kind')
    const location = field(row, 'location', 'city', 'place', 'region') || 'United Kingdom'
    const applyUrl = field(row, 'direct apply link', 'apply url', 'apply link', 'url', 'link', 'applyurl', 'applicationurl', 'apply')
    // The stable listing page this came from — falls back to applyUrl when a
    // row doesn't distinguish the two (e.g. manual CSV uploads), which keeps
    // that path's identity/dedup behaviour exactly as it was before.
    const sourceUrl = field(row, 'source url', 'sourceurl') || applyUrl
    const startDate = field(row, 'estimated start date', 'start date', 'startdate', 'start')
    const deadlineRaw = field(row, 'application deadline', 'deadline', 'closing date', 'closes')
    const logoUrl = field(row, 'company logo png url', 'logo', 'logo url', 'company logo')
    const companyWebsiteRaw = field(row, 'company website', 'website', 'company url')
    // Normalise a bare domain (e.g. "apple.com", as the LLM returns) into a
    // full URL so getDomain() and the stored company link both work.
    const companyWebsite = companyWebsiteRaw
      ? (companyWebsiteRaw.startsWith('http') ? companyWebsiteRaw : `https://${companyWebsiteRaw}`)
      : ''
    const rawWorkMode = field(row, 'work mode', 'workmode', 'mode', 'remote')
    const rawStatus = field(row, 'status', 'open/closed', 'state')
    const rawFeatured = field(row, 'featured')
    const rawSponsored = field(row, 'sponsored')
    const descriptionOverride = field(row, 'description')

    if (!title || !companyName) { results.skipped++; continue }

    if (isDefenceCompany(companyName)) {
      results.blocked++
      continue
    }

    // Identity/dedup runs on sourceUrl (the stable listing page), not
    // applyUrl (the real destination) — the latter can point at a shared
    // company ATS URL or change slightly between scrapes of the same listing.
    const normIdentity = sourceUrl ? normalizeUrl(sourceUrl) : ''
    if (normIdentity) {
      batchUrls.add(normIdentity)
      if (seenUrls.has(normIdentity)) { results.skipped++; continue }
      seenUrls.add(normIdentity)
    }

    const type = inferType(rawType)
    const workMode = normalizeWorkMode(rawWorkMode)
    const status = normalizeStatus(rawStatus)
    const featured = ['true', '1', 'yes'].includes(rawFeatured.toLowerCase())
    const sponsored = ['true', '1', 'yes'].includes(rawSponsored.toLowerCase())

    let deadline: Date | null = null
    if (deadlineRaw && deadlineRaw.toLowerCase() !== 'rolling') {
      const d = new Date(deadlineRaw)
      if (!isNaN(d.getTime())) deadline = d
    }

    const description = descriptionOverride || `${title} at ${companyName}. Based in ${location}.`

    try {
      const companySlug = toSlug(companyName)
      // Prefer the company's own site for the logo/domain when we have one —
      // applyUrl may point at a job-board aggregator or third-party ATS
      // rather than the employer itself, which would fetch the wrong favicon.
      const domain = companyWebsite ? getDomain(companyWebsite) : applyUrl ? getDomain(applyUrl) : ''
      const logo = logoUrl || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256` : null)

      const company = await prisma.company.upsert({
        where: { slug: companySlug },
        update: { logo: logo ?? undefined, website: companyWebsite || undefined },
        create: {
          name: companyName,
          slug: companySlug,
          logo,
          website: companyWebsite || (domain ? `https://${domain}` : null),
        },
      })

      const existing = normIdentity
        ? await prisma.opportunity.findFirst({ where: { sourceUrl: { equals: sourceUrl, mode: 'insensitive' } } })
        : await prisma.opportunity.findFirst({ where: { title, companyId: company.id } })

      if (existing) {
        // Pick up a better applyUrl if this scrape found one (e.g. a listing
        // originally imported pointing at an aggregator page now resolves to
        // the real company destination) — upgrades legacy rows over time
        // without needing a one-off migration.
        const betterApplyUrl = applyUrl && applyUrl !== existing.applyUrl ? applyUrl : undefined

        if (status === 'CLOSED' && existing.status !== 'CLOSED') {
          await prisma.opportunity.update({
            where: { id: existing.id },
            data: { status: 'CLOSED', ...(betterApplyUrl ? { applyUrl: betterApplyUrl } : {}) },
          })
          results.closed++
        } else if (status !== 'CLOSED' && existing.status !== status) {
          await prisma.opportunity.update({
            where: { id: existing.id },
            data: { status, ...(betterApplyUrl ? { applyUrl: betterApplyUrl } : {}) },
          })
          results.updated++
        } else if (betterApplyUrl) {
          await prisma.opportunity.update({ where: { id: existing.id }, data: { applyUrl: betterApplyUrl } })
          results.updated++
        } else {
          results.skipped++
        }
        continue
      }

      const baseSlug = toSlug(`${companySlug}-${toSlug(title)}`)
      let slug = baseSlug
      let n = 0
      while (await prisma.opportunity.findFirst({ where: { slug } })) {
        n++
        slug = `${baseSlug.substring(0, 55)}-${n}`
      }

      await prisma.opportunity.create({
        data: {
          title, slug, description, type, location, workMode, status,
          featured, sponsored,
          applyUrl: applyUrl || null,
          sourceUrl: sourceUrl || null,
          startDate: startDate || null,
          deadline,
          companyId: company.id,
        },
      })
      results.added++
    } catch (err) {
      results.errors.push(`Error on "${title}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  /* ── Close anything currently OPEN that wasn't in this batch ────────────
   *
   * Requires sourceDomains. This sweep treats the batch as the complete truth
   * for the domains it names, so running it unscoped means "everything not in
   * these rows is dead" — a three-row import closed 501 live opportunities
   * before this guard existed, and the admin CSV upload route calls this
   * function exactly that way, so any partial spreadsheet would have wiped the
   * site.
   *
   * A partial import is the normal case and must never close anything. Only
   * the scrape pipeline, which knows which sources it actually covered this
   * run, can honestly make that claim — so it has to say so explicitly. */
  if (batchUrls.size > 0 && options.sourceDomains && options.sourceDomains.length > 0) {
    const openWithUrl = await prisma.opportunity.findMany({
      where: { status: { not: 'CLOSED' }, sourceUrl: { not: null } },
      select: { id: true, sourceUrl: true },
    })

    for (const entry of openWithUrl) {
      if (!entry.sourceUrl) continue

      // Only close opportunities whose source domain this batch actually
      // covered; a run touching a subset of sources must leave the rest alone.
      const entryDomain = getDomain(entry.sourceUrl)
      if (!options.sourceDomains.includes(entryDomain)) continue

      if (!batchUrls.has(normalizeUrl(entry.sourceUrl))) {
        await prisma.opportunity.update({ where: { id: entry.id }, data: { status: 'CLOSED' } })
        results.closed++
      }
    }
  }

  // ── Close anything whose deadline has simply passed ───────────────────
  // Independent of the source-scoped sweep above (and of whether this batch
  // covered that opportunity's source at all) — a passed deadline means
  // it's over regardless of what the scrape did or didn't find today.
  const expired = await prisma.opportunity.updateMany({
    // Calendar-day comparison: a role is open all of its deadline day.
    where: { status: { not: 'CLOSED' }, deadline: { lt: openDeadlineFloor() } },
    data: { status: 'CLOSED' },
  })
  results.closed += expired.count

  // ── Retire anything from a blocklisted company ────────────────────────
  // The import-time check only stops new rows, so anything that landed while
  // the blocklist had a gap would sit there indefinitely — exact-set matching
  // previously let "Lockheed Martin UK" and "Babcock International Group"
  // through. Re-checking every live row makes the blocklist self-healing:
  // widen it and the next run retires what it now covers. Closing rather than
  // deleting is enough, since the public API already excludes CLOSED.
  const live = await prisma.opportunity.findMany({
    where: { status: { not: 'CLOSED' } },
    select: { id: true, company: { select: { name: true } } },
  })
  const nowBlocked = live.filter(o => o.company && isDefenceCompany(o.company.name))
  if (nowBlocked.length > 0) {
    await prisma.opportunity.updateMany({
      where: { id: { in: nowBlocked.map(o => o.id) } },
      data: { status: 'CLOSED' },
    })
    results.blocked += nowBlocked.length
    results.errors.push(
      `Retired ${nowBlocked.length} live listing(s) from blocklisted companies: ` +
      Array.from(new Set(nowBlocked.map(o => o.company!.name))).join(', ')
    )
  }

  return results
}
