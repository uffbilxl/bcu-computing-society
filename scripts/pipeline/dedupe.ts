import { prisma } from '../../src/lib/prisma'
import type { RawListing } from './types'

/* The importer identifies a listing by its sourceUrl, which is right within a
 * source but blind across them: Amex's software internship on TargetJobs and
 * the same posting on LinkedIn have different URLs and would both be added.
 *
 * So a listing from a secondary source is dropped when the same company and
 * title are already present — either earlier in this run or open on the site.
 * Deliberately conservative: titles must match word for word (punctuation
 * and case aside), and companies must match word-wise so "JPMorganChase"
 * meets "JPMorgan Chase & Co." and "Tesco" meets "Tesco Ireland", but "Arm"
 * does not meet "Armstrong". A
 * duplicate that slips through costs one extra card; a false match silently
 * hides a real opportunity.
 *
 * Titles are the weak signal: Trackr calls Bank of America's programme
 * "Cyber Security, Summer 2027 Analyst" where TargetJobs has the employer's
 * full title. So the employer's own application link is a second key — the
 * aggregators that expose it (TargetJobs, Trackr) point at the same ATS
 * posting whatever they title it. */

const COMPANY_NOISE = /\b(the|ltd|limited|plc|llc|inc|group|uk|co|and)\b/g

/** The company's significant words, legal suffixes and filler removed. */
function companyKey(name: string): string[] {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(COMPANY_NOISE, ' ').split(' ').filter(Boolean)
}

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/* Same company when one name's words lead the other's ("tesco" / "tesco
 * ireland"), or when they differ only in spacing ("jpmorganchase" /
 * "jpmorgan chase"). Whole words only — a character prefix let "arm" match
 * "armstrong". */
/* An apply link reduced to host and path, tracking parameters dropped
 * (Trackr adds utm_source to every link). Only links carrying a job id —
 * a run of digits in the path — are keys: a bare careers page like
 * "careers.example.com/students" is shared by every programme at that
 * employer and would collapse them all into one. */
function applyKey(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const path = u.pathname.toLowerCase().replace(/\/+$/, '')
    if (!/\d{4,}/.test(path)) return null
    return u.hostname.toLowerCase().replace(/^www\./, '') + path
  } catch {
    return null
  }
}

function sameCompany(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false
  if (a.join('') === b.join('')) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  return short.every((w, i) => long[i] === w)
}

export async function dropCrossSourceDuplicates(
  listings: RawListing[],
  alreadyCollected: RawListing[],
): Promise<RawListing[]> {
  const ownDomain = listings[0]?.sourceDomain
  const known: { company: string[]; title: string }[] = alreadyCollected.map(l => ({
    company: companyKey(l.company),
    title: titleKey(l.title),
  }))
  const knownApply = new Set<string>()
  for (const l of alreadyCollected) {
    const k = applyKey(l.applyUrl)
    if (k) knownApply.add(k)
  }

  // Rows this same source imported on earlier runs are excluded, so they
  // still flow through the importer and get refreshed.
  const open = await prisma.opportunity.findMany({
    where: { status: { not: 'CLOSED' } },
    select: { title: true, sourceUrl: true, applyUrl: true, company: { select: { name: true } } },
  })
  for (const o of open) {
    if (ownDomain && o.sourceUrl?.includes(ownDomain)) continue
    known.push({ company: companyKey(o.company?.name ?? ''), title: titleKey(o.title) })
    const k = applyKey(o.applyUrl)
    if (k) knownApply.add(k)
  }

  const byTitle = new Map<string, string[][]>()
  for (const k of known) {
    const list = byTitle.get(k.title)
    if (list) list.push(k.company)
    else byTitle.set(k.title, [k.company])
  }

  /* The same source can also post one role twice under sibling company
   * pages — "Tesco" and "Tesco Ireland" at the same Welwyn office. Location
   * is part of this key so genuine multi-city postings (Reply's graduate
   * scheme in London and in Manchester) both survive. */
  const kept: { company: string[]; title: string; location: string }[] = []

  return listings.filter(l => {
    const title = titleKey(l.title)
    const c = companyKey(l.company)
    const location = titleKey(l.location ?? '')

    const apply = applyKey(l.applyUrl)
    if (apply && knownApply.has(apply)) return false

    const companies = byTitle.get(title)
    if (companies?.some(k => sameCompany(k, c))) return false
    if (kept.some(k => k.title === title && k.location === location && sameCompany(k.company, c))) return false

    kept.push({ company: c, title, location })
    if (apply) knownApply.add(apply)
    return true
  })
}
