import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = supabaseAdmin()
  const { searchParams } = new URL(req.url)

  const search = searchParams.get('search') || ''
  const department = searchParams.get('department') || ''
  const year = searchParams.get('year') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sortBy') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false

  let query = db.from('submissions').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%`)
  }
  if (department) query = query.eq('department', department)
  if (year) query = query.eq('year', year)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

  query = query.order(sortBy, { ascending: sortOrder })
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 })

  return NextResponse.json({ data, count, page, limit })
}
