import type { DocSignals, ExtractedDoc, Line } from './types'

/* Reads a PDF the way a parser does: pull the text layer, rebuild lines from
 * the positioned fragments, and note what a parser can't use (images) or
 * tends to scramble (side-by-side columns).
 *
 * pdf.js is passed in rather than imported so the caller decides how it is
 * loaded: lazily with a web worker in the browser, directly in Node tests. */

/* Only the parts of pdf.js this file touches. */
interface PdfTextItem { str: string; transform: number[]; width: number; height: number; fontName: string }
interface PdfPage {
  view: number[]
  getTextContent(): Promise<{ items: unknown[] }>
  getOperatorList(): Promise<{ fnArray: number[] }>
  getAnnotations(): Promise<{ subtype?: string; url?: string; unsafeUrl?: string }[]>
  commonObjs: { has(id: string): boolean; get(id: string): { name?: string } | null }
  cleanup(): void
}
interface PdfDocument {
  numPages: number
  getPage(n: number): Promise<PdfPage>
  getMetadata(): Promise<{ info?: Record<string, unknown> }>
}
export interface PdfJs {
  getDocument(src: { data: Uint8Array; verbosity?: number; fontExtraProperties?: boolean }): { promise: Promise<PdfDocument>; destroy(): Promise<void> }
  OPS: Record<string, number>
}

interface Fragment { text: string; x: number; end: number; y: number; size: number; font: string }
interface Segment { text: string; x: number; end: number }
interface Row { y: number; size: number; bold: boolean; segments: Segment[] }

const MAX_PAGES = 8

const DATEISH = /^[\s\d/.,'’–—-]*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?|present|current|now|ongoing|to|\d{2,4})([\s\d/.,'’–—-]|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?|present|current|now|ongoing|to)*$/i

/* Fragments on the same baseline become one row; a wide horizontal gap
 * inside a row starts a new segment (a right-aligned date, or a second
 * column). */
function buildRows(fragments: Fragment[], fontNames: Map<string, string>): Row[] {
  const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x)
  const groups: Fragment[][] = []
  for (const f of sorted) {
    const last = groups[groups.length - 1]
    if (last && Math.abs(last[0].y - f.y) <= Math.max(2, Math.min(last[0].size, f.size) * 0.45)) last.push(f)
    else groups.push([f])
  }

  return groups.map(group => {
    group.sort((a, b) => a.x - b.x)
    const segments: Segment[] = []
    let boldChars = 0
    let chars = 0
    for (const f of group) {
      const fontName = fontNames.get(f.font) ?? ''
      if (/bold|black|heavy|semibold|demi/i.test(fontName)) boldChars += f.text.length
      chars += f.text.length

      const prev = segments[segments.length - 1]
      if (!prev) { segments.push({ text: f.text, x: f.x, end: f.end }); continue }
      const gap = f.x - prev.end
      const isMarker = prev.text.trim().length <= 3 // a bullet glyph or "1." stays with its text
      if (gap > Math.max(22, f.size * 2.2) && !isMarker) {
        segments.push({ text: f.text, x: f.x, end: f.end })
      } else {
        const needsSpace = gap > f.size * 0.18 && !prev.text.endsWith(' ') && !f.text.startsWith(' ')
        prev.text += (needsSpace ? ' ' : '') + f.text
        prev.end = Math.max(prev.end, f.end)
      }
    }
    return {
      y: group[0].y,
      size: Math.max(...group.map(f => f.size)),
      bold: chars > 0 && boldChars / chars > 0.6,
      segments: segments.map(s => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() })).filter(s => s.text),
    }
  }).filter(r => r.segments.length > 0)
}

/* Two columns leave a gutter: an x where many lines start, which the text
 * to its left never crosses. A single-column page fails both tests — its
 * body lines run straight through any x you pick — and right-aligned dates
 * fail the first, because they share a right edge, not a left one.
 * Returns the gutter x, or null. */
function findGutter(rows: Row[], pageWidth: number): number | null {
  const segments = rows.flatMap(r => r.segments)
  const starts = segments
    .filter(s => s.x > pageWidth * 0.25 && s.x < pageWidth * 0.75 && !DATEISH.test(s.text))
    .map(s => s.x)
  if (starts.length < 6) return null

  let best = { x: 0, count: 0 }
  for (const x of starts) {
    const count = starts.filter(s => Math.abs(s - x) <= 4).length
    if (count > best.count) best = { x, count }
  }
  if (best.count < 6) return null

  const gutter = best.x - 6
  const left = segments.filter(s => s.x < gutter - 12)
  const crossing = left.filter(s => s.end > gutter + 18).length
  const contained = left.length - crossing
  if (contained < 4 || crossing > left.length * 0.3) return null
  return gutter
}

