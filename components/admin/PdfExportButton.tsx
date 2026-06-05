'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'

interface Submission {
  full_name: string
  roll_number: string
  department: string
  year: string
  signature_url: string
  created_at: string
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export default function PdfExportButton() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  async function handleExport() {
    setLoading(true)
    setProgress('Fetching records...')

    try {
      // Fetch all submissions
      const res = await fetch('/api/admin/submissions?limit=10000&page=1')
      const json = await res.json()
      const data: Submission[] = json.data || []

      if (data.length === 0) {
        alert('No records to export.')
        return
      }

      // Fetch all signatures in parallel in the browser
      setProgress(`Loading ${data.length} signatures...`)
      const signatureImages = await Promise.all(
        data.map((row) => fetchImageAsBase64(row.signature_url))
      )

      setProgress('Generating PDF...')

      // Build PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const margin = 15

      const col = {
        num:  margin,
        name: margin + 10,
        roll: margin + 58,
        dept: margin + 93,
        year: margin + 122,
        sig:  margin + 148,
      }
      const sigColW = pageW - margin - col.sig
      const rowH    = 24
      const headerH = 8

      // Header
      doc.setFillColor(30, 64, 175)
      doc.rect(0, 0, pageW, 38, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Student Representation', pageW / 2, 14, { align: 'center' })
      doc.text('Regarding the Compulsory Uniform Policy', pageW / 2, 23, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Signatures: ${data.length}`, pageW / 2, 32, { align: 'center' })

      // Statement
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'italic')
      const statement =
        'We, the undersigned students, respectfully express our concerns regarding the recently introduced ' +
        'compulsory uniform policy. We believe that the implementation of this policy may not reflect the ' +
        'preferences, comfort, practical considerations, and financial situations of all students. By signing ' +
        'below, we acknowledge our support for submitting a formal representation to the college administration ' +
        'requesting a review, discussion, and reconsideration of the compulsory uniform requirement.'
      const stLines = doc.splitTextToSize(statement, pageW - margin * 2)
      doc.text(stLines, margin, 46)

      let y = 46 + stLines.length * 4 + 6

      function drawTableHeader() {
        doc.setFillColor(30, 64, 175)
        doc.rect(margin, y, pageW - margin * 2, headerH, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('#',          col.num  + 1, y + 5.5)
        doc.text('Full Name',  col.name + 1, y + 5.5)
        doc.text('Roll No.',   col.roll + 1, y + 5.5)
        doc.text('Dept',       col.dept + 1, y + 5.5)
        doc.text('Year',       col.year + 1, y + 5.5)
        doc.text('Signature',  col.sig  + 1, y + 5.5)
        y += headerH
      }

      drawTableHeader()

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const sigBase64 = signatureImages[i]

        if (y + rowH > pageH - 12) {
          doc.addPage()
          y = 15
          drawTableHeader()
        }

        // Alternating row bg
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
        }

        // Row border
        doc.setDrawColor(220, 220, 220)
        doc.rect(margin, y, pageW - margin * 2, rowH, 'S')

        // Text
        doc.setTextColor(50, 50, 50)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        const textY = y + rowH / 2 + 1

        doc.text(String(i + 1),                  col.num  + 1, textY)
        doc.text(truncate(row.full_name, 22),     col.name + 1, textY)
        doc.text(row.roll_number,                 col.roll + 1, textY)
        doc.text(row.department,                  col.dept + 1, textY)
        doc.text(row.year,                        col.year + 1, textY)

        // Signature image — large and clear
        if (sigBase64) {
          doc.addImage(sigBase64, 'PNG', col.sig + 1, y + 2, sigColW - 3, rowH - 4)
        } else {
          doc.setTextColor(180, 180, 180)
          doc.setFontSize(7)
          doc.text('(unavailable)', col.sig + 1, textY)
        }

        y += rowH
      }

      // Page numbers
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        doc.setFontSize(7.5)
        doc.setTextColor(160, 160, 160)
        doc.text(
          `Page ${p} of ${pageCount}  ·  Student Representation Portal`,
          pageW / 2, pageH - 4, { align: 'center' }
        )
      }

      doc.save(`student_representation_${Date.now()}.pdf`)
    } catch (err) {
      console.error(err)
      alert('PDF generation failed. Please try again.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all text-red-700 bg-red-50 hover:bg-red-100 border-red-200 disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">{progress || 'Generating...'}</span>
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          PDF Report
        </>
      )}
    </button>
  )
}
