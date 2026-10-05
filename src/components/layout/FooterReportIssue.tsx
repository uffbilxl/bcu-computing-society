'use client'
import { useState } from 'react'
import { ReportIssueModal } from '@/components/layout/ReportIssueModal'

export function FooterReportIssue() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-[#A3B1C6] hover:text-white transition-colors text-left focus-ring rounded"
      >
        Report an issue
      </button>
      {open && <ReportIssueModal onClose={() => setOpen(false)} />}
    </>
  )
}
