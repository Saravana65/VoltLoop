import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import QRScanner from './components/QRScanner';

// Phase 9 Auth & Portal Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Owner Portal Pages
import OwnerOverview from './pages/owner/OwnerOverview';
import OwnerStations from './pages/owner/OwnerStations';
import OwnerActivity from './pages/owner/OwnerActivity';
import OwnerRevenue from './pages/owner/OwnerRevenue';

// Customer Portal Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerScanStation from './pages/customer/CustomerScanStation';
import CustomerVehicles from './pages/customer/CustomerVehicles';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerSessions from './pages/customer/CustomerSessions';
import CustomerPayments from './pages/customer/CustomerPayments';
import CustomerProfile from './pages/customer/CustomerProfile';

// Phases 1-8 Campus Fleet Management Pages
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Stations from './pages/Stations';
import Reservations from './pages/Reservations';
import ChargingSessions from './pages/ChargingSessions';
import SmartCharging from './pages/SmartCharging';
import Analytics from './pages/Analytics';
import StationCheckIn from './pages/StationCheckIn';

import { X } from 'lucide-react';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, portal } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a role is explicitly required and user has a different role
  if (requiredRole && user?.role && user.role !== requiredRole && user.role !== 'OWNER') {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
}

function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('voltloop_sidebar_collapsed') === 'true';
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isAuthenticated, portal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide sidebar and navbar on auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname) || location.pathname.startsWith('/login');

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('voltloop_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleQrVehicleFound = (vehicle) => {
    setIsQrModalOpen(false);
    navigate(`/evs/${vehicle.vehicleId}`);
  };

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/owner" element={<Login />} />
        <Route path="/login/customer" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] font-sans selection:bg-[#F04438] selection:text-white">
      {/* Collapsible Responsive Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area - padded left dynamically to match sidebar width without overlap */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Header / Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleDesktopCollapse={handleToggleCollapse}
          isCollapsed={isCollapsed}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Route View */}
        <main key={refreshKey} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            {/* Intelligent Root Redirection based on role/portal */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  portal === 'OWNER' ? (
                    <Navigate to="/owner/overview" replace />
                  ) : (
                    <Navigate to="/customer/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Owner Portal Routes */}
            <Route
              path="/owner/overview"
              element={
                <ProtectedRoute requiredRole="OWNER">
                  <OwnerOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/stations"
              element={
                <ProtectedRoute requiredRole="OWNER">
                  <OwnerStations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/activity"
              element={
                <ProtectedRoute requiredRole="OWNER">
                  <OwnerActivity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/revenue"
              element={
                <ProtectedRoute requiredRole="OWNER">
                  <OwnerRevenue />
                </ProtectedRoute>
              }
            />

            {/* Customer Portal Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/scan"
              element={
                <ProtectedRoute>
                  <CustomerScanStation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/vehicles"
              element={
                <ProtectedRoute>
                  <CustomerVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/bookings"
              element={
                <ProtectedRoute>
                  <CustomerBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/sessions"
              element={
                <ProtectedRoute>
                  <CustomerSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/payments"
              element={
                <ProtectedRoute>
                  <CustomerPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />

            {/* Campus Grid & Fleet Operations (Phases 1-8) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evs"
              element={
                <ProtectedRoute>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evs/:id"
              element={
                <ProtectedRoute>
                  <VehicleDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles/:id"
              element={
                <ProtectedRoute>
                  <VehicleDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stations"
              element={
                <ProtectedRoute>
                  <Stations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/charging-stations"
              element={
                <ProtectedRoute>
                  <Stations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <ChargingSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/charging-sessions"
              element={
                <ProtectedRoute>
                  <ChargingSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/smart-charging"
              element={
                <ProtectedRoute>
                  <SmartCharging />
                </ProtectedRoute>
              }
            />
            <Route
              path="/station-checkin"
              element={
                <ProtectedRoute>
                  <StationCheckIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/check-in"
              element={
                <ProtectedRoute>
                  <StationCheckIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <Navigate
                  to={isAuthenticated ? (portal === 'OWNER' ? '/owner/overview' : '/customer/dashboard') : '/login'}
                  replace
                />
              }
            />
          </Routes>
        </main>

        {/* Global QR Scan Modal */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-[#202020] p-1.5 text-[#A3A3A3] hover:bg-[#262626] hover:text-white shadow-lg border border-[#2A2A2A]"
                aria-label="Close QR scanner"
              >
                <X className="h-4 w-4" />
              </button>
              <QRScanner onVehicleFound={handleQrVehicleFound} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
