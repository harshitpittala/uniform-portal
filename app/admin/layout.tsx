import { redirect } from 'next/navigation'
import { getAdminFromCookies } from '@/lib/auth'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
