'use client'

import { Download, FileText, FileSpreadsheet, Archive, Loader2 } from 'lucide-react'
import { useState } from 'react'
import PdfExportButton from './PdfExportButton'

export default function ExportButtons() {
  const [loading, setLoading] = useState<string | null>(null)

  async function exportFile(type: string) {
    setLoading(type)
    try {
      const res = await fetch(`/api/export/${type}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('content-disposition') || ''
      const match = cd.match(/filename="(.+)"/)
      a.download = match ? match[1] : `export.${type}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const buttons = [
    { type: 'csv',   label: 'CSV',      Icon: FileText,        color: 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200' },
    { type: 'excel', label: 'Excel',    Icon: FileSpreadsheet, color: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
    { type: 'zip',   label: 'Full ZIP', Icon: Archive,         color: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map(({ type, label, Icon, color }) => (
        <button
          key={type}
          onClick={() => exportFile(type)}
          disabled={loading !== null}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${color} disabled:opacity-50`}
        >
          {loading === type ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
          {loading === type ? 'Exporting...' : label}
        </button>
      ))}

      {/* PDF generated in browser — no server timeout */}
      <PdfExportButton />
    </div>
  )
}
