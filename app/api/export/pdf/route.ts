import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import jsPDF from 'jspdf'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds — Netlify allows up to 26s on free, 60s on pro

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`
  } catch {
    return null
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('submissions')
    .select('full_name, roll_number, department, year, signature_url, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })

  // ── Fetch ALL signatures in parallel (much faster than sequential) ──────
  const signatureImages = await Promise.all(
    data.map((row) => fetchImageAsBase64(row.signature_url))
  )

  // ── Build PDF ────────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 15

  // Column X positions
  const col = {
    num:  margin,
    name: margin + 10,
    roll: margin + 58,
    dept: margin + 93,
    year: margin + 122,
    sig:  margin + 148,
  }
  const sigColW = pageW - margin - col.sig  // remaining width for signature
  const rowH    = 24
  const headerH = 8

  // ── PAGE HEADER ──────────────────────────────────────────────────────────
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
    'compulsory uniform policy. We believe that the implementation of this policy may not reflect the ' +
    'preferences, comfort, practical considerations, and financial situations of all students. By signing ' +
    'below, we acknowledge our support for submitting a formal representation to the college administration ' +
    'requesting a review, discussion, and reconsideration of the compulsory uniform requirement.'
  const stLines = doc.splitTextToSize(statement, pageW - margin * 2)
  doc.text(stLines, margin, 46)

  let y = 46 + stLines.length * 4 + 6

  // ── TABLE HEADER FUNCTION ────────────────────────────────────────────────
  function drawTableHeader() {
    doc.setFillColor(30, 64, 175)
    doc.rect(margin, y, pageW - margin * 2, headerH, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('#',           col.num  + 1, y + 5.5)
    doc.text('Full Name',   col.name + 1, y + 5.5)
    doc.text('Roll No.',    col.roll + 1, y + 5.5)
    doc.text('Dept',        col.dept + 1, y + 5.5)
    doc.text('Year',        col.year + 1, y + 5.5)
    doc.text('Signature',   col.sig  + 1, y + 5.5)
    y += headerH
  }

  drawTableHeader()

  // ── ROWS ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const sigBase64 = signatureImages[i]

    // New page check
    if (y + rowH > pageH - 12) {
      doc.addPage()
      y = 15
      drawTableHeader()
    }

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
    }

    // Row border
    doc.setDrawColor(220, 220, 220)
    doc.rect(margin, y, pageW - margin * 2, rowH, 'S')

    // Text
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    const textY = y + rowH / 2 + 1

    doc.text(String(i + 1),                    col.num  + 1, textY)
    doc.text(truncate(row.full_name, 22),       col.name + 1, textY)
    doc.text(row.roll_number,                   col.roll + 1, textY)
    doc.text(row.department,                    col.dept + 1, textY)
    doc.text(row.year,                          col.year + 1, textY)

    // Signature image — large and clear
    if (sigBase64) {
      doc.addImage(sigBase64, 'PNG', col.sig + 1, y + 2, sigColW - 3, rowH - 4)
    } else {
      doc.setTextColor(180, 180, 180)
      doc.setFontSize(7)
      doc.text('(unavailable)', col.sig + 1, textY)
    }

    y += rowH
  }

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
