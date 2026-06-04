'use client'

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import SignaturePadLib from 'signature_pad'

export interface SignaturePadRef {
  isEmpty: () => boolean
  toDataURL: () => string
  clear: () => void
}

interface Props {
  onSave: (dataUrl: string) => void
  onClear: () => void
}

const SignaturePad = forwardRef<SignaturePadRef, Props>(({ onSave, onClear }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(ratio, ratio)
      padRef.current?.clear()
    }

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#1e3a8a',
      minWidth: 1.5,
      maxWidth: 3,
    })

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useImperativeHandle(ref, () => ({
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () => padRef.current?.toDataURL('image/png') ?? '',
    clear: handleClear,
  }))

  function handleClear() {
    padRef.current?.clear()
    setSaved(false)
    setPreview(null)
    onClear()
  }

  function handleSave() {
    if (!padRef.current || padRef.current.isEmpty()) {
      alert('Please draw your signature first.')
      return
    }
    const dataUrl = padRef.current.toDataURL('image/png')
    setPreview(dataUrl)
    setSaved(true)
    onSave(dataUrl)
  }

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-blue-300 rounded-xl bg-white overflow-hidden"
        style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '180px', cursor: 'crosshair', display: 'block' }}
        />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Draw your signature above using mouse, touch, or stylus
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Clear Signature
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Save Signature
        </button>
      </div>

      {saved && preview && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs font-medium text-green-700 mb-2">Signature Preview:</p>
          <div className="bg-white rounded border border-green-200 p-2">
            <img src={preview} alt="Signature preview" className="max-h-16 mx-auto" />
          </div>
          <p className="text-xs text-green-600 mt-1 text-center">Signature saved ✓</p>
        </div>
      )}
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'
export default SignaturePad
