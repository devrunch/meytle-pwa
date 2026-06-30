import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { AuthGuard, GuestGuard } from './components/layout/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { HomePage } from './pages/app/HomePage';
import { BrowsePage } from './pages/app/BrowsePage';
import { ProfilePage } from './pages/app/ProfilePage';
import { OnboardingWizard } from './pages/companion/OnboardingWizard';
import { CompanionDashboard } from './pages/companion/CompanionDashboard';
import { CompanionProfilePage } from './pages/companion/CompanionProfile';
import { CompanionDetailPage } from './pages/app/CompanionDetailPage';
import { BookingsPage } from './pages/app/BookingsPage';
import { BookingFlow } from './pages/app/BookingFlow';
import { MessagesPage } from './pages/app/MessagesPage';
import { ChatPage } from './pages/app/ChatPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminUserDetail } from './pages/admin/AdminUserDetail';
import { AdminCompanions } from './pages/admin/AdminCompanions';
import { AdminCompanionDetail } from './pages/admin/AdminCompanionDetail';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminBookingDetail } from './pages/admin/AdminBookingDetail';
import { TermsPage } from './pages/TermsPage';
import { useAuthStore } from './store/authStore';
import { usePushNotifications } from './hooks/usePushNotifications';

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)();
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

export default function App() {
  const refreshUser = useAuthStore((s) => s.refreshUser);
  usePushNotifications();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />
      <Routes>
        {/* Root: redirect to /home if logged in, else show landing */}
        <Route path="/" element={<RootRedirect />} />

        {/* Guest-only */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Email verification — needs token but not yet verified */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected app */}
        <Route element={<AuthGuard />}>
          {/* Full-page (no navbar) */}
          <Route path="/become-companion" element={<OnboardingWizard />} />
          <Route path="/companions/:id/book" element={<BookingFlow />} />
          <Route path="/bookings/:id/chat" element={<ChatPage />} />

          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/companions/:id" element={<CompanionDetailPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/companion/dashboard" element={<CompanionDashboard />} />
            <Route path="/companion/profile" element={<CompanionProfilePage />} />
          </Route>
        </Route>

        {/* Admin panel — protected by admin role (enforced inside AdminLayout) */}
        <Route element={<AuthGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="companions" element={<AdminCompanions />} />
            <Route path="companions/:id" element={<AdminCompanionDetail />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="bookings/:id" element={<AdminBookingDetail />} />
          </Route>
        </Route>

        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
