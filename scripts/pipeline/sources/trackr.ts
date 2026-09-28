import type { RawListing } from '../types'
import { sleep } from './util'

export const DOMAIN = 'app.the-trackr.com'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/* Trackr's UK Tech tracker is the one place bank and quant tech spring weeks
 * are listed at all — none of Gradcracker, HigherIn, TargetJobs or LinkedIn
 * carried Morgan Stanley's, JPM's or BlackRock's — and it links straight to
 * the employer's own application page with real opening and closing dates.
 *
 * The tracker page renders from a JSON API that answers without a session,
 * one call per programme type, returning the whole season's list. Being the
 * complete list (not a ranked slice like LinkedIn search), a programme
 * missing from it really has gone, so this source takes part in the
 * close-by-absence sweep.
 *
 * Their Finance tracker was checked and carries no Tech divisions, so the
 * Tech industry alone covers the bank technology programmes. */
const API_URL = 'https://api.the-trackr.com/programmes'

/* Keys are Trackr's type slugs, values the hint handed to the structuring
 * step. Note the graduate slug is "graduate-programmes"; "graduate-schemes"
 * (the tab's label) silently returns an empty list.
 *
 * The spring weeks tab is really "first-year programmes": alongside the
 * spring insights it carries summer internships open to first-years (Marshall
 * Wace, JPM's immersion programme). Its hint says so, so the title decides
 * the type rather than the tab. */
const TYPES: Record<string, string> = {
  'summer-internships': 'Summer internship',
  'industrial-placements': 'Industrial placement',
  'graduate-programmes': 'Graduate scheme',
  'spring-weeks': 'Open to first-years (spring weeks and first-year programmes)',
  events: 'Insight event',
}

/* A season is named for the summer the programmes run in, and recruitment
 * for it opens the summer before — in September 2026 the live season is
 * 2027. Switching over in July matches when Trackr's own new trackers go up. */
function currentSeason(now: Date): number {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear()
}

interface Programme {
  id: string
  name: string
  url: string | null
  divisions?: string[] | null
  categories?: string[] | null
  locations?: string[] | null
  eligibility?: string | null
  format?: string | null
  notes?: string | null
  openingDate?: string | null
  closingDate?: string | null
  eventDate?: string | null
  company?: { name?: string; sponsorsVisa?: string | null } | null
}

/* Most of a season's programmes are placeholders: the tracker lists every
 * scheme it expects, with no link until the employer actually opens it (216
 * of 310 summer internships in late September). Only listings a student can
 * apply to today are imported — a link, opened, and not yet closed. */
function isOpen(p: Programme, today: string): boolean {
  if (!p.url) return false
  const opening = p.openingDate?.slice(0, 10)
  const closing = p.closingDate?.slice(0, 10)
  if (opening && opening > today) return false
  if (closing && closing < today) return false
  return true
}

export async function scrapeTrackr(warnings: string[] = []): Promise<RawListing[]> {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const season = currentSeason(now)
  const listings: RawListing[] = []

  for (const [type, typeHint] of Object.entries(TYPES)) {
    const params = new URLSearchParams({ region: 'UK', industry: 'Tech', season: String(season), type })
    let programmes: Programme[]
    try {
      const res = await fetch(`${API_URL}?${params}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      programmes = (await res.json())?.programmes ?? []
    } catch (err) {
      warnings.push(`Trackr ${type}: ${(err as Error).message}`)
      continue
    }
    // An empty list for a type that always has entries means the API or
    // season naming changed, not that every employer closed at once.
    if (programmes.length === 0 && type !== 'events') {
      warnings.push(`Trackr ${type}: season ${season} returned no programmes`)
    }

    for (const p of programmes) {
      if (!p.id || !p.name || !p.company?.name || !isOpen(p, today)) continue

      const details = [
        p.categories?.length ? `Areas: ${p.categories.join(', ')}.` : '',
        p.divisions?.length ? `Division: ${p.divisions.map(d => d.split('|').pop()).join(', ')}.` : '',
        p.eventDate ? `Event date: ${p.eventDate}.` : '',
        p.format ? `Format: ${p.format}.` : '',
        p.eligibility ? `Eligibility: ${p.eligibility}.` : '',
        p.notes ? `Notes: ${p.notes}.` : '',
        p.openingDate ? `Opened ${p.openingDate.slice(0, 10)}.` : '',
        p.company.sponsorsVisa === 'Yes' ? 'The employer sponsors visas.' : '',
      ]

      listings.push({
        sourceDomain: DOMAIN,
        // Trackr has no per-programme page, so identity is the tracker tab
        // plus the programme's own stable id. Never shown on the site.
        sourceUrl: `https://${DOMAIN}/uk-tech/${type}#${p.id}`,
        // Left with Trackr's utm_source so the employer sees where the
        // applicant came from — the credit is theirs.
        applyUrl: p.url!,
        title: p.name,
        company: p.company.name,
        location: p.locations?.length ? p.locations.join(', ') : undefined,
        deadlineText: p.closingDate ? p.closingDate.slice(0, 10) : undefined,
        typeHint,
        descriptionRaw: details.filter(Boolean).join(' ') || undefined,
      })
    }

    await sleep(1000)
  }

  return listings
}
