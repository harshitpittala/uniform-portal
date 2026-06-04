import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  const zip = new JSZip()
  const root = zip.folder('Student_Representation')!
  const sigFolder = root.folder('signatures')!

  // Download and add signatures
  for (const row of data) {
    try {
      const res = await fetch(row.signature_url)
      if (res.ok) {
        const buf = await res.arrayBuffer()
        sigFolder.file(`${row.roll_number}.png`, buf)
      }
    } catch {
      // Skip failed signature downloads
    }
  }

  // CSV
  const csvHeaders = 'Full Name,Roll Number,Department,Year,Submission Date'
  const csvRows = data.map(
    (r) =>
      `"${r.full_name}","${r.roll_number}","${r.department}","${r.year}","${new Date(r.created_at).toLocaleString()}"`
  )
  root.file('representation_data.csv', [csvHeaders, ...csvRows].join('\n'))

  // Excel
  const excelRows = data.map((r) => ({
    'Full Name': r.full_name,
    'Roll Number': r.roll_number,
    Department: r.department,
    Year: r.year,
    'Submission Date': new Date(r.created_at).toLocaleString(),
    'Signature Link': r.signature_url,
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(excelRows), 'Signatures')
  root.file('representation_data.xlsx', XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

  // PDF
  const doc = new jsPDF()
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Representation - Uniform Policy', 105, 20, { align: 'center' })
  doc.setFontSize(9)
  doc.text(`Total: ${data.length} | ${new Date().toLocaleString()}`, 105, 30, { align: 'center' })

  autoTable(doc, {
    startY: 45,
    head: [['#', 'Name', 'Roll No', 'Dept', 'Year', 'Date']],
    body: data.map((r, i) => [
      i + 1, r.full_name, r.roll_number, r.department, r.year,
      new Date(r.created_at).toLocaleDateString(),
    ]),
    headStyles: { fillColor: [30, 64, 175] },
    styles: { fontSize: 7 },
  })

  root.file('representation_report.pdf', Buffer.from(doc.output('arraybuffer')))

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  await db.from('activity_logs').insert({
    action: 'export_zip',
    details: `ZIP export: ${data.length} records`,
    ip_address: null,
  })

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="Student_Representation_${Date.now()}.zip"`,
    },
  })
}
