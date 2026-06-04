'use client'

import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  signatureUrl: string
  studentName: string
  rollNumber: string
  onClose: () => void
}

export default function SignatureModal({ signatureUrl, studentName, rollNumber, onClose }: Props) {
  const [zoom, setZoom] = useState(1)

  function download() {
    const a = document.createElement('a')
    a.href = signatureUrl
    a.download = `${rollNumber}_signature.png`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-bold text-gray-900">{studentName}</h3>
            <p className="text-sm text-gray-500">{rollNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-gray-50 overflow-auto" style={{ maxHeight: '60vh' }}>
          <div className="flex items-center justify-center min-h-32">
            <img
              src={signatureUrl}
              alt={`Signature of ${studentName}`}
              style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}
              className="max-w-full border border-gray-200 bg-white rounded-lg p-2 shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <a
              href={signatureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              Full Screen
            </a>
            <button
              onClick={download}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
