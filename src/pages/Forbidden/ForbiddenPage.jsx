// File: src/pages/Forbidden/ForbiddenPage.jsx
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
      <ShieldAlert size={40} className="text-danger" />
      <h1 className="font-display text-xl font-semibold text-ink">Access denied</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        Your account doesn't have permission to view this page. Ask an administrator to grant it if you need access.
      </p>
      <Link to="/admin/dashboard" className="mt-2 rounded-lg bg-graphite-900 px-4 py-2 text-sm font-medium text-white">
        Back to dashboard
      </Link>
    </div>
  )
}
