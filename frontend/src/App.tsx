import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthGuard, GuestGuard } from './components/layout/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/app/HomePage';
import { BrowsePage } from './pages/app/BrowsePage';
import { ProfilePage } from './pages/app/ProfilePage';
import { OnboardingWizard } from './pages/companion/OnboardingWizard';
import { CompanionDashboard } from './pages/companion/CompanionDashboard';
import { CompanionProfilePage } from './pages/companion/CompanionProfile';
import { useAuthStore } from './store/authStore';

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)();
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

export default function App() {
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
        </Route>

        {/* Protected app */}
        <Route element={<AuthGuard />}>
          {/* Full-page (no navbar) */}
          <Route path="/become-companion" element={<OnboardingWizard />} />

          <Route element={<AppLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/companion/dashboard" element={<CompanionDashboard />} />
            <Route path="/companion/profile" element={<CompanionProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
