export interface Submission {
  id: string
  full_name: string
  roll_number: string
  department: string
  year: string
  signature_url: string
  created_at: string
}

export interface ActivityLog {
  id: string
  action: string
  details: string | null
  ip_address: string | null
  created_at: string
}

export interface DashboardStats {
  total: number
  today: number
  byDepartment: Record<string, number>
  byYear: Record<string, number>
}

export const DEPARTMENTS = [
  'CSE', 'CSM', 'CSIT', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other',
]

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
