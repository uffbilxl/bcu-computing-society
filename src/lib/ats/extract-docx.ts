import { unzipSync, strFromU8 } from 'fflate'
import type { DocSignals, ExtractedDoc, Line } from './types'

/* A .docx is a zip of XML. Reading the XML directly — rather than converting
 * to text first — keeps exactly the structure an ATS trips over: which text
 * sits in tables, text boxes, or the page header and footer. */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })
}

function allText(xml: string): string {
  const out: string[] = []
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<\/w:p>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml))) out.push(m[1] !== undefined ? decode(m[1]) : '\n')
  return out.join('').replace(/[ \t]+/g, ' ').trim()
}

interface ParaState {
  parts: string[]
  bullet: boolean
  heading: boolean
  inTable: boolean
  size: number
  boldChars: number
  chars: number
}

const TOKEN = new RegExp(
  [
    '<w:p(?=[ >])[^>]*>', '</w:p>',
    '<w:tbl>', '</w:tbl>',
    '<w:txbxContent>', '</w:txbxContent>',
    '<w:r(?=[ >])[^>]*>',
    '<w:t(?:\\s[^>]*)?>([^<]*)</w:t>',
    '<w:tab/>', '<w:br(?:\\s[^>]*)?/>', '<w:cr/>',
    '<w:numPr>',
    '<w:pStyle w:val="([^"]*)"',
    '<w:b(?:\\s+w:val="([^"]*)")?\\s*/>',
    '<w:sz w:val="(\\d+)"',
  ].join('|'),
  'g',
)

function parseBody(xml: string, defaultSize: number) {
  const lines: Line[] = []
  const stack: ParaState[] = []
  const sizes: number[] = []
  let tableDepth = 0
  let runBold = false
  let runSize = defaultSize
  let wordsInTables = 0
  let wordsTotal = 0

  const emit = (p: ParaState) => {
    const chunks = p.parts.join('').split('\n')
    for (const chunk of chunks) {
      const text = chunk.replace(/[  ]+/g, ' ').replace(/ ?\t ?/g, '  ').trim()
      if (!text) continue
      const words = text.split(/\s+/).length
      wordsTotal += words
      if (p.inTable) wordsInTables += words
      lines.push({
        text,
        page: 1,
        size: p.size || undefined,
        bold: p.chars > 0 && p.boldChars / p.chars > 0.6,
        bullet: p.bullet || undefined,
        heading: p.heading || undefined,
        inTable: p.inTable || undefined,
      })
    }
  }

  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(xml))) {
    const tok = m[0]
    const top = stack[stack.length - 1]
    if (tok === '</w:p>') {
      const done = stack.pop()
      if (done) emit(done)
    } else if (tok.startsWith('<w:p ') || tok.startsWith('<w:p>')) {
      if (tok.endsWith('/>')) continue // empty paragraph, never closed
      stack.push({ parts: [], bullet: false, heading: false, inTable: tableDepth > 0, size: 0, boldChars: 0, chars: 0 })
      runBold = false
      runSize = defaultSize
    } else if (tok === '<w:tbl>') tableDepth++
    else if (tok === '</w:tbl>') tableDepth = Math.max(0, tableDepth - 1)
    else if (tok === '<w:txbxContent>' || tok === '</w:txbxContent>') { /* counted separately */ }
    else if (tok.startsWith('<w:r')) { runBold = false; runSize = defaultSize }
    else if (tok.startsWith('<w:t')) {
      if (!top) continue
      const text = decode(m[1] ?? '')
      top.parts.push(text)
      top.chars += text.length
      if (runBold) top.boldChars += text.length
      top.size = Math.max(top.size, runSize)
      for (let i = 0; i < text.length; i += 4) sizes.push(runSize)
    } else if (tok === '<w:tab/>') top?.parts.push('\t')
    else if (tok.startsWith('<w:br') || tok === '<w:cr/>') top?.parts.push('\n')
    else if (tok === '<w:numPr>') { if (top) top.bullet = true }
    else if (tok.startsWith('<w:pStyle')) {
      if (top && /heading|title/i.test(m[2] ?? '')) top.heading = true
      if (top && /list ?(bullet|number)/i.test(m[2] ?? '')) top.bullet = true
    } else if (tok.startsWith('<w:b')) {
      runBold = !['0', 'false', 'off'].includes(m[3] ?? '1')
    } else if (tok.startsWith('<w:sz')) {
      runSize = Number(m[4]) / 2
    }
  }
  while (stack.length) emit(stack.pop()!)

  sizes.sort((a, b) => a - b)
  return {
    lines,
    bodySize: sizes.length ? sizes[Math.floor(sizes.length / 2)] : undefined,
    tableWordShare: wordsTotal ? wordsInTables / wordsTotal : 0,
    words: wordsTotal,
  }
}

export function extractDocx(data: Uint8Array, fileName: string): ExtractedDoc {
  const wanted = /^(word\/(document|styles|header\d*|footer\d*)\.xml|word\/_rels\/document\.xml\.rels|docProps\/app\.xml)$/
  const files = unzipSync(data, { filter: f => wanted.test(f.name) })
  const read = (name: string) => (files[name] ? strFromU8(files[name]) : '')

  const rawBody = read('word/document.xml')
  if (!rawBody) throw new Error('This file is not a valid Word document.')

  // Text boxes are stored twice (modern shape + legacy fallback); keep one.
  const body = rawBody.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '')

  const styles = read('word/styles.xml')
  const defaults = styles.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/)?.[0] ?? ''
  const defaultSize = Number(defaults.match(/<w:sz w:val="(\d+)"/)?.[1] ?? 22) / 2

  const parsed = parseBody(body, defaultSize)

  const fonts = new Set<string>()
  for (const m of Array.from(body.matchAll(/w:ascii="([^"]+)"/g))) fonts.add(decode(m[1]))
  const defaultFont = defaults.match(/w:ascii="([^"]+)"/)?.[1]
  if (defaultFont) fonts.add(decode(defaultFont))

  const headerFooterText = Object.keys(files)
    .filter(name => /^word\/(header|footer)\d*\.xml$/.test(name))
    .map(name => allText(strFromU8(files[name])))
    .filter(Boolean)
    .join('\n')

  const linkTargets = Array.from(
    read('word/_rels/document.xml.rels').matchAll(/Target="([^"]+)"[^>]*TargetMode="External"/g),
    m => decode(m[1]),
  )

  const app = read('docProps/app.xml')
  const statedPages = Number(app.match(/<Pages>(\d+)<\/Pages>/)?.[1] ?? 0)
  const pages = statedPages > 0 ? statedPages : Math.max(1, Math.ceil(parsed.words / 600))

  const signals: DocSignals = {
    images: (body.match(/<pic:pic[ >]/g) ?? []).length + (body.match(/<v:imagedata /g) ?? []).length,
    tables: (body.match(/<w:tbl>/g) ?? []).length,
    textBoxes: (body.match(/<w:txbxContent>/g) ?? []).length,
    tableWordShare: parsed.tableWordShare,
    columns: Array.from(body.matchAll(/<w:cols\b[^>]*w:num="(\d+)"/g)).some(m => Number(m[1]) > 1),
    fonts: Array.from(fonts),
    bodySize: parsed.bodySize,
    producer: app.match(/<Application>([^<]*)<\/Application>/)?.[1],
    linkTargets,
    headerFooterText,
  }

  return {
    kind: 'docx',
    fileName,
    fileSize: data.byteLength,
    pages,
    pagesEstimated: statedPages === 0,
    lines: parsed.lines,
    signals,
  }
}
