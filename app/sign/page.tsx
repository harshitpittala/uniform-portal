import SubmissionForm from '@/components/SubmissionForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Sign the Representation | Student Portal',
}

export default function SignPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-blue-900 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-black">Sign the Representation</h1>
          <p className="text-blue-200 text-sm mt-1">
            Read the statement and submit your acknowledgment with digital signature
          </p>
        </div>
      </div>

      <SubmissionForm />
    </main>
  )
}
