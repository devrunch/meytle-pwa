import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function AuthGuard() {
  const token    = useAuthStore((s) => s.token);
  const user     = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.emailVerified === false) return <Navigate to="/verify-email" replace />;
  return <Outlet />;
}

export function GuestGuard() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  if (token && user?.emailVerified !== false) return <Navigate to="/home" replace />;
  return <Outlet />;
}
