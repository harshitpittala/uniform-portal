import { getAdminFromCookies } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminNav from '../AdminNav'
import StudentsTable from './StudentsTable'

export default async function StudentsPage() {
  const admin = await getAdminFromCookies()
  if (!admin) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Student Records</h1>
          <p className="text-gray-500 text-sm mt-1">All submitted acknowledgments with signatures</p>
        </div>
        <StudentsTable />
      </div>
    </div>
  )
}
