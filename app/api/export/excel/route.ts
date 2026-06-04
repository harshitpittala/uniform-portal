import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('submissions')
    .select('full_name, roll_number, department, year, signature_url, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  const rows = data.map((r) => ({
    'Full Name': r.full_name,
    'Roll Number': r.roll_number,
    'Department': r.department,
    'Year': r.year,
    'Submission Date': new Date(r.created_at).toLocaleString(),
    'Signature Link': r.signature_url,
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 22 }, { wch: 60 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Student Signatures')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  await db.from('activity_logs').insert({
    action: 'export_excel',
    details: `Excel export: ${data.length} records`,
    ip_address: null,
  })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="student_representation_${Date.now()}.xlsx"`,
    },
  })
}
