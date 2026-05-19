import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function Homepage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--color-bg)] px-6 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-amber)]">
        Meytle
      </div>
      <h1 className="text-[36px] font-semibold text-[var(--color-dark)] max-w-md leading-tight">
        Find Meaningful Company For Every{' '}
        <span className="text-[var(--color-amber)]">Experience</span>
      </h1>
      <p className="text-[14px] text-[var(--color-gray)] max-w-sm">
        Browse verified companions by experience type and book in real-time.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link to="/showcase">
          <Button size="lg">View UI Showcase</Button>
        </Link>
        <Button size="lg" variant="outline">Explore Companions</Button>
      </div>
    </div>
  )
}
