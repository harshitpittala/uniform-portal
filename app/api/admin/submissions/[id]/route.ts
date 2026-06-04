import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = supabaseAdmin()

  // Get the submission to find the signature file
  const { data: submission } = await db
    .from('submissions')
    .select('roll_number, signature_url')
    .eq('id', id)
    .single()

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete the signature file from storage
  const fileName = submission.signature_url.split('/').pop()
  if (fileName) {
    await db.storage.from('signatures').remove([fileName])
  }

  // Delete the submission record
  const { error } = await db.from('submissions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })

  // Log activity
  await db.from('activity_logs').insert({
    action: 'delete_submission',
    details: `Deleted submission: ${submission.roll_number}`,
    ip_address: req.headers.get('x-forwarded-for') || null,
  })

  return NextResponse.json({ success: true })
}
