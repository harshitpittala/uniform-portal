import { getAdminFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import AdminNav from './AdminNav'
import DashboardCharts from '@/components/admin/DashboardCharts'
import ExportButtons from '@/components/admin/ExportButtons'
import { Users, PenLine, Calendar, TrendingUp } from 'lucide-react'

async function getStats() {
  const db = supabaseAdmin()
  const { data } = await db.from('submissions').select('department, year, created_at')
  if (!data) return null

  const today = new Date().toISOString().split('T')[0]
  const byDepartment: Record<string, number> = {}
  const byYear: Record<string, number> = {}
  let todayCount = 0

  for (const row of data) {
    byDepartment[row.department] = (byDepartment[row.department] || 0) + 1
    byYear[row.year] = (byYear[row.year] || 0) + 1
    if (row.created_at.startsWith(today)) todayCount++
  }

  return { total: data.length, today: todayCount, byDepartment, byYear }
}

export default async function AdminDashboard() {
  const admin = await getAdminFromCookies()
  if (!admin) redirect('/admin/login')

  const stats = await getStats()

  const statCards = [
    { label: 'Total Signatures', value: stats?.total ?? 0, icon: PenLine, color: 'text-blue-700 bg-blue-100' },
    { label: 'Total Students', value: stats?.total ?? 0, icon: Users, color: 'text-indigo-700 bg-indigo-100' },
    { label: 'Signatures Today', value: stats?.today ?? 0, icon: Calendar, color: 'text-green-700 bg-green-100' },
    {
      label: 'Top Department',
      value: stats ? Object.entries(stats.byDepartment).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—' : '—',
      icon: TrendingUp,
      color: 'text-purple-700 bg-purple-100',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Student Representation — Uniform Policy Overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className="text-3xl font-black text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {stats && (
          <div className="mb-8">
            <DashboardCharts
              byDepartment={stats.byDepartment}
              byYear={stats.byYear}
            />
          </div>
        )}

        {/* Export */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Export Data</h2>
          <ExportButtons />
        </div>
      </div>
    </div>
  )
}
