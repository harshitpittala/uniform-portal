import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rate limiting: simple in-memory store (for production use Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let body: {
    full_name?: string
    roll_number?: string
    department?: string
    year?: string
    signature_base64?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { full_name, roll_number, department, year, signature_base64 } = body

  // Validation
  if (!full_name?.trim() || !roll_number?.trim() || !department?.trim() || !year?.trim() || !signature_base64) {
    return NextResponse.json({ error: 'All fields including signature are required.' }, { status: 400 })
  }

  // Sanitize inputs
  const cleanName = full_name.trim().replace(/<[^>]*>/g, '')
  const cleanRoll = roll_number.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')

  if (cleanName.length < 2 || cleanName.length > 100) {
    return NextResponse.json({ error: 'Invalid name.' }, { status: 400 })
  }
  if (cleanRoll.length < 3 || cleanRoll.length > 20) {
    return NextResponse.json({ error: 'Invalid roll number.' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Check duplicate
  const { data: existing } = await db
    .from('submissions')
    .select('id')
    .eq('roll_number', cleanRoll)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'You have already submitted your acknowledgment.' },
      { status: 409 }
    )
  }

  // Upload signature to Supabase Storage
  const base64Data = signature_base64.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const fileName = `${cleanRoll}_${Date.now()}.png`

  const { error: uploadError } = await db.storage
    .from('signatures')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: false })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to save signature.' }, { status: 500 })
  }

  const { data: urlData } = db.storage.from('signatures').getPublicUrl(fileName)
  const signature_url = urlData.publicUrl

  // Insert submission
  const { error: insertError } = await db.from('submissions').insert({
    full_name: cleanName,
    roll_number: cleanRoll,
    department,
    year,
    signature_url,
  })

  if (insertError) {
    console.error('Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save submission.' }, { status: 500 })
  }

  // Log activity
  await db.from('activity_logs').insert({
    action: 'new_submission',
    details: `${cleanName} (${cleanRoll}) - ${department} ${year}`,
    ip_address: ip,
  })

  return NextResponse.json({ success: true, message: 'Submission recorded.' }, { status: 201 })
}

export async function GET() {
  const db = supabaseAdmin()
  const { count } = await db
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ count: count ?? 0 })
}
