export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--color-amber-light)] border-t-[var(--color-amber)] animate-spin" />
        <span className="text-sm text-[var(--color-gray)]">Loading…</span>
      </div>
    </div>
  )
}
