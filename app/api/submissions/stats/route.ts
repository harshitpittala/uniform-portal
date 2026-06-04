import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = supabaseAdmin()

  const { data, error } = await db
    .from('submissions')
    .select('department, year, created_at')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }

  const today = new Date().toISOString().split('T')[0]
  const byDepartment: Record<string, number> = {}
  const byYear: Record<string, number> = {}
  let todayCount = 0

  for (const row of data) {
    byDepartment[row.department] = (byDepartment[row.department] || 0) + 1
    byYear[row.year] = (byYear[row.year] || 0) + 1
    if (row.created_at.startsWith(today)) todayCount++
  }

  return NextResponse.json({
    total: data.length,
    today: todayCount,
    byDepartment,
    byYear,
  })
}
