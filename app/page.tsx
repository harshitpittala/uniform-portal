import Link from 'next/link'
import LiveStats from '@/components/LiveStats'
import { PenLine, Shield, Users, FileText } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-700/50 backdrop-blur border border-blue-500/30 rounded-full px-4 py-2 text-sm mb-6">
            <Shield className="w-4 h-4" />
            Official Student Representation Portal
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
            Student Representation Portal
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-blue-200 mb-4">
            Review of the New Uniform Policy
          </p>

          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            This portal has been created to collect student acknowledgments and digital signatures
            regarding the recently introduced compulsory uniform policy.
          </p>

          <Link
            href="/sign"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            <PenLine className="w-5 h-5" />
            Sign the Representation
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: FileText, step: '1', title: 'Read the Statement', desc: 'Review the student representation statement carefully before proceeding.' },
              { icon: Users, step: '2', title: 'Fill Your Details', desc: 'Enter your name, roll number, department, and year of study.' },
              { icon: PenLine, step: '3', title: 'Sign & Submit', desc: 'Draw your digital signature and submit your acknowledgment.' },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-3 font-black text-lg">
                  {step}
                </div>
                <Icon className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <LiveStats />

      {/* CTA */}
      <section className="py-16 bg-blue-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">Make Your Voice Heard</h2>
          <p className="text-blue-200 mb-8 text-lg">
            Join your fellow students in respectfully requesting a review of the uniform policy.
          </p>
          <Link
            href="/sign"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-bold text-lg px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all"
          >
            <PenLine className="w-5 h-5" />
            Sign the Representation
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>Student Representation Portal &mdash; For Review Purposes Only</p>
        <p className="mt-1 text-gray-600">
          <Link href="/admin/login" className="hover:text-gray-300 transition-colors">
            Admin
          </Link>
        </p>
      </footer>
    </main>
  )
}
