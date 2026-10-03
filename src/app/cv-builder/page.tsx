import type { Metadata } from 'next'
import { CVBuilderClient } from '@/components/cv/CVBuilderClient'

export const metadata: Metadata = {
  title: 'CV Builder - BCUComputingSoc',
  description:
    'Free ATS-friendly one-page CV builder for BCU students. No sign-up, no watermarks, unlimited PDF downloads. Made by students, for students.',
}

export default function CVBuilderPage() {
  return <CVBuilderClient />
}
