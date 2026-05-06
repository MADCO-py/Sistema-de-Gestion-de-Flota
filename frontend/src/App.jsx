import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import DashboardHost from './pages/DashboardHost';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardPilot from './pages/DashboardPilot';
import Vehicles from './pages/Vehicles';
import Users from './pages/Users';
import CheckIn from './pages/CheckIn';
import History from './pages/History';
import Reports from './pages/Reports';
import Logs from './pages/Logs';
import VehiclePhotos from './pages/VehiclePhotos';

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'HOST') return <DashboardHost />;
  if (user?.role === 'ADMIN') return <DashboardAdmin />;
  return <DashboardPilot />;
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
      <Route path="/" element={<ProtectedRoute><Layout><DashboardRouter /></Layout></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute roles={['HOST']}><Layout><Vehicles /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/checkin" element={<ProtectedRoute roles={['PILOT']}><Layout><CheckIn /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['HOST','ADMIN']}><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute roles={['HOST']}><Layout><Logs /></Layout></ProtectedRoute>} />
      <Route path="/vehicle-photos" element={<ProtectedRoute roles={['HOST']}><Layout><VehiclePhotos /></Layout></ProtectedRoute>} />
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
