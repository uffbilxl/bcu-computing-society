import type { RawListing } from '../types'
import { sleep } from './util'

export const DOMAIN = 'linkedin.com'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/* LinkedIn is where most employers post first — Monzo, Figma, Stripe, Scale AI,
 * JPMorgan's immersion programme and Amazon's SDE internship were all live
 * there and absent from the three aggregators. We read the same logged-out
 * job search anyone gets at linkedin.com/jobs without signing in: plain HTML
 * fragments, no session, no auth.
 *
 * f_E=1 is LinkedIn's "Internship" experience level, but it only holds when
 * the keywords point the same way. A broad "software engineer" search with
 * f_E=1 came back mostly Senior and Staff roles — 190 of 248 in a test run —
 * so every query names the student level itself, and STUDENT_TITLE below
 * is the actual gate.
 *
 * Deliberately not a spring week source. Every spring week / insight query
 * tried returned nothing but unrelated roles, with or without f_E — employers
 * run those through their own portals, not LinkedIn jobs. */
const QUERIES = [
  'software engineer intern',
  'software engineering internship',
  'graduate software engineer',
  'graduate developer',
  'data intern',
  'data graduate',
  'machine learning intern',
  'cyber security intern',
  'cyber security graduate',
  'technology graduate programme',
  'technology summer internship',
  'industrial placement software',
]

/* A title has to say it is a student-level role. Checked on the search card,
 * before the detail request, so the senior roles that leak through f_E cost
 * nothing beyond the search page they arrived on. */
const STUDENT_TITLE = /\b(intern|interns|internship|graduate|grad|new grad|placement|industrial|year in industry|student|undergraduate|trainee|apprentice|apprenticeship|early careers?|summer analyst|campus)\b/i
const SENIOR_TITLE = /\b(senior|staff|principal|lead|head|manager|director|ii|iii|iv)\b/i

const SEARCH_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search'
const DETAIL_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting'

/** 10 results per page; past 3 pages the results stop being student roles. */
const PAGES_PER_QUERY = 3
const PAGE_SIZE = 10

/* Sequential and slow on purpose. LinkedIn answers 429 as soon as requests
 * come quickly, and GitHub's runner IPs get less slack than a home
 * connection. On a 429 we stop the whole source rather than retry through
 * it — same stance as the other scrapers, we don't work around rate limits. */
const REQUEST_DELAY_MS = Number(process.env.LINKEDIN_DELAY_MS ?? 2500)

/* Without a timeout a stalled connection hangs the run: a test run with no
 * limit took 73 minutes for what should have been 12. */
const TIMEOUT_MS = 15000

class RateLimited extends Error {}

async function get(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-GB,en;q=0.9' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 429 || res.status === 999) throw new RateLimited(`LinkedIn returned ${res.status}`)
  if (!res.ok) throw new Error(`LinkedIn returned ${res.status} for ${url}`)
  return res.text()
}

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function match(html: string, re: RegExp): string {
  const m = html.match(re)
  return m ? decode(m[1]) : ''
}

interface Card { id: string; title: string; company: string; location: string; posted: string }

/* Each result is an <li> holding a base-card whose data-entity-urn carries
 * the numeric job id. The id is the stable identity — the card's own link
 * carries per-request tracking params (refId, trackingId, position) and a
 * uk./www. host that varies, so we rebuild a canonical URL from the id. */
function parseCards(html: string): Card[] {
  const out: Card[] = []
  for (const chunk of html.split('<li>').slice(1)) {
    const id = chunk.match(/urn:li:jobPosting:(\d+)/)?.[1]
    if (!id) continue
    out.push({
      id,
      title: match(chunk, /base-search-card__title[^>]*>([\s\S]*?)<\/h3>/),
      company: match(chunk, /base-search-card__subtitle[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)
        || match(chunk, /base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/),
      location: match(chunk, /job-search-card__location[^>]*>([\s\S]*?)<\/span>/),
      posted: chunk.match(/<time[^>]*datetime="([^"]+)"/)?.[1] ?? '',
    })
  }
  return out
}

/* The detail fragment carries the full description and the job's criteria
 * list (seniority, employment type, function, industry). The seniority is
 * the useful part: f_E=1 is a search filter, not a guarantee, and the odd
 * "Mid-Senior level" role still slips into the results. */
function parseDetail(html: string): { description: string; seniority: string; employmentType: string } {
  const criteria = Array.from(html.matchAll(/description__job-criteria-text[^>]*>([\s\S]*?)</g)).map(m => decode(m[1]))
  return {
    description: match(html, /show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/),
    seniority: criteria[0] ?? '',
    employmentType: criteria[1] ?? '',
  }
}

const SENIOR = /mid-senior|director|executive|associate/i

export async function scrapeLinkedIn(warnings: string[] = []): Promise<RawListing[]> {
  const cards = new Map<string, Card>()

  search: for (const q of QUERIES) {
    for (let p = 0; p < PAGES_PER_QUERY; p++) {
      const params = new URLSearchParams({
        keywords: q,
        location: 'United Kingdom',
        f_E: '1',
        start: String(p * PAGE_SIZE),
      })
      let page: Card[]
      try {
        page = parseCards(await get(`${SEARCH_URL}?${params}`))
      } catch (err) {
        if (err instanceof RateLimited) {
          warnings.push(`LinkedIn: rate limited during search "${q}" page ${p + 1}; stopped with ${cards.size} listings`)
          break search
        }
        warnings.push(`LinkedIn search "${q}" page ${p + 1}: ${(err as Error).message}`)
        break
      }
      await sleep(REQUEST_DELAY_MS)
      if (page.length === 0) break
      for (const c of page) {
        if (cards.has(c.id) || !STUDENT_TITLE.test(c.title) || SENIOR_TITLE.test(c.title)) continue
        cards.set(c.id, c)
      }
    }
  }

  const listings: RawListing[] = []
  let rateLimited = false

  for (const c of Array.from(cards.values())) {
    if (!c.title || !c.company) continue

    // Keep the card even when the detail fetch fails — title, company and
    // location are enough for structuring, the description just sharpens it.
    let detail = { description: '', seniority: '', employmentType: '' }
    if (!rateLimited) {
      try {
        detail = parseDetail(await get(`${DETAIL_URL}/${c.id}`))
      } catch (err) {
        if (err instanceof RateLimited) {
          rateLimited = true
          warnings.push(`LinkedIn: rate limited fetching job details; remaining listings kept without descriptions`)
        }
      }
      await sleep(REQUEST_DELAY_MS)
    }

    if (SENIOR.test(detail.seniority)) continue

    const url = `https://www.linkedin.com/jobs/view/${c.id}`
    listings.push({
      sourceDomain: DOMAIN,
      sourceUrl: url,
      // Logged-out job pages don't expose the employer's own apply link, so
      // the LinkedIn posting is the destination.
      applyUrl: url,
      title: c.title,
      company: c.company,
      location: c.location,
      typeHint: [detail.seniority, detail.employmentType].filter(Boolean).join(', ') || undefined,
      descriptionRaw: [c.posted ? `Posted ${c.posted}.` : '', detail.description].filter(Boolean).join(' ').slice(0, 1500) || undefined,
    })
  }

  return listings
}
