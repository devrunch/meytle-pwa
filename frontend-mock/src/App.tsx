import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/ui'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { RequireAuth } from '@/components/RequireAuth'
import { PageSkeleton } from '@/components/PageSkeleton'

const PublicLayout = lazy(() => import('@/layouts/PublicLayout'))
const AppLayout = lazy(() => import('@/layouts/AppLayout'))

const Landing = lazy(() => import('@/pages/Landing'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))

const HomePage = lazy(() => import('@/pages/app/HomePage'))
const MapPage = lazy(() => import('@/pages/app/MapPage'))
const MessagesPage = lazy(() => import('@/pages/app/MessagesPage'))
const BookingsPage = lazy(() => import('@/pages/app/BookingsPage'))
const BookingDetailPage = lazy(() => import('@/pages/app/BookingDetailPage'))
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'))

const CompanionProfile = lazy(() => import('@/pages/companion/CompanionProfile'))
const CompanionDashboard = lazy(() => import('@/pages/companion/CompanionDashboard'))
const BookingDetail = lazy(() => import('@/pages/companion/BookingDetail'))
const OnboardingWizard = lazy(() => import('@/pages/companion/OnboardingWizard'))
const CompanionAccount = lazy(() => import('@/pages/companion/CompanionAccount'))

const BookingFlow = lazy(() => import('@/pages/booking/BookingFlow'))

const UIShowcase = import.meta.env.DEV
  ? lazy(() => import('@/pages/UIShowcase'))
  : null

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/companions/:id" element={<CompanionProfile />} />
              </Route>

              {/* Auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected app routes */}
              <Route
                path="/app"
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="messages/:conversationId" element={<MessagesPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/new/:companionId" element={<BookingFlow />} />
                <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="companion/dashboard" element={<CompanionDashboard />} />
                <Route path="companion/bookings/:bookingId" element={<BookingDetail />} />
                <Route path="companion/onboarding" element={<OnboardingWizard />} />
                <Route path="companion/account" element={<CompanionAccount />} />
              </Route>

              {/* Dev only */}
              {import.meta.env.DEV && UIShowcase && (
                <Route path="/showcase" element={<UIShowcase />} />
              )}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
