import { getAdminFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AdminNav from '../AdminNav'
import { format } from 'date-fns'
import { Activity, Download, LogIn, PenLine, FileText } from 'lucide-react'

async function getLogs() {
  const db = supabaseAdmin()
  const { data } = await db
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return data || []
}

const actionIcons: Record<string, typeof Activity> = {
  new_submission: PenLine,
  admin_login: LogIn,
  export_csv: Download,
  export_excel: Download,
  export_pdf: FileText,
  export_zip: Download,
}

const actionColors: Record<string, string> = {
  new_submission: 'bg-green-100 text-green-700',
  admin_login: 'bg-blue-100 text-blue-700',
  export_csv: 'bg-amber-100 text-amber-700',
  export_excel: 'bg-emerald-100 text-emerald-700',
  export_pdf: 'bg-red-100 text-red-700',
  export_zip: 'bg-purple-100 text-purple-700',
}

export default async function LogsPage() {
  const admin = await getAdminFromCookies()
  if (!admin) redirect('/admin/login')

  const logs = await getLogs()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Activity Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Complete audit trail of all system activities</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Details</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">IP</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const Icon = actionIcons[log.action] ?? Activity
                  const color = actionColors[log.action] ?? 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
                          <Icon className="w-3 h-3" />
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.details || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip_address || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm:ss a')}
                      </td>
                    </tr>
                  )
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      No activity logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
