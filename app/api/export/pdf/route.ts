import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('submissions')
    .select('full_name, roll_number, department, year, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Header
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Representation Regarding the', 105, 15, { align: 'center' })
  doc.text('Compulsory Uniform Policy', 105, 24, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}    |    Total Signatures: ${data.length}`, 105, 33, { align: 'center' })

  // Statement
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  const statement =
    'We, the undersigned students, respectfully express our concerns regarding the recently introduced compulsory uniform policy. ' +
    'We believe that the implementation of this policy may not reflect the preferences, comfort, practical considerations, and ' +
    'financial situations of all students. By signing below, we acknowledge our support for submitting a formal representation to ' +
    'the college administration requesting a review, discussion, and reconsideration of the compulsory uniform requirement.'
  const lines = doc.splitTextToSize(statement, 180)
  doc.text(lines, 15, 50)

  // Table
  autoTable(doc, {
    startY: 70,
    head: [['#', 'Full Name', 'Roll Number', 'Department', 'Year', 'Date']],
    body: data.map((r, i) => [
      i + 1,
      r.full_name,
      r.roll_number,
      r.department,
      r.year,
      new Date(r.created_at).toLocaleDateString(),
    ]),
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 28 },
    },
  })

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount}  |  Student Representation Portal`,
      105,
      290,
      { align: 'center' }
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
