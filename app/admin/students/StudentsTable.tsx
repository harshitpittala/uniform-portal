'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, Trash2 } from 'lucide-react'
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Submission | null>(null)

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

  async function handleDelete(submission: Submission) {
    setDeletingId(submission.id)
    try {
      const res = await fetch(`/api/admin/submissions/${submission.id}`, { method: 'DELETE' })
      if (res.ok) {
        setData((prev) => prev.filter((r) => r.id !== submission.id))
        setTotal((t) => t - 1)
      } else {
        alert('Failed to delete. Please try again.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
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
                      <button onClick={() => setSelectedSig(row)}>
                        <img
                          src={row.signature_url}
                          alt="sig"
                          className="h-10 w-24 object-contain border border-gray-200 rounded-lg bg-white p-1 hover:border-blue-400 transition-colors cursor-pointer"
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmDelete(row)}
                        disabled={deletingId === row.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
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

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Response?</h3>
            <p className="text-sm text-gray-500 text-center mb-1">
              <span className="font-medium text-gray-800">{confirmDelete.full_name}</span>
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              {confirmDelete.roll_number} — {confirmDelete.department} {confirmDelete.year}
            </p>
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3 text-center mb-5">
              This will permanently delete the response and signature. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete.id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
