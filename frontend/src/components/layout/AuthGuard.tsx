import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function AuthGuard() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function GuestGuard() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/home" replace />;
  return <Outlet />;
}
