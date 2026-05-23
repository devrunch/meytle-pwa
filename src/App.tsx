import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'

import Landing from './pages/Landing'
import UIShowcase from './pages/UIShowcase'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

import HomePage from './pages/app/HomePage'
import MapPage from './pages/app/MapPage'
import MessagesPage from './pages/app/MessagesPage'
import BookingsPage from './pages/app/BookingsPage'
import ProfilePage from './pages/app/ProfilePage'

import CompanionProfile from './pages/companion/CompanionProfile'
import CompanionDashboard from './pages/companion/CompanionDashboard'
import BookingDetail from './pages/companion/BookingDetail'
import OnboardingWizard from './pages/companion/OnboardingWizard'
import CompanionAccount from './pages/companion/CompanionAccount'

import BookingFlow from './pages/booking/BookingFlow'
import BookingDetailPage from './pages/app/BookingDetailPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/companions/:id" element={<CompanionProfile />} />
          </Route>

          {/* Auth routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* App routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:conversationId" element={<MessagesPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/:bookingId" element={<BookingDetailPage />} />
            <Route path="bookings/new/:companionId" element={<BookingFlow />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="companion/dashboard" element={<CompanionDashboard />} />
            <Route path="companion/bookings/:bookingId" element={<BookingDetail />} />
            <Route path="companion/onboarding" element={<OnboardingWizard />} />
            <Route path="companion/account" element={<CompanionAccount />} />
          </Route>

          {/* Dev */}
          <Route path="/showcase" element={<UIShowcase />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
