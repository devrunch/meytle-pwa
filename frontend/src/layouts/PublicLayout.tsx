import { Link, useNavigate } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import { IconUsers } from '@tabler/icons-react'
import { Button } from '../components/ui'

export default function PublicLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b-[0.5px] border-[var(--color-border)] h-[52px] flex items-center px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[var(--color-amber)] flex items-center justify-center">
              <IconUsers size={15} stroke={1.5} color="white" />
            </div>
            <span className="text-[15px] font-semibold text-[var(--color-dark)]">Meytle</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-[13px] text-[var(--color-gray)]">
            <Link to="/app" className="hover:text-[var(--color-dark)] transition-colors">Explore</Link>
            <a href="/#how-it-works" className="hover:text-[var(--color-dark)] transition-colors">How it works</a>
            <a href="/#safety" className="hover:text-[var(--color-dark)] transition-colors">Safety</a>
            <Link to="/register?role=companion" className="hover:text-[var(--color-dark)] transition-colors">Become a Companion</Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log In</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Join Now</Button>
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  )
}
