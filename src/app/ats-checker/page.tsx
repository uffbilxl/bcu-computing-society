import type { Metadata } from 'next'
import { ATSCheckerClient } from '@/components/ats/ATSCheckerClient'

export const metadata: Metadata = {
  title: 'ATS CV Checker - BCUComputingSoc',
  description:
    'Free ATS checker for students. Upload your CV to get a score out of 100, see exactly what an applicant tracking system reads, and what to fix. Runs in your browser: nothing is uploaded.',
}

export default function ATSCheckerPage() {
  return <ATSCheckerClient />
}
