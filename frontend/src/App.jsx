import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import LoginPage       from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage   from './pages/DashboardPage';
import VehiclesPage    from './pages/VehiclesPage';
import DriversPage     from './pages/DriversPage';
import TripsPage       from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage        from './pages/FuelPage';
import ReportsPage     from './pages/ReportsPage';
import SettingsPage    from './pages/SettingsPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/vehicles"    element={<VehiclesPage />} />
        <Route path="/drivers"     element={<DriversPage />} />
        <Route path="/trips"       element={<TripsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/fuel"        element={<FuelPage />} />
        <Route path="/reports"     element={<ReportsPage />} />
        <Route path="/settings"    element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
