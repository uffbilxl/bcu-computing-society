import Link from 'next/link'
import { FileText, Download, Zap, BookOpen, Mail, ArrowUpRight, type LucideIcon } from 'lucide-react'

interface Resource {
  title: string
  description: string
  fileUrl?: string
  pages?: string
}

interface Category {
  id: string
  label: string
  blurb: string
  Icon: LucideIcon
  resources: Resource[]
}

const CATEGORIES: Category[] = [
  {
    id: 'cv',
    label: 'CV Templates',
    blurb: 'Word templates you can edit and send. Or build one in the CV Builder.',
    Icon: FileText,
    resources: [
      {
        title: '1-Page CV Template',
        description: 'Clean, concise single-page CV, ideal for internships and graduate roles.',
        pages: '1 page',
        fileUrl: '/cv-1page.docx',
      },
      {
        title: '2-Page CV Template',
        description: 'Extended format for candidates with more experience or academic projects.',
        pages: '2 pages',
        fileUrl: '/cv-2page.docx',
      },
    ],
  },
  {
    id: 'cover-letter',
    label: 'Cover Letters',
    blurb: 'A structure that works for tech applications, with notes on what to put where.',
    Icon: FileText,
    resources: [
      {
        title: 'Cover Letter Template',
        description: 'Professional cover letter structure with guidance on what to include for tech roles.',
        fileUrl: '/cover-letter.docx',
      },
    ],
  },
  {
    id: 'cheat-sheets',
    label: 'Cheat Sheets',
    blurb: 'One-page references for the languages and tools you use every week.',
    Icon: Zap,
    resources: [
      {
        title: 'C++ Cheat Sheet',
        description: 'Quick reference for C++ syntax, operators, pointers, and multithreading.',
        fileUrl: '/sca_cpp_cheatsheet.pdf',
      },
      {
        title: 'Python Cheat Sheet',
        description: 'Essential Python concepts: variables, lists, functions, classes, and more.',
        fileUrl: '/sca_python_cheatsheet.pdf',
      },
      {
        title: 'GitHub/Git Cheat Sheet',
        description: 'Git commands for version control, branches, merging, and collaboration.',
        fileUrl: '/sca_git_cheatsheet.pdf',
      },
      {
        title: 'JavaScript Cheat Sheet',
        description: 'Core JS features: variables, loops, conditionals, strings, and arrays.',
        fileUrl: '/sca_js_cheatsheet.pdf',
      },
      {
        title: 'HTML Cheat Sheet',
        description: 'Complete HTML reference with tags, forms, tables, layouts, and more.',
        fileUrl: '/sca_html_cheatsheet.pdf',
      },
      {
        title: 'Linux Cheat Sheet',
        description: 'Essential Linux commands for file operations, processes, and system info.',
        fileUrl: '/sca_linux_cheatsheet.pdf',
      },
      {
        title: 'npm Cheat Sheet',
        description: 'Node Package Manager reference for package management and scripts.',
        fileUrl: '/sca_npm_cheatsheet.pdf',
      },
    ],
  },
  {
    id: 'guides',
    label: 'Guides',
    blurb: 'Longer reads on the application process.',
    Icon: BookOpen,
    resources: [
      {
        title: 'More guides coming soon',
        description: 'Interview prep, LinkedIn tips, application strategies and more.',
      },
    ],
  },
]

function fileType(url: string): string {
  if (url.endsWith('.pdf')) return 'PDF'
  if (url.endsWith('.docx')) return 'DOCX'
  return 'File'
}

export default function ResourcesPage() {
  return (
    <div className="max-w-[960px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-20">
      <header>
        <h1 className="page-title enter">Resources</h1>
        <p className="page-lede mt-3 enter" style={{ '--i': 1 } as React.CSSProperties}>
          Templates and guides to help you land your next opportunity. CVs, cover letters, cheat sheets, and more.
        </p>
        <nav aria-label="Resource categories" className="enter mt-6 flex flex-wrap gap-2" style={{ '--i': 2 } as React.CSSProperties}>
          {CATEGORIES.map(cat => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[14px] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors focus-ring"
            >
              <cat.Icon size={14} className="text-[var(--color-accent-text)]" aria-hidden="true" />
              {cat.label}
              <span className="text-[12px] text-[var(--color-muted-2)] tabular-nums">
                {cat.resources.filter(r => r.fileUrl).length || '–'}
              </span>
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-12 flex flex-col gap-14">
        {CATEGORIES.map(cat => {
          const files = cat.resources.filter(r => r.fileUrl)
          const upcoming = cat.resources.filter(r => !r.fileUrl)
          return (
            <section key={cat.id} id={cat.id} aria-labelledby={`${cat.id}-title`} className="reveal">
              <div className="flex items-start gap-3 mb-5">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-text)' }}
                >
                  <cat.Icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 id={`${cat.id}-title`} className="text-[20px] font-semibold tracking-[-0.01em] text-[var(--color-text)]">
                    {cat.label}
                  </h2>
                  <p className="text-[14px] text-[var(--color-muted)] mt-0.5">{cat.blurb}</p>
                </div>
              </div>

              {files.length > 0 && (
                <ul className={`card overflow-hidden grid ${files.length > 2 ? 'sm:grid-cols-2' : ''}`}>
                  {files.map((resource, i) => (
                    <li
                      key={resource.title}
                      className={`border-[var(--color-border-subtle)] ${i > 0 ? 'border-t' : ''} ${
                        files.length > 2 && i === 1 ? 'sm:border-t-0' : ''
                      } ${files.length > 2 && i % 2 === 1 ? 'sm:border-l' : ''}`}
                    >
                      <a
                        href={resource.fileUrl}
                        download
                        className="group h-full flex items-center gap-4 p-4 sm:p-5 hover:bg-[var(--color-surface-hover)] transition-colors duration-150 focus-ring"
                      >
                        <span
                          className="w-11 h-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center flex-shrink-0 text-[10px] font-bold tracking-wide text-[var(--color-muted)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-3"
                          aria-hidden="true"
                        >
                          {fileType(resource.fileUrl!)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold text-[var(--color-text)]">{resource.title}</span>
                            {resource.pages && <span className="badge-gray">{resource.pages}</span>}
                          </span>
                          <span className="block text-[13px] text-[var(--color-muted)] leading-relaxed mt-0.5">
                            {resource.description}
                          </span>
                        </span>
                        <span className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-accent-text)] bg-[var(--color-accent-dim)] transition-transform duration-200 group-hover:translate-y-0.5">
                          <Download size={16} aria-hidden="true" />
                          <span className="sr-only">Download {fileType(resource.fileUrl!)}</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {upcoming.map(resource => (
                <div
                  key={resource.title}
                  className="rounded-2xl border border-dashed border-[var(--color-border)] px-5 py-5 text-[14px]"
                >
                  <p className="font-semibold text-[var(--color-text)]">{resource.title}</p>
                  <p className="text-[var(--color-muted)] mt-0.5">{resource.description}</p>
                </div>
              ))}
            </section>
          )
        })}
      </div>

      <div className="mt-14 card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent-text)' }}
        >
          <Mail size={18} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-[var(--color-text)]">Have a resource to contribute?</p>
          <p className="text-[14px] text-[var(--color-muted)]">Templates, guides or cheat sheets that helped you: send them our way.</p>
        </div>
        <Link
          href="https://tally.so/r/681g7e"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost focus-ring"
        >
          Get in touch
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
