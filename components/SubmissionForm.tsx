'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SignaturePad, { SignaturePadRef } from './SignaturePad'
import { DEPARTMENTS, YEARS } from '@/types'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function SubmissionForm() {
  const router = useRouter()
  const sigRef = useRef<SignaturePadRef>(null)

  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    department: '',
    year: '',
  })
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.full_name.trim() || !form.roll_number.trim() || !form.department || !form.year) {
      setError('Please fill in all fields.')
      return
    }

    if (!signature || sigRef.current?.isEmpty()) {
      setError('Please draw and save your signature before submitting.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, signature_base64: signature }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.')
        return
      }

      router.push('/thank-you')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-2xl mx-auto px-4">
        {/* Representation Statement */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            Student Representation Regarding the Uniform Policy
          </h2>
          <p className="text-sm text-blue-800 leading-relaxed mb-3">
            We, the undersigned students, respectfully express our concerns regarding the recently
            introduced compulsory uniform policy.
          </p>
          <p className="text-sm text-blue-800 leading-relaxed mb-3">
            We believe that the implementation of this policy may not reflect the preferences,
            comfort, practical considerations, and financial situations of all students.
          </p>
          <p className="text-sm text-blue-800 leading-relaxed mb-3">
            By signing below, we acknowledge our support for submitting a formal representation to
            the college administration requesting a review, discussion, and reconsideration of the
            compulsory uniform requirement.
          </p>
          <p className="text-sm text-blue-800 leading-relaxed">
            Our intention is to communicate student feedback respectfully and constructively while
            maintaining the values, discipline, and reputation of the institution.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-xl font-bold text-gray-800">Your Details</h2>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Roll Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="roll_number"
              value={form.roll_number}
              onChange={handleChange}
              placeholder="e.g. 22A91A0501"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Department & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                required
              >
                <option value="">Select Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digital Signature <span className="text-red-500">*</span>
            </label>
            <SignaturePad
              ref={sigRef}
              onSave={setSignature}
              onClear={() => setSignature(null)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit My Acknowledgment'
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By submitting, you confirm that the information provided is accurate and belongs to you.
          </p>
        </form>
      </div>
    </section>
  )
}
