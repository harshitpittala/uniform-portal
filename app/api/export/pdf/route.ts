import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return `data:image/png;base64,${base64}`
  } catch {
    return null
  }
}

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('submissions')
    .select('full_name, roll_number, department, year, signature_url, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 15

  // ── HEADER ──────────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, pageW, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Representation', pageW / 2, 14, { align: 'center' })
  doc.text('Regarding the Compulsory Uniform Policy', pageW / 2, 23, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Signatures: ${data.length}`, pageW / 2, 32, { align: 'center' })

  // ── STATEMENT ────────────────────────────────────────────────────────────
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'italic')
  const statement =
    'We, the undersigned students, respectfully express our concerns regarding the recently introduced ' +
    'compulsory uniform policy. We believe that the implementation of this policy may not reflect the preferences, ' +
    'comfort, practical considerations, and financial situations of all students. By signing below, we acknowledge ' +
    'our support for submitting a formal representation to the college administration requesting a review, discussion, ' +
    'and reconsideration of the compulsory uniform requirement.'
  const stLines = doc.splitTextToSize(statement, pageW - margin * 2)
  doc.text(stLines, margin, 46)

  // ── TABLE HEADER ─────────────────────────────────────────────────────────
  let y = 46 + stLines.length * 4 + 6

  const colX    = { num: margin, name: margin + 10, roll: margin + 60, dept: margin + 95, year: margin + 125, sig: margin + 148 }
  const rowH    = 22   // height of each data row (tall enough for signature)
  const headerH = 8

  function drawTableHeader() {
    doc.setFillColor(30, 64, 175)
    doc.rect(margin, y, pageW - margin * 2, headerH, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('#',          colX.num  + 1,  y + 5.5)
    doc.text('Full Name',  colX.name + 1,  y + 5.5)
    doc.text('Roll No.',   colX.roll + 1,  y + 5.5)
    doc.text('Dept',       colX.dept + 1,  y + 5.5)
    doc.text('Year',       colX.year + 1,  y + 5.5)
    doc.text('Signature',  colX.sig  + 1,  y + 5.5)
    y += headerH
  }

  drawTableHeader()

  // ── ROWS ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < data.length; i++) {
    const row = data[i]

    // New page if needed
    if (y + rowH > pageH - 12) {
      // footer on current page
      addFooter(doc, y + 4)
      doc.addPage()
      y = 15
      drawTableHeader()
    }

    // Row background (alternating)
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
    }

    // Row border
    doc.setDrawColor(220, 220, 220)
    doc.rect(margin, y, pageW - margin * 2, rowH, 'S')

    // Text cells
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')

    const textY = y + rowH / 2 + 1

    doc.text(String(i + 1),        colX.num  + 1,  textY)
    doc.text(truncate(row.full_name, 22), colX.name + 1,  textY)
    doc.text(row.roll_number,      colX.roll + 1,  textY)
    doc.text(row.department,       colX.dept + 1,  textY)
    doc.text(row.year,             colX.year + 1,  textY)

    // Signature image
    const sigBase64 = await fetchImageAsBase64(row.signature_url)
    if (sigBase64) {
      const sigW = 45
      const sigH = rowH - 4
      doc.addImage(sigBase64, 'PNG', colX.sig + 1, y + 2, sigW, sigH)
    } else {
      doc.setTextColor(180, 180, 180)
      doc.setFontSize(7)
      doc.text('(unavailable)', colX.sig + 1, textY)
    }

    y += rowH
  }

  // ── FOOTER on last page ───────────────────────────────────────────────────
  addFooter(doc, y + 6)

  // ── PAGE NUMBERS ─────────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(160, 160, 160)
    doc.text(
      `Page ${p} of ${pageCount}  ·  Student Representation Portal`,
      pageW / 2, pageH - 4, { align: 'center' }
    )
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  await db.from('activity_logs').insert({
    action: 'export_pdf',
    details: `PDF export: ${data.length} records`,
    ip_address: null,
  })

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="student_representation_${Date.now()}.pdf"`,
    },
  })
}

function addFooter(doc: jsPDF, y: number) {
  // nothing extra needed — page numbers are added at the end
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}
