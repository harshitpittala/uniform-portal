'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import SignatureModal from '@/components/admin/SignatureModal'
import ExportButtons from '@/components/admin/ExportButtons'
import { Submission } from '@/types'
import { DEPARTMENTS, YEARS } from '@/types'
import { format } from 'date-fns'

interface ApiResponse {
  data: Submission[]
  count: number
  page: number
  limit: number
}

export default function StudentsTable() {
  const [data, setData] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedSig, setSelectedSig] = useState<Submission | null>(null)

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    year: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const LIMIT = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      ...filters,
      page: String(page),
      limit: String(LIMIT),
    })
    try {
      const res = await fetch(`/api/admin/submissions?${params}`)
      const json: ApiResponse = await res.json()
      setData(json.data || [])
      setTotal(json.count || 0)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  function toggleSort(col: string) {
    setFilters((f) => ({
      ...f,
      sortBy: col,
      sortOrder: f.sortBy === col && f.sortOrder === 'desc' ? 'asc' : 'desc',
    }))
    setPage(1)
  }

  function SortIcon({ col }: { col: string }) {
    if (filters.sortBy !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />
    return filters.sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.department}
            onChange={(e) => { setFilters((f) => ({ ...f, department: e.target.value })); setPage(1) }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filters.year}
            onChange={(e) => { setFilters((f) => ({ ...f, year: e.target.value })); setPage(1) }}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            Date range:
          </div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 ml-auto">
            {total} record{total !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <ExportButtons />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  { key: 'full_name', label: 'Full Name' },
                  { key: 'roll_number', label: 'Roll Number' },
                  { key: 'department', label: 'Department' },
                  { key: 'year', label: 'Year' },
                  { key: 'created_at', label: 'Date' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left px-4 py-3 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon col={key} />
                    </div>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Signature</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{row.full_name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.roll_number}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                        {row.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.year}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(row.created_at), 'dd MMM yyyy, hh:mm a')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSig(row)}
                        className="group relative"
                      >
                        <img
                          src={row.signature_url}
                          alt="sig"
                          className="h-10 w-24 object-contain border border-gray-200 rounded-lg bg-white p-1 hover:border-blue-400 transition-colors cursor-pointer"
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {selectedSig && (
        <SignatureModal
          signatureUrl={selectedSig.signature_url}
          studentName={selectedSig.full_name}
          rollNumber={selectedSig.roll_number}
          onClose={() => setSelectedSig(null)}
        />
      )}
    </div>
  )
}
