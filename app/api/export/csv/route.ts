import { NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('submissions')
    .select('full_name, roll_number, department, year, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  const headers = ['Full Name', 'Roll Number', 'Department', 'Year', 'Submission Date']
  const rows = data.map((r) => [
    `"${r.full_name}"`,
    `"${r.roll_number}"`,
    `"${r.department}"`,
    `"${r.year}"`,
    `"${new Date(r.created_at).toLocaleString()}"`,
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  // Log export
  await db.from('activity_logs').insert({
    action: 'export_csv',
    details: `CSV export: ${data.length} records`,
    ip_address: null,
  })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="student_representation_${Date.now()}.csv"`,
    },
  })
}
