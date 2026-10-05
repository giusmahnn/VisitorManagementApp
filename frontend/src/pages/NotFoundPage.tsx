import { Link } from "react-router-dom"
import { ArrowLeft, SearchX } from "lucide-react"

/**
 * 404 page — shown for unmatched routes both inside
 * and outside the dashboard layout.
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)]">
        <SearchX className="h-9 w-9 text-[var(--text-muted)]" />
      </div>

      <div className="space-y-2">
        <p className="text-7xl font-bold text-[var(--text-primary)] tracking-tight">
          404
        </p>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Page not found
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  )
}