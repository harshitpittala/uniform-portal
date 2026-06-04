'use client'

import { useEffect, useState } from 'react'
import { Users, BookOpen, GraduationCap } from 'lucide-react'

interface Stats {
  total: number
  byDepartment: Record<string, number>
  byYear: Record<string, number>
}

export default function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  async function fetchStats() {
    try {
      const res = await fetch('/api/submissions/stats')
      if (res.ok) setStats(await res.json())
    } catch {}
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) return null

  const topDept = Object.entries(stats.byDepartment).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const topYear = Object.entries(stats.byYear).sort((a, b) => b[1] - a[1])

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Live Support Statistics</h2>

        {/* Total */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-8 py-5 shadow-lg border border-blue-100">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-4xl font-black text-blue-700">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 font-medium">Students Have Signed</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Department */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">By Department</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.byDepartment)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => (
                  <div key={dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{dept}</span>
                      <span className="font-semibold text-blue-700">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* By Year */}
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">By Year</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.byYear)
                .sort((a, b) => b[1] - a[1])
                .map(([year, count]) => (
                  <div key={year}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{year}</span>
                      <span className="font-semibold text-indigo-700">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
