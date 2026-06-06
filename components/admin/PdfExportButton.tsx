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
      const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW  = 210
      const pageH  = 297
      const margin = 15
      const footer = 10  // space reserved at bottom for page number

      // ── Layout maths ─────────────────────────────────────────────────────
      // Data page usable height: pageH - topMargin - footer - tableHeaderH
      // We want exactly 10 rows per data page.
      const headerH   = 8
      const topMargin = 15
      const usable    = pageH - topMargin - footer - headerH  // ~264mm
      const rowH      = Math.floor(usable / 10)               // 26mm → 10 rows/page exactly

      const col = {
        num:  margin,
        name: margin + 8,
        roll: margin + 46,
        dept: margin + 76,
        year: margin + 98,
        sig:  margin + 118,  // signature gets 210-15-118 = 77mm
      }
      const sigColW = pageW - margin - col.sig  // ~77mm

      // ── PAGE 1: Cover / Intro ─────────────────────────────────────────────
      // Full-width blue header
      doc.setFillColor(30, 64, 175)
      doc.rect(0, 0, pageW, 50, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Student Representation', pageW / 2, 22, { align: 'center' })
      doc.setFontSize(14)
      doc.text('Regarding the Compulsory Uniform Policy', pageW / 2, 34, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Signatures: ${data.length}`, pageW / 2, 44, { align: 'center' })

      // Statement box
      doc.setFillColor(239, 246, 255)
      doc.setDrawColor(147, 197, 253)
      doc.roundedRect(margin, 60, pageW - margin * 2, 70, 3, 3, 'FD')
      doc.setTextColor(30, 64, 175)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Representation Statement', margin + 5, 71)
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      const statement =
        'We, the undersigned students, respectfully express our concerns regarding the recently introduced ' +
        'compulsory uniform policy. We believe that the implementation of this policy may not reflect the ' +
        'preferences, comfort, practical considerations, and financial situations of all students.\n\n' +
        'By signing below, we acknowledge our support for submitting a formal representation to the college ' +
        'administration requesting a review, discussion, and reconsideration of the compulsory uniform ' +
        'requirement. Our intention is to communicate student feedback respectfully and constructively.'
      const stLines = doc.splitTextToSize(statement, pageW - margin * 2 - 10)
      doc.text(stLines, margin + 5, 79)

      // Summary stats on cover
      const stats = [
        { label: 'Total Students', value: String(data.length) },
        { label: 'Date Generated', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
      ]
      let sx = margin
      stats.forEach(({ label, value }) => {
        doc.setFillColor(30, 64, 175)
        doc.roundedRect(sx, 142, 80, 22, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(value, sx + 40, 151, { align: 'center' })
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(label, sx + 40, 158, { align: 'center' })
        sx += 85
      })

      // ── PAGE 2+: Data pages (10 rows each) ───────────────────────────────
      doc.addPage()
      let y = topMargin

      function drawTableHeader() {
        doc.setFillColor(30, 64, 175)
        doc.rect(margin, y, pageW - margin * 2, headerH, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('#',           col.num  + 1, y + 5.5)
        doc.text('Full Name',   col.name + 1, y + 5.5)
        doc.text('Roll No.',    col.roll + 1, y + 5.5)
        doc.text('Dept',        col.dept + 1, y + 5.5)
        doc.text('Year',        col.year + 1, y + 5.5)
        doc.text('Signature',   col.sig  + 1, y + 5.5)
        y += headerH
      }

      drawTableHeader()

      for (let i = 0; i < data.length; i++) {
        const row    = data[i]
        const sigImg = signatureImages[i]

        // New page when 10 rows filled
        if (y + rowH > pageH - footer) {
          doc.addPage()
          y = topMargin
          drawTableHeader()
        }

        // Alternating background
        if (i % 2 === 0) {
          doc.setFillColor(245, 248, 255)
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
        }

        // Row border
        doc.setDrawColor(210, 220, 240)
        doc.rect(margin, y, pageW - margin * 2, rowH, 'S')

        // Text
        doc.setTextColor(40, 40, 40)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        const textY = y + rowH / 2 + 1

        doc.text(String(i + 1),               col.num  + 1, textY)
        doc.text(truncate(row.full_name, 20),  col.name + 1, textY)
        doc.text(row.roll_number,              col.roll + 1, textY)
        doc.text(row.department,               col.dept + 1, textY)
        doc.text(row.year,                     col.year + 1, textY)

        // Signature image — large and clear
        if (sigImg) {
          doc.addImage(sigImg, 'JPEG', col.sig + 2, y + 2, sigColW - 4, rowH - 4)
        } else {
          doc.setTextColor(180, 180, 180)
          doc.setFontSize(7)
          doc.text('(unavailable)', col.sig + 2, textY)
        }

        y += rowH
      }

      // ── Page numbers on all pages except cover ────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setFontSize(7.5)
        doc.setTextColor(160, 160, 160)
        doc.text(
          `Page ${p - 1} of ${totalPages - 1}  ·  Student Representation Portal`,
          pageW / 2, pageH - 3, { align: 'center' }
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
