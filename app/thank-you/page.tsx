import Link from 'next/link'
import { CheckCircle, Home } from 'lucide-react'

export const metadata = {
  title: 'Thank You | Student Representation Portal',
}

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-3">
          Thank You for Supporting This Student Representation.
        </h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          Your acknowledgment has been successfully recorded. Together, we are respectfully
          communicating student feedback to the college administration.
        </p>

        <div className="bg-blue-50 rounded-2xl p-4 mb-8 text-sm text-blue-800">
          Your digital signature and details have been securely stored as part of the formal
          student representation.
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </Link>
      </div>
    </main>
  )
}
