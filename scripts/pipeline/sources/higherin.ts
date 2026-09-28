import type { Page } from 'playwright'
import type { RawListing } from '../types'
import { paginate } from './util'

export const DOMAIN = 'higherin.com'

/* Jobs are sector-filtered at source. The unfiltered equivalents cover every
 * sector (578 listings against 166 here), so we were paying the LLM to read
 * and reject ~412 marketing, law and retail roles every run, and leaning on it
 * never to misjudge one. HigherIn's own /technology facet is the same filter
 * Gradcracker and TargetJobs already get from their URLs. */
/* The two insight facets are the only place any aggregator carries spring
 * weeks and insight days: Gradcracker's taxonomy stops at graduate jobs,
 * placements/internships and degree apprenticeships, and TargetJobs' IT
 * categories only ever return opportunityType Internship, Graduate job or
 * Placement. Without these two URLs the pipeline could not produce a
 * SPRING_WEEK or INSIGHT row at all.
 *
 * Unlike the job facets these are NOT sector-filtered. Employers file spring
 * weeks under their own sector, so a bank's technology spring insight sits
 * under banking-finance and /insights/technology held just 6 listings — none
 * of them from a bank. The whole insight set is ~60 listings, so letting the
 * LLM's relevance check sort tech streams from law and audit costs a handful
 * of extra calls.
 *
 * They overlap (a spring insight programme shows up under both) — the
 * sourceUrl de-dupe at the bottom of this file handles that. Note there is
 * no /spring-weeks facet: that path resolves but silently ignores the
 * filter and returns the unfiltered job list, so it must not be added. */
const SEARCH_URLS = [
  'https://higherin.com/search-jobs/internships/technology',
  'https://higherin.com/search-jobs/graduates/technology',
  'https://higherin.com/search-jobs/placements/technology',
  'https://higherin.com/search-jobs/insights',
  'https://higherin.com/search-jobs/insight-day',
]

/* HigherIn (formerly RateMyPlacement/RateMyApprenticeship) renders results
 * client-side. Job title links are the only reliable anchor — they match
 * /jobs/{numericId}/{company-slug}/{title-slug}. Everything else (company,
 * deadline, salary, location) is read from the surrounding card's text.
 *
 * Results are paginated at ?page=N with only 20 per page — graduates alone
 * reports 152 results across 8 pages. Reading page 1 only, as this did
 * previously, surfaced barely an eighth of the source. */
export async function scrapeHigherIn(page: Page, warnings: string[] = []): Promise<RawListing[]> {
  const listings: RawListing[] = []

  for (const url of SEARCH_URLS) {
    // The category is the segment after /search-jobs/, with or without a
    // trailing sector facet.
    const category = url.split('/search-jobs/')[1].split('/')[0]

    const cards = await paginate(
      page,
      url,
      () =>
        page.evaluate(() => {
          const out: { href: string; text: string }[] = []
          const links = Array.from(document.querySelectorAll('a')).filter(a =>
            /higherin\.com\/jobs\/\d+\//.test(a.href) && a.innerText.trim().length > 20
          )
          const seen = new Set<string>()
          for (const link of links) {
            if (seen.has(link.href)) continue
            seen.add(link.href)
            // The title link's own innerText already contains the whole card:
            // title / company / "Deadline: ..." / type / salary? / location
            out.push({ href: link.href, text: (link as HTMLElement).innerText })
          }
          return out
        }),
      { label: `HigherIn ${category}`, warnings, readySelector: 'a[href*="/jobs/"]', settleMs: 3000 },
    )

    for (const c of cards) {
      const lines = c.text.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) continue
      const [title, company, ...rest] = lines
      const grab = (label: string) => {
        const line = rest.find(l => l.toLowerCase().startsWith(label.toLowerCase()))
        return line?.split(':')[1]?.trim()
      }
      const salaryText = rest.find(l => /£/.test(l))
      // Location is the trailing line that isn't a deadline/type/salary label
      const location = [...rest].reverse().find(
        l => !/^deadline/i.test(l) && !/£/.test(l) && l !== salaryText && l.length < 100
      )

      listings.push({
        sourceDomain: DOMAIN,
        sourceUrl: c.href,
        title,
        company: company || 'Unknown',
        location,
        deadlineText: grab('Deadline'),
        salaryText,
        typeHint: rest.find(l => /internship|graduate|placement|apprentice|insight|spring/i.test(l)) || category,
        descriptionRaw: lines.join(' '),
      })
    }
  }

  const seen = new Set<string>()
  return listings.filter(l => (seen.has(l.sourceUrl) ? false : (seen.add(l.sourceUrl), true)))
}
