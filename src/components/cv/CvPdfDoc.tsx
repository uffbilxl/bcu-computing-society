'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { CVData, CVEntry, SectionKey, sectionTitle } from '@/lib/cv'
import type { Density } from '@/components/cv/CVPreview'

/* Mirrors CVPreview's density scale, converted px → pt (×0.75) so the
   downloaded PDF paginates identically to the live preview. */
const D = [
  { font: 9.4, lh: 1.45, sectionGap: 13.5, entryGap: 8.25, bulletGap: 2.25, namePt: 22.5, padY: 40.5, padX: 46.5 },
  { font: 9,   lh: 1.34, sectionGap: 9.75, entryGap: 6,    bulletGap: 1.5,  namePt: 21,   padY: 34.5, padX: 43.5 },
  { font: 8.6, lh: 1.26, sectionGap: 7.5,  entryGap: 4.5,  bulletGap: 0.75, namePt: 19.5, padY: 28.5, padX: 40.5 },
] as const

function hasEntries(entries: CVEntry[]) {
  return entries.some(e => e.org.trim() || e.role.trim() || e.bullets.some(b => b.trim()))
}

export function CvPdfDoc({ data, density }: { data: CVData; density: Density }) {
  const d = D[density]

  const s = StyleSheet.create({
    page: {
      fontFamily: 'Times-Roman',
      fontSize: d.font,
      lineHeight: d.lh,
      color: '#000000',
      paddingVertical: d.padY,
      paddingHorizontal: d.padX,
    },
    /* lineHeight must be set here: react-pdf inherits the page's computed
       line height (sized for body text), which is shorter than these glyphs */
    name: { fontSize: d.namePt, lineHeight: 1.15, textAlign: 'center', letterSpacing: 0.8 },
    contact: { textAlign: 'center', marginTop: 2 },
    sectionTitle: {
      fontFamily: 'Times-Bold',
      fontSize: d.font + 0.75,
      textTransform: 'uppercase',
      textDecoration: 'underline',
      letterSpacing: 0.2,
      marginTop: d.sectionGap,
      marginBottom: Math.max(3, d.entryGap - 2.25),
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 9 },
    bold: { fontFamily: 'Times-Bold' },
    italic: { fontFamily: 'Times-Italic' },
    bulletRow: { flexDirection: 'row', marginBottom: d.bulletGap, paddingLeft: 6 },
    bulletDot: { width: 11 },
    bulletText: { flex: 1 },
    skillRow: { flexDirection: 'row', marginBottom: 1.5 },
    skillLabel: { fontFamily: 'Times-Italic', width: 100 },
    skillValue: { flex: 1 },
  })

  const contactParts = [data.email, data.phone, data.linkedin, data.github, data.portfolio]
    .map(x => x.trim())
    .filter(Boolean)

  const visible: Record<SectionKey, boolean> = {
    summary: data.summary.trim().length > 0,
    education: hasEntries(data.education),
    experience: hasEntries(data.experience),
    extracurricular: hasEntries(data.extracurricular),
    skills: data.skills.some(x => x.value.trim()),
  }

  const entryBlock = (e: CVEntry, last: boolean) => (
    <View key={e.id} style={{ marginBottom: last ? 0 : d.entryGap }}>
      <View style={s.row}>
        <Text style={s.bold}>{e.org}</Text>
        <Text style={s.bold}>{e.location}</Text>
      </View>
      <View style={s.row}>
        <Text style={s.italic}>{e.role}</Text>
        <Text>{e.dates}</Text>
      </View>
      <View style={{ marginTop: d.bulletGap }}>
        {e.bullets.filter(b => b.trim()).map((b, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  )

  const renderSection = (key: SectionKey) => {
    if (!visible[key]) return null
    switch (key) {
      case 'summary':
        return (
          <View key={key}>
            <Text style={s.sectionTitle}>{sectionTitle(data, key)}</Text>
            <Text>{data.summary}</Text>
          </View>
        )
      case 'education':
      case 'experience':
      case 'extracurricular': {
        const entries = data[key].filter(e => e.org.trim() || e.role.trim() || e.bullets.some(b => b.trim()))
        return (
          <View key={key}>
            <Text style={s.sectionTitle}>{sectionTitle(data, key)}</Text>
            {entries.map((e, i) => entryBlock(e, i === entries.length - 1))}
          </View>
        )
      }
      case 'skills':
        return (
          <View key={key}>
            <Text style={s.sectionTitle}>{sectionTitle(data, key)}</Text>
            {data.skills.filter(x => x.value.trim()).map(x => (
              <View key={x.id} style={s.skillRow}>
                <Text style={s.skillLabel}>{x.label}:</Text>
                <Text style={s.skillValue}>{x.value}</Text>
              </View>
            ))}
          </View>
        )
    }
  }

  return (
    <Document title={`${data.name || 'CV'} - CV`} author={data.name || undefined}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{data.name || 'YOUR NAME'}</Text>
        {contactParts.length > 0 && <Text style={s.contact}>{contactParts.join(' | ')}</Text>}
        {data.sectionOrder.map(renderSection)}
      </Page>
    </Document>
  )
}
