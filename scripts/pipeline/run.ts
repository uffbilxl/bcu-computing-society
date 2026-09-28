import { chromium } from 'playwright'
import { importOpportunityRows } from '../../src/lib/importOpportunities'
import { scrapeGradcracker, DOMAIN as GRADCRACKER_DOMAIN } from './sources/gradcracker'
import { scrapeHigherIn, DOMAIN as HIGHERIN_DOMAIN } from './sources/higherin'
import { scrapeTargetJobs, DOMAIN as TARGETJOBS_DOMAIN } from './sources/targetjobs'
import { scrapeTrackr, DOMAIN as TRACKR_DOMAIN } from './sources/trackr'
import { scrapeLinkedIn, DOMAIN as LINKEDIN_DOMAIN } from './sources/linkedin'
import { structureListings } from './structure'
import { sendRunSummaryEmail } from './notify'
import { sweepDeadLinks } from './linkcheck'
import { dropCrossSourceDuplicates } from './dedupe'
import type { RawListing } from './types'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/* A source only counts as "actually covered this run" (and therefore
 * eligible to have its stale listings auto-closed) if it returned at least
 * this many raw listings. Guards against a transient scrape failure (0 or
 * a handful of results due to a site error/redesign) wrongly closing every
 * previously-imported opportunity from that source. */
const MIN_LISTINGS_TO_TRUST_SOURCE = 5