function rowToLine(row: Row, page: number, segments: Segment[]): Line {
  return {
    text: segments.map(s => s.text).join('  '),
    page,
    x: segments[0].x,
    end: segments[segments.length - 1].end,
    size: Math.round(row.size * 10) / 10,
    bold: row.bold,
  }
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function cleanFontName(name: string): string {
  return name
    .replace(/^[A-Z]{6}\+/, '')
    .replace(/([-,_ ]?(bold|italic|oblique|regular|medium|light|semibold|demi|black|heavy|roman|psmt|mt|ps))+$/i, '')
    .replace(/[-,_]+$/, '')
    .trim()
}

export async function extractPdf(pdfjs: PdfJs, data: Uint8Array, fileName: string): Promise<ExtractedDoc> {
  const fileSize = data.byteLength
  // pdf.js takes ownership of the buffer it is given
  const task = pdfjs.getDocument({ data: data.slice(), verbosity: 0, fontExtraProperties: true })
  const doc = await task.promise

  const lines: Line[] = []
  const fonts = new Set<string>()
  const sizes: number[] = []
  const linkTargets: string[] = []
  let images = 0
  let columns = false

  try {
    const pageCount = Math.min(doc.numPages, MAX_PAGES)
    for (let n = 1; n <= pageCount; n++) {
      const page = await doc.getPage(n)
      const pageWidth = page.view[2] - page.view[0]

      // The operator list is what loads fonts, so it comes first.
      const ops = await page.getOperatorList()
      for (const fn of ops.fnArray) {
        if (fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintInlineImageXObject || fn === pdfjs.OPS.paintImageXObjectRepeat) images++
      }

      const content = await page.getTextContent()
      const fragments: Fragment[] = []
      const fontNames = new Map<string, string>()
      for (const raw of content.items) {
        const item = raw as PdfTextItem
        if (typeof item.str !== 'string' || !item.str.trim()) continue
        const size = item.height || Math.hypot(item.transform[2], item.transform[3]) || 10
        fragments.push({
          text: item.str,
          x: item.transform[4],
          end: item.transform[4] + item.width,
          y: item.transform[5],
          size,
          font: item.fontName,
        })
        for (let i = 0; i < item.str.length; i += 1) sizes.push(size)
        if (!fontNames.has(item.fontName)) {
          let name = ''
          try { if (page.commonObjs.has(item.fontName)) name = page.commonObjs.get(item.fontName)?.name ?? '' } catch { /* font not resolved */ }
          fontNames.set(item.fontName, name)
          const family = cleanFontName(name)
          if (family) fonts.add(family)
        }
      }

      const rows = buildRows(fragments, fontNames)
      const gutter = findGutter(rows, pageWidth)
      if (gutter === null) {
        for (const row of rows) lines.push(rowToLine(row, n, row.segments))
      } else {
        // Rebuild each column from its own fragments and read it top to
        // bottom, so the content can still be assessed. Lines that span the
        // gutter (a full-width name banner) stay with the left column.
        columns = true
        const spanning = new Set(rows.flatMap(r => r.segments).filter(s => s.x < gutter - 12 && s.end > gutter + 18).map(s => Math.round(s.x)))
        const isLeft = (f: Fragment) => f.x < gutter || spanning.has(Math.round(f.x))
        for (const side of [fragments.filter(isLeft), fragments.filter(f => !isLeft(f))]) {
          for (const row of buildRows(side, fontNames)) lines.push(rowToLine(row, n, row.segments))
        }
      }

      try {
        for (const a of await page.getAnnotations()) {
          const url = a.url ?? a.unsafeUrl
          if (a.subtype === 'Link' && url) linkTargets.push(url)
        }
      } catch { /* annotations are optional */ }

      page.cleanup()
    }

    let producer: string | undefined
    let creator: string | undefined
    try {
      const meta = await doc.getMetadata()
      if (typeof meta.info?.Producer === 'string') producer = meta.info.Producer
      if (typeof meta.info?.Creator === 'string') creator = meta.info.Creator
    } catch { /* metadata is optional */ }

    const signals: DocSignals = {
      images,
      tables: 0,
      textBoxes: 0,
      tableWordShare: 0,
      columns,
      fonts: Array.from(fonts),
      bodySize: median(sizes),
      producer,
      creator,
      linkTargets,
      headerFooterText: '',
    }

    return { kind: 'pdf', fileName, fileSize, pages: doc.numPages, pagesEstimated: false, lines, signals }
  } finally {
    await task.destroy()
  }
}
