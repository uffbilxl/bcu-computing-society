'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`text-[var(--t4)] transition-transform duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        <div
          className="transition-opacity duration-300 ease-in-out"
          style={{ opacity: open ? 1 : 0 }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default function SCAOpportunitiesPage() {
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setOpenCards(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="max-w-[860px] mx-auto px-8 py-7">
      <motion.div
        className="mb-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[10px] font-mono text-[var(--t4)] uppercase tracking-[0.14em] mb-1">// internal</p>
        <h1 className="font-display text-[20px] font-black tracking-[-0.4px] text-[var(--t1)]">BCUComputingSoc Opportunities</h1>
        <p className="text-[12px] text-[var(--t3)] mt-1">
          Internal opportunities within the BCU Computing Society: committee roles, volunteering, and more.
        </p>
      </motion.div>

      {/* SCA Internship Opportunities Card */}
      <motion.div
        className="border border-[var(--b1)] bg-[var(--bg2)] overflow-hidden mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          onClick={() => toggle('internships')}
          className="w-full text-left px-6 py-5 hover:bg-[var(--bg3)] transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-[var(--t1)] text-[10px] font-mono font-medium text-[var(--t1)] tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--t1)] inline-block" />
                  Now open
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                  8 positions
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                  50%+ first years
                </span>
              </div>
              <h2 className="font-display text-[17px] font-bold text-[var(--t1)] tracking-tight">
                BCUComputingSoc Internship Opportunities
              </h2>
              <p className="text-[12px] font-mono text-[var(--t3)] mt-0.5">
                BCU Computing Society
              </p>
            </div>
            <ChevronIcon open={!!openCards['internships']} />
          </div>
        </button>

        <Collapsible open={!!openCards['internships']}>
          <div className="border-t border-[var(--b1)]">
            <div className="px-6 py-5 space-y-5">
              <p className="text-[13px] text-[var(--t2)] leading-relaxed">
                Applications are open for Web Development and Project Management internships with the BCUComputingSoc, across 8 positions.
                These roles are designed for students with little to no experience who want to build practical skills by working on real projects.
                More than half of the positions will be allocated to first year students.
              </p>

              <div>
                <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Roles available</p>
                <div className="flex flex-wrap gap-2">
                  {['Web Development', 'Project Management'].map(role => (
                    <span key={role} className="tag">{role}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">What you&apos;ll do</p>
                <ul className="space-y-1.5">
                  {[
                    'Build and maintain websites',
                    'Work on real projects alongside your studies',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[12px] text-[var(--t2)]">
                      <span className="text-[var(--t4)] mt-0.5 flex-shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Experience</p>
                  <span className="text-[11px] text-[var(--t3)]">Little to no experience required</span>
                </div>
                <div>
                  <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">AI tools</p>
                  <span className="text-[11px] text-[var(--t3)]">Allowed</span>
                </div>
              </div>

              <div className="bg-[var(--bg3)] border border-[var(--b1)] px-4 py-3">
                <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Why apply</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {['Hands-on experience for your CV', 'Build practical skills on real projects', 'Over 50% of roles go to first years'].map(benefit => (
                    <span key={benefit} className="text-[12px] text-[var(--t2)] flex items-center gap-1.5">
                      <span className="text-[var(--t4)] text-[10px]">✦</span>
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--b1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-mono text-[var(--t4)]">8 positions · Applications open</p>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--t4)]">
                  <span>Organiser:</span>
                  <a href="mailto:bilal.arshad2@mail.bcu.ac.uk" className="text-[var(--t1)] hover:underline font-medium">
                    Bilal Arshad
                  </a>
                </div>
              </div>
              <a
                href="https://tally.so/r/A7kJDz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--t1)] text-[var(--bg)] text-[13px] font-semibold hover:opacity-80 transition-opacity"
              >
                Apply now →
              </a>
            </div>
          </div>
        </Collapsible>
      </motion.div>

      {/* Previous Opportunities */}
      <div className="mt-10">
        <button
          onClick={() => toggle('previous')}
          className="flex items-center gap-2 text-[12px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-4 hover:text-[var(--t1)] transition-colors"
        >
          <ChevronIcon open={!!openCards['previous']} />
          Previous Opportunities
        </button>

        <Collapsible open={!!openCards['previous']}>
          <div className="flex flex-col gap-3">

          {/* Web Development Intern */}
          <div className="border border-[var(--b1)] bg-[var(--bg2)] overflow-hidden opacity-70">
            <button
              onClick={() => toggle('webdev')}
              className="w-full text-left px-6 py-5 hover:bg-[var(--bg3)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-[var(--b2)] text-[10px] font-mono font-medium text-[var(--t4)] tracking-wide uppercase">
                      Filled
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                      Web Division
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                      Year-long
                    </span>
                  </div>
                  <h2 className="font-display text-[17px] font-bold text-[var(--t1)] tracking-tight">
                    Web Development Intern
                  </h2>
                  <p className="text-[12px] font-mono text-[var(--t3)] mt-0.5">
                    BCU Computing Society
                  </p>
                </div>
                <ChevronIcon open={!!openCards['webdev']} />
              </div>
            </button>

            <Collapsible open={!!openCards['webdev']}>
              <div className="border-t border-[var(--b1)]">
                <div className="px-6 py-5 space-y-5">
                  <p className="text-[13px] text-[var(--t2)] leading-relaxed">
                    A year-long internship within BCUComputingSoc&apos;s Web Division, responsible for building and maintaining the society&apos;s digital presence.
                    You&apos;ll work on live websites used by BCUComputingSoc members, keeping them up to date, functional, and well-designed.
                    Ideal for students who want real ownership over a product and hands-on web development experience alongside their studies.
                  </p>

                  <div>
                    <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">What you&apos;ll do</p>
                    <ul className="space-y-1.5">
                      {[
                        'Maintain and update existing BCUComputingSoc websites',
                        'Build new pages and features as the association grows',
                        'Fix bugs and ensure cross-browser, responsive performance',
                        'Collaborate with other BCUComputingSoc divisions on web needs',
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-[12px] text-[var(--t2)]">
                          <span className="text-[var(--t4)] mt-0.5 flex-shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Expected skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['HTML', 'CSS', 'JavaScript'].map(skill => (
                          <span key={skill} className="tag">{skill}</span>
                        ))}
                      </div>
                      <p className="text-[11px] font-mono text-[var(--t4)] mt-1.5">Basic proficiency required</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Experience</p>
                      <span className="text-[11px] text-[var(--t3)]">No prior experience required</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[var(--b1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] font-mono text-[var(--t4)]">Superseded by the current BCUComputingSoc internship intake</p>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--t4)]">
                      <span>Organiser:</span>
                      <a href="mailto:bilal.arshad2@mail.bcu.ac.uk" className="text-[var(--t3)] hover:underline font-medium">
                        Bilal Arshad
                      </a>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--bg3)] border border-[var(--b1)] text-[var(--t4)] text-[13px] font-medium cursor-default">
                    Applications closed
                  </span>
                </div>
              </div>
            </Collapsible>
          </div>

          {/* Sports Analytics */}
          <div className="border border-[var(--b1)] bg-[var(--bg2)] overflow-hidden opacity-70">
            <button
              onClick={() => toggle('sports')}
              className="w-full text-left px-6 py-5 hover:bg-[var(--bg3)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-[var(--b2)] text-[10px] font-mono font-medium text-[var(--t4)] tracking-wide uppercase">
                      Filled
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                      AI Division
                    </span>
                  </div>
                  <h2 className="font-display text-[17px] font-bold text-[var(--t1)] tracking-tight">
                    BCUComputingSoc Sports Analytics Department
                  </h2>
                  <p className="text-[12px] font-mono text-[var(--t3)] mt-0.5">
                    BCU Computing Society · BCU Basketball
                  </p>
                </div>
                <ChevronIcon open={!!openCards['sports']} />
              </div>
            </button>

            <Collapsible open={!!openCards['sports']}>
              <div className="border-t border-[var(--b1)]">
                <div className="px-6 py-5 space-y-5">
                  <p className="text-[13px] text-[var(--t2)] leading-relaxed">
                    A student-led initiative under the AI Division supporting the BCU Basketball team ahead of the 2026/27 BUCS season.
                    Successful applicants will take part in a summer pilot programme before the official launch in September.
                    Best suited to those with an interest in data and AI.
                  </p>

                  <div>
                    <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Roles available</p>
                    <div className="flex flex-wrap gap-2">
                      {['Performance Analyst', 'Video Analyst', 'Data Collector'].map(role => (
                        <span key={role} className="tag">{role}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">What you&apos;ll do</p>
                    <ul className="space-y-1.5">
                      {[
                        'Attend fixtures and collect live data',
                        'Process and analyse performance data',
                        'Contribute to match and opposition reports',
                        'Support video analysis and scouting',
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-[12px] text-[var(--t2)]">
                          <span className="text-[var(--t4)] mt-0.5 flex-shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Expected skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Python', 'Excel', 'PowerPoint'].map(skill => (
                          <span key={skill} className="tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Experience</p>
                      <span className="text-[11px] text-[var(--t3)]">No prior experience required</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[var(--b1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] font-mono text-[var(--t4)]">All positions filled</p>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--t4)]">
                      <span>Organiser:</span>
                      <a href="mailto:Mohamed.Dahir@mail.bcu.ac.uk" className="text-[var(--t3)] hover:underline font-medium">
                        Mohammed Dahir
                      </a>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--bg3)] border border-[var(--b1)] text-[var(--t4)] text-[13px] font-medium cursor-default">
                    Applications closed
                  </span>
                </div>
              </div>
            </Collapsible>
          </div>

          {/* Software Developers */}
          <div className="border border-[var(--b1)] bg-[var(--bg2)] overflow-hidden opacity-70">
            <button
              onClick={() => toggle('softwaredev')}
              className="w-full text-left px-6 py-5 hover:bg-[var(--bg3)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-[var(--b2)] text-[10px] font-mono font-medium text-[var(--t4)] tracking-wide uppercase">
                      Filled
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                      CivitasAccess
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 border border-[var(--b1)] text-[10px] font-mono text-[var(--t3)] tracking-wide">
                      3–4 positions
                    </span>
                  </div>
                  <h2 className="font-display text-[17px] font-bold text-[var(--t1)] tracking-tight">
                    BCUComputingSoc Software Developers
                  </h2>
                  <p className="text-[12px] font-mono text-[var(--t3)] mt-0.5">
                    CivitasAccess · Promoted by BCU Computing Society
                  </p>
                </div>
                <ChevronIcon open={!!openCards['softwaredev']} />
              </div>
            </button>

            <Collapsible open={!!openCards['softwaredev']}>
              <div className="border-t border-[var(--b1)]">
                <div className="px-6 py-5 space-y-5">
                  <p className="text-[13px] text-[var(--t2)] leading-relaxed">
                    An opportunity promoted by the BCUComputingSoc to work with CivitasAccess, a real company building access control and visitor management software.
                    3-4 students will collaborate to design and build a full stack application, working across the full development lifecycle, from planning and architecture through to deployment.
                    Ideal for students who want genuine industry experience and the chance to ship something used in a production environment.
                  </p>

                  <div>
                    <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">What you&apos;ll do</p>
                    <ul className="space-y-1.5">
                      {[
                        'Design and build a full stack application from the ground up',
                        'Collaborate as a small team across frontend, backend, and database',
                        'Contribute to architecture decisions and technical planning',
                        'Deploy and maintain the application in a real production environment',
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-[12px] text-[var(--t2)]">
                          <span className="text-[var(--t4)] mt-0.5 flex-shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Expected skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['HTML/CSS', 'JavaScript', 'Git'].map(skill => (
                          <span key={skill} className="tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono font-medium text-[var(--t4)] uppercase tracking-wider mb-2">Team size</p>
                      <span className="text-[11px] text-[var(--t3)]">3–4 interns working together</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-[var(--b1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-mono text-[var(--t4)]">All positions filled</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-[var(--t4)]">
                      <span>Organisers:</span>
                      <span className="text-[var(--t3)] font-medium">
                        Tayyeb Nadeem Somro
                      </span>
                      <span>&amp;</span>
                      <a href="mailto:bilal.arshad2@mail.bcu.ac.uk" className="text-[var(--t3)] hover:underline font-medium">
                        Bilal Arshad
                      </a>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--bg3)] border border-[var(--b1)] text-[var(--t4)] text-[13px] font-medium cursor-default">
                    Applications closed
                  </span>
                </div>
              </div>
            </Collapsible>
          </div>

          </div>
        </Collapsible>
      </div>
    </div>
  )
}
