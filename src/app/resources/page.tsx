import Link from 'next/link'
import { FileText, Download, FileCode, Zap, BookOpen, type LucideIcon } from 'lucide-react'

interface Resource {
  title: string
  description: string
  fileUrl?: string
  pages?: string
}

interface Category {
  id: string
  label: string
  color: string
  Icon: LucideIcon
  resources: Resource[]
}

const CATEGORIES: Category[] = [
  {
    id: 'cv',
    label: 'CV Templates',
    color: 'var(--acc)',
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
    color: '#22c55e',
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
    color: '#f59e0b',
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
    color: '#a855f7',
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
    <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-10 sm:py-14" style={{ position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <div className="mb-12">
        <span className="eyebrow mb-3">BCU Computing Society</span>
        <h1
          className="text-[clamp(1.75rem,5vw,2.75rem)] font-bold tracking-tight text-[var(--color-text)] mb-3"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Resources
        </h1>
        <p className="text-sm text-[var(--color-muted)] max-w-lg leading-relaxed">
          Templates and guides to help you land your next opportunity. CVs, cover letters, cheat sheets, and more.
        </p>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-14">
        {CATEGORIES.map(cat => {
          const CatIcon = cat.Icon
          return (
            <section key={cat.id}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cat.color}18`, color: cat.color }}
                >
                  <CatIcon size={14} aria-hidden="true" />
                </div>
                <span
                  className="text-[13px] font-semibold text-[var(--color-text)]"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {cat.label}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[10px] text-[var(--color-muted)]">
                  {cat.resources.length} {cat.resources.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.resources.map(resource => (
                  <div
                    key={resource.title}
                    className="flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-200 hover:border-[rgba(var(--hairline-rgb),0.14)]"
                    style={{ background: 'var(--card-gradient)', borderColor: 'rgba(var(--hairline-rgb),0.07)' }}
                  >
                    {/* Top */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${cat.color}15`,
                          color: cat.color,
                          border: `1px solid ${cat.color}30`,
                        }}
                      >
                        <FileCode size={16} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p
                            className="text-[13px] font-semibold text-[var(--color-text)] leading-tight"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {resource.title}
                          </p>
                          {resource.pages && (
                            <span className="badge-gray">{resource.pages}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                          {resource.description}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    {resource.fileUrl ? (
                      <a
                        href={resource.fileUrl}
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold text-white w-fit transition-opacity hover:opacity-85 focus-ring"
                        style={{ background: cat.color }}
                      >
                        <Download size={12} aria-hidden="true" />
                        Download {fileType(resource.fileUrl)}
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold text-white w-fit opacity-30 cursor-not-allowed"
                        style={{ background: cat.color }}
                      >
                        <Download size={12} aria-hidden="true" />
                        Coming Soon
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="mt-14 pt-6 border-t border-[var(--color-border)]">
        <p className="text-[12px] text-[var(--color-muted)]">
          Have a resource to contribute?{' '}
          <Link
            href="https://tally.so/r/681g7e"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline focus-ring rounded"
          >
            Get in touch →
          </Link>
        </p>
      </div>
    </div>
  )
}
