import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import DashboardHost from './pages/DashboardHost';
import DashboardPilot from './pages/DashboardPilot';
import Vehicles from './pages/Vehicles';
import Users from './pages/Users';
import CheckIn from './pages/CheckIn';
import History from './pages/History';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import VehiclePhotos from './pages/VehiclePhotos';
import Profile from './pages/Profile';

// ADMIN y HOST ven el mismo dashboard operativo
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'PILOT') return <DashboardPilot />;
  return <DashboardHost />;
}

function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Dashboard — ADMIN y HOST ven el mismo */}
      <Route path="/" element={<ProtectedRoute><Layout><DashboardRouter /></Layout></ProtectedRoute>} />

      {/* Vehículos — ADMIN y HOST */}
      <Route path="/vehicles" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><Vehicles /></Layout></ProtectedRoute>} />

      {/* Usuarios — ADMIN y HOST */}
      <Route path="/users" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><Users /></Layout></ProtectedRoute>} />

      {/* Fotos — ADMIN y HOST */}
      <Route path="/vehicle-photos" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><VehiclePhotos /></Layout></ProtectedRoute>} />

      {/* Historial — todos */}
      <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />

      {/* Reportes — ADMIN y HOST */}
      <Route path="/reports" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><Reports /></Layout></ProtectedRoute>} />

      {/* Logs — ADMIN y HOST */}
      <Route path="/logs" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><Logs /></Layout></ProtectedRoute>} />

      {/* Check-in — solo PILOT */}
      <Route path="/checkin" element={<ProtectedRoute roles={['PILOT']}><Layout><CheckIn /></Layout></ProtectedRoute>} />

      {/* Mi perfil — todos los roles */}
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