async function main() {
  const startedAt = new Date()
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    console.error('GEMINI_API_KEY is not set — cannot structure scraped listings. Aborting.')
    await sendRunSummaryEmail({
      results: { added: 0, updated: 0, closed: 0, skipped: 0, blocked: 0, errors: [] },
      perSource: [],
      startedAt,
      finishedAt: new Date(),
      fatalError: 'GEMINI_API_KEY is not set in the environment.',
    })
    process.exit(1)
  }

  const browser = await chromium.launch()
  // Collected by the scrapers: a partial scrape stays usable, but the reason
  // it was partial has to reach the run summary rather than vanish.
  const warnings: string[] = []
  const perSource: { name: string; scraped: number; structured: number; domain: string; closeByAbsence: boolean }[] = []
  const allRaw: RawListing[] = []

  /* closeByAbsence: whether "missing from this run" can be taken to mean
   * "no longer open". True for the aggregators, whose category listings are
   * complete, and for Trackr, whose API returns the whole season. False for LinkedIn, which returns a relevance-ranked slice of a
   * far larger result set that reshuffles between runs — a live posting
   * dropping out of the top 50 says nothing about whether it closed. Those
   * rows are retired by the link check (LinkedIn's "No longer accepting
   * applications" page) instead.
   *
   * dedupe: drop listings already found by an earlier source this run or
   * already open on the site. Set on the sources that mostly re-find what
   * the aggregators carry, under URLs the importer would treat as new. */
  const sources: {
    name: string
    domain: string
    closeByAbsence: boolean
    dedupe?: boolean
    run: () => Promise<RawListing[]>
  }[] = [
    {
      name: 'Gradcracker',
      domain: GRADCRACKER_DOMAIN,
      closeByAbsence: true,
      run: async () => {
        const page = await browser.newPage({ userAgent: UA })
        try { return await scrapeGradcracker(page, warnings) } finally { await page.close() }
      },
    },
    {
      name: 'HigherIn',
      domain: HIGHERIN_DOMAIN,
      closeByAbsence: true,
      run: async () => {
        const page = await browser.newPage({ userAgent: UA })
        try { return await scrapeHigherIn(page, warnings) } finally { await page.close() }
      },
    },
    {
      name: 'TargetJobs',
      domain: TARGETJOBS_DOMAIN,
      closeByAbsence: true,
      run: async () => {
        const page = await browser.newPage({ userAgent: UA })
        try { return await scrapeTargetJobs(page, warnings) } finally { await page.close() }
      },
    },
    // The two secondary sources run last so everything before them is
    // already collected for the de-dupe; Trackr goes first of the two since
    // it links to the employer directly with real dates.
    {
      name: 'Trackr',
      domain: TRACKR_DOMAIN,
      closeByAbsence: true,
      dedupe: true,
      run: () => scrapeTrackr(warnings),
    },
    {
      name: 'LinkedIn',
      domain: LINKEDIN_DOMAIN,
      closeByAbsence: false,
      dedupe: true,
      run: () => scrapeLinkedIn(warnings),
    },
  ]

  for (const source of sources) {
    let listings: RawListing[] = []
    try {
      listings = await source.run()
    } catch (err) {
      console.error(`${source.name} scrape failed:`, err)
    }
    console.log(`${source.name}: scraped ${listings.length} raw listings`)
    if (source.dedupe && listings.length > 0) {
      const before = listings.length
      listings = await dropCrossSourceDuplicates(listings, allRaw)
      console.log(`${source.name}: ${before - listings.length} already listed via another source, ${listings.length} kept`)
    }
    perSource.push({ name: source.name, domain: source.domain, closeByAbsence: source.closeByAbsence, scraped: listings.length, structured: 0 })
    allRaw.push(...listings)
  }

  await browser.close()

  if (warnings.length > 0) {
    console.warn('\nScrape warnings:')
    warnings.forEach(w => console.warn(`  - ${w}`))
  }

  // Only trust domains that returned enough listings to look like a real,
  // successful scrape rather than a transient failure.
  const trustedDomains = perSource
    .filter(s => s.closeByAbsence && s.scraped >= MIN_LISTINGS_TO_TRUST_SOURCE)
    .map(s => s.domain)
  const untrustedSources = perSource.filter(s => s.closeByAbsence && s.scraped < MIN_LISTINGS_TO_TRUST_SOURCE)
  if (untrustedSources.length > 0) {
    console.warn(
      'Not trusting these sources for the close-sweep (too few results, likely a scrape issue):',
      untrustedSources.map(s => `${s.name} (${s.scraped})`).join(', ')
    )
  }

  console.log(`\nStructuring ${allRaw.length} listings via Gemini...`)
  const structured = await structureListings(allRaw, geminiKey)
  console.log(`Structured ${structured.length} relevant rows (of ${allRaw.length} scraped)`)

  for (const s of structured) {
    const entry = perSource.find(p => p.domain === s.source.sourceDomain)
    if (entry) entry.structured++
  }

  const results = await importOpportunityRows(
    structured.map(s => s.row),
    { sourceDomains: trustedDomains }
  )

  console.log('\nImport results:', results)

  /* Retire listings whose application link is definitively gone. Runs after
   * the import so today's new rows are covered too, and counts into closed
   * since that is what it does. */
  console.log('\nChecking application links...')
  const linkCheck = await sweepDeadLinks()
  console.log(
    `Link check: ${linkCheck.checked} checked, ${linkCheck.dead} dead (closed), ` +
    `${linkCheck.alive} alive, ${linkCheck.inconclusive} inconclusive`
  )
  results.closed += linkCheck.dead
  if (linkCheck.dead > 0) {
    warnings.push(`Closed ${linkCheck.dead} listing(s) with dead application links`)
  }
  /* Named rather than counted: these are the ones nobody can verify
   * automatically, so the only way they get checked is a human reading this. */
  if (linkCheck.unverifiable.length > 0) {
    warnings.push(
      `${linkCheck.unverifiable.length} listing(s) on ATS platforms that block link checking — ` +
      `worth a manual spot-check: ${linkCheck.unverifiable.slice(0, 10).join('; ')}` +
      (linkCheck.unverifiable.length > 10 ? ` (+${linkCheck.unverifiable.length - 10} more)` : '')
    )
  }

  await sendRunSummaryEmail({
    results,
    perSource: perSource.map(({ name, scraped, structured }) => ({ name, scraped, structured })),
    warnings,
    startedAt,
    finishedAt: new Date(),
  })
}

main().catch(async (err) => {
  console.error('Pipeline run failed:', err)
  await sendRunSummaryEmail({
    results: { added: 0, updated: 0, closed: 0, skipped: 0, blocked: 0, errors: [] },
    perSource: [],
    startedAt: new Date(),
    finishedAt: new Date(),
    fatalError: err instanceof Error ? err.stack || err.message : String(err),
  })
  process.exit(1)
})
