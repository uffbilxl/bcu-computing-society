import Link from 'next/link'
import { ExternalLink, Download, FileText } from 'lucide-react'

interface Author {
  name: string
  linkedin: string
}

interface Paper {
  title: string
  authors: Author[]
  ssrnUrl: string
  pdfUrl: string
}

const PAPERS: Paper[] = [
  {
    title: 'LLM-powered SOC Assistants: Prompt Injection Risks in Threat Triage',
    authors: [
      { name: 'Tayyeb Nadeem Somro', linkedin: 'https://www.linkedin.com/in/tayyeb-nadeem-somro/' },
      { name: 'Bilal Arshad', linkedin: 'https://www.linkedin.com/in/bilal-arshad-4a07812b4/' },
      { name: 'Ammara Gul', linkedin: 'https://www.linkedin.com/in/ammara-gul-822875105/' },
    ],
    ssrnUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7179658',
    pdfUrl: '/ssrn-7179658.pdf',
  },
  {
    title: 'Explainable Alert Prioritisation: An Evaluation Protocol for SHAP-Based Insider Threat Detection in Critical National Infrastructure',
    authors: [
      { name: 'Tayyeb Nadeem Somro', linkedin: 'https://www.linkedin.com/in/tayyeb-nadeem-somro/' },
      { name: 'Bilal Arshad', linkedin: 'https://www.linkedin.com/in/bilal-arshad-4a07812b4/' },
    ],
    ssrnUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7179639',
    pdfUrl: '/ssrn-7179639.pdf',
  },
  {
    title: 'Extending Microsoft STRIDE: Prompt Injection Threat Model for Enterprise RAG Systems',
    authors: [
      { name: 'Bilal Arshad', linkedin: 'https://www.linkedin.com/in/bilal-arshad-4a07812b4/' },
      { name: 'Michael Martinak', linkedin: 'https://www.linkedin.com/in/profile-mmartinak/' },
    ],
    ssrnUrl: 'https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7156478',
    pdfUrl: '/ssrn-7156478.pdf',
  },
]

export default function ResearchPage() {
  return (
    <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14" style={{ position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <div className="mb-12">
        <span className="eyebrow mb-3">BCU Computing Society</span>
        <h1
          className="text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-[var(--color-text)] mb-3"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Research
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-lg leading-relaxed">
          Papers published by the Research &amp; Development department.
        </p>
      </div>

      {/* Papers */}
      <div className="flex flex-col gap-4">
        {PAPERS.map(paper => (
          <div
            key={paper.ssrnUrl}
            className="flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-200 hover:border-[rgba(var(--hairline-rgb),0.14)]"
            style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#8b5cf615', color: '#8b5cf6', border: '1px solid #8b5cf630' }}
              >
                <FileText size={16} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-semibold text-[var(--color-text)] leading-snug mb-1.5"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {paper.title}
                </p>
                <p className="text-[11.5px] text-[var(--color-muted)] leading-relaxed">
                  {paper.authors.map((author, i) => (
                    <span key={author.name}>
                      <Link
                        href={author.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent)] hover:underline focus-ring rounded"
                      >
                        {author.name}
                      </Link>
                      {i < paper.authors.length - 1 && ' & '}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={paper.ssrnUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold text-white w-fit transition-opacity hover:opacity-85 focus-ring"
                style={{ background: '#8b5cf6' }}
              >
                <ExternalLink size={12} aria-hidden="true" />
                View on SSRN
              </Link>
              <a
                href={paper.pdfUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold w-fit transition-colors border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--b2)] focus-ring"
              >
                <Download size={12} aria-hidden="true" />
                Download PDF
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
