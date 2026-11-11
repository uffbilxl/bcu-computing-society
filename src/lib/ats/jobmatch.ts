import { findSkills } from './skills'
import type { JobMatch } from './types'

/* How much of a job description's vocabulary the CV shares.
 *
 * An ATS ranks candidates by the terms a recruiter searches — mostly hard
 * skills, taken from the advert. So dictionary skills count three times as
 * much as the advert's other recurring terms, which are found by frequency
 * rather than meaning and are noisier. */

const STOPWORDS = new Set(
  `a about above across after again all also am an and any are as at be because been before being below between both but by
  can could did do does doing down during each few for from further had has have having he her here hers him his how i if in
  into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some
  such than that the their them then there these they this those through to too under until up us very was we were what when
  where which while who whom why will with would you your yours within without per via etc eg ie

  ability able about across apply applicant applicants application applications based benefits business candidate candidates
  career company companies day days degree desirable essential excellent experience experienced good great help high hire
  including include includes join key knowledge level looking make must need needed new offer opportunity opportunities part
  people plus position preferred provide required requirements requirement responsibilities responsible role roles salary
  skill skills strong successful support team teams time understanding using want well work working year years ideal ideally
  ensure environment equal employer currently relevant related range right like may one two three use used across within
  what will welcome world best every get take across office hybrid remote uk london birmingham graduate graduates intern
  internship placement student students university programme program scheme start month months week weeks`
    .split(/\s+/)
    .filter(Boolean),
)

/* Light stemming so "testing"/"tests"/"tested" meet in the middle. */
function stem(word: string): string {
  if (word.length <= 4) return word
  return word
    .replace(/(ations?|ising|izing|ised|ized)$/, '')
    .replace(/(ing|ed|es|s)$/, '')
}

function tokens(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z+#.-]*[a-z+#]|[a-z]/g) ?? []
}

export function matchJob(cvText: string, jobText: string): JobMatch | null {
  const job = jobText.trim()
  if (job.split(/\s+/).length < 20) return null

  const cvSkills = new Set(findSkills(cvText))
  const jobSkills = findSkills(job)
  const matchedSkills = jobSkills.filter(s => cvSkills.has(s))
  const missingSkills = jobSkills.filter(s => !cvSkills.has(s))

  // Recurring non-skill terms in the advert
  const skillWords = new Set(jobSkills.flatMap(s => tokens(s)))
  const counts = new Map<string, { display: string; count: number }>()
  for (const word of tokens(job)) {
    if (word.length < 4 || STOPWORDS.has(word) || skillWords.has(word)) continue
    const key = stem(word)
    if (STOPWORDS.has(key)) continue
    const entry = counts.get(key)
    if (entry) entry.count++
    else counts.set(key, { display: word, count: 1 })
  }
  const terms = Array.from(counts.entries())
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 14)

  const cvStems = new Set(tokens(cvText).map(stem))
  const matchedTerms = terms.filter(([key]) => cvStems.has(key)).map(([, v]) => v.display)
  const missingTerms = terms.filter(([key]) => !cvStems.has(key)).map(([, v]) => v.display)

  const possible = jobSkills.length * 3 + terms.length
  if (possible === 0) return null
  const earned = matchedSkills.length * 3 + matchedTerms.length

  return {
    score: Math.round((earned / possible) * 100),
    matchedSkills,
    missingSkills,
    matchedTerms,
    missingTerms,
  }
}
