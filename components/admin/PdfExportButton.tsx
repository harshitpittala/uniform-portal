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

// Fetch image and compress it via canvas → small JPEG (much smaller than PNG)
async function fetchCompressedImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        // Draw at fixed small size — enough to be clear in PDF
        const canvas = document.createElement('canvas')
        canvas.width  = 500
        canvas.height = 150
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // Scale to fit
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const w = img.width  * scale
        const h = img.height * scale
        const x = (canvas.width  - w) / 2
        const y = (canvas.height - h) / 2
        ctx.drawImage(img, x, y, w, h)
        // Export as JPEG at 60% quality — small but readable
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url + '?t=' + Date.now() // cache bust for CORS
  })
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

export default function PdfExportButton() {
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState('')

  async function handleExport() {
    setLoading(true)
    try {
      // 1. Fetch all records
      setProgress('Fetching records...')
      const res  = await fetch('/api/admin/submissions?limit=10000&page=1')
      const json = await res.json()
      const data: Submission[] = json.data || []

      if (data.length === 0) {
        alert('No records to export.')
        return
      }

      // 2. Compress images in batches of 50 (prevents browser tab from freezing)
      const BATCH = 50
      const signatureImages: (string | null)[] = []

      for (let b = 0; b < data.length; b += BATCH) {
        const batch = data.slice(b, b + BATCH)
        setProgress(`Loading signatures ${b + 1}–${Math.min(b + BATCH, data.length)} of ${data.length}...`)
        const results = await Promise.all(batch.map(r => fetchCompressedImage(r.signature_url)))
        signatureImages.push(...results)
        // Small yield so browser stays responsive
        await new Promise(r => setTimeout(r, 10))
      }

      // 3. Build PDF
      setProgress('Building PDF...')
      const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const margin = 15

      const col = {
        num:  margin,        // 8mm wide
        name: margin + 8,    // 35mm wide
        roll: margin + 43,   // 28mm wide
        dept: margin + 71,   // 20mm wide
        year: margin + 91,   // 20mm wide
        sig:  margin + 111,  // rest = 210-15-111 = 84mm wide ← much bigger
      }
      const sigColW = pageW - margin - col.sig  // ~84mm
      const rowH    = 30  // taller rows so signature is bigger
      const headerH = 8

      // ── Page header ──────────────────────────────────────────────────────
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

      // ── Statement ────────────────────────────────────────────────────────
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

      // ── Table header ─────────────────────────────────────────────────────
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

      // ── Rows ─────────────────────────────────────────────────────────────
      for (let i = 0; i < data.length; i++) {
        const row    = data[i]
        const sigImg = signatureImages[i]

        if (y + rowH > pageH - 12) {
          doc.addPage()
          y = 15
          drawTableHeader()
        }

        // Alternating bg
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252)
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
        }

        // Row border
        doc.setDrawColor(220, 220, 220)
        doc.rect(margin, y, pageW - margin * 2, rowH, 'S')

        // Text cells
        doc.setTextColor(50, 50, 50)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        const textY = y + rowH / 2 + 1

        doc.text(String(i + 1),               col.num  + 1, textY)
        doc.text(truncate(row.full_name, 22),  col.name + 1, textY)
        doc.text(row.roll_number,              col.roll + 1, textY)
        doc.text(row.department,               col.dept + 1, textY)
        doc.text(row.year,                     col.year + 1, textY)

        // Signature — compressed JPEG, large & clear
        if (sigImg) {
          doc.addImage(sigImg, 'JPEG', col.sig + 1, y + 2, sigColW - 3, rowH - 4)
        } else {
          doc.setTextColor(180, 180, 180)
          doc.setFontSize(7)
          doc.text('(unavailable)', col.sig + 1, textY)
        }

        y += rowH
      }

      // ── Page numbers ─────────────────────────────────────────────────────
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

      setProgress('Saving PDF...')
      doc.save(`student_representation_${Date.now()}.pdf`)

    } catch (err) {
      console.error('PDF error:', err)
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
      className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all text-red-700 bg-red-50 hover:bg-red-100 border-red-200 disabled:opacity-50 min-w-[130px]"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-xs truncate max-w-[200px]">{progress || 'Generating...'}</span>
        </span>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          PDF Report
        </>
      )}
    </button>
  )
}
