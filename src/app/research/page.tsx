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
    <div className="max-w-[960px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      <header className="mb-10">
        <h1 className="page-title enter">Research</h1>
        <p className="page-lede mt-3 enter" style={{ '--i': 1 } as React.CSSProperties}>
          Papers published by the Research &amp; Development department.
        </p>
      </header>

      <ol className="flex flex-col gap-4">
        {PAPERS.map((paper, i) => (
          <li
            key={paper.ssrnUrl}
            className="reveal card p-5 sm:p-6 flex flex-col sm:flex-row gap-5 transition-colors duration-200 hover:border-[var(--color-border)]"
            style={{ '--i': i } as React.CSSProperties}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}
            >
              <FileText size={20} aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] sm:text-[18px] font-semibold text-[var(--color-text)] leading-snug">
                {paper.title}
              </h2>
              <p className="mt-2 text-[14px] text-[var(--color-muted)] leading-relaxed">
                <span className="sr-only">Authors: </span>
                {paper.authors.map((author, i) => (
                  <span key={author.name}>
                    <Link
                      href={author.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-[3px] hover:decoration-[var(--color-accent-text)] hover:text-[var(--color-accent-text)] transition-colors rounded focus-ring"
                    >
                      {author.name}
                    </Link>
                    {i < paper.authors.length - 2 ? ', ' : i === paper.authors.length - 2 ? ' and ' : ''}
                  </span>
                ))}
              </p>

              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Link
                  href={paper.ssrnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-sm focus-ring"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Read on SSRN
                </Link>
                <a href={paper.pdfUrl} download className="btn-ghost btn-sm focus-ring">
                  <Download size={14} aria-hidden="true" />
                  Download PDF
                </a>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
