import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import QRScanner from './components/QRScanner';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Stations from './pages/Stations';
import Reservations from './pages/Reservations';
import ChargingSessions from './pages/ChargingSessions';
import SmartCharging from './pages/SmartCharging';
import Analytics from './pages/Analytics';
import { X } from 'lucide-react';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleQrVehicleFound = (vehicle) => {
    setIsQrModalOpen(false);
    navigate(`/evs/${vehicle.vehicleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Responsive Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by sidebar width on large screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Header / Navbar */}
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenQRScanner={() => setIsQrModalOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Dynamic Route Pages */}
        <main key={refreshKey} className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* EV Fleet Directory (supporting both /evs and /vehicles) */}
            <Route path="/evs" element={<Vehicles />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/evs/:id" element={<VehicleDetails />} />
            <Route path="/vehicles/:id" element={<VehicleDetails />} />

            {/* Charging Stations (supporting both /stations and /charging-stations) */}
            <Route path="/stations" element={<Stations />} />
            <Route path="/charging-stations" element={<Stations />} />

            {/* Slot Reservations */}
            <Route path="/reservations" element={<Reservations />} />

            {/* Charging Sessions */}
            <Route path="/sessions" element={<ChargingSessions />} />
            <Route path="/charging-sessions" element={<ChargingSessions />} />

            {/* Smart Charging Allocation */}
            <Route path="/smart-charging" element={<SmartCharging />} />

            {/* Fleet Energy Analytics */}
            <Route path="/analytics" element={<Analytics />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Global Quick Scan Modal */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="absolute -top-3 -right-3 z-10 rounded-full bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white shadow-lg"
                aria-label="Close QR scanner"
              >
                <X className="h-4 w-4" />
              </button>
              <QRScanner
                onVehicleFound={handleQrVehicleFound}
              />
            </div>
          </div>
        )}

        {/* Persistent Enterprise Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>VoltLoop — Smart Campus EV Fleet & Energy Management System</span>
            <span className="font-mono text-[11px] text-slate-400">
              React 18 • Spring Boot 3.2 • JDBC Connection Pool • MySQL 8.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
