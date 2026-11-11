/* The ATS checker reads PDFs in the browser with pdf.js, whose worker must be
 * served as a plain static file from the same version as the library. Copy
 * it into public/ after every install so the two can never drift apart. */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')
const to = join(root, 'public/pdf.worker.min.mjs')

if (existsSync(from)) {
  copyFileSync(from, to)
  console.log('Copied pdf.js worker to public/')
} else {
  console.warn('pdf.js worker not found; keeping the committed copy in public/')
}
