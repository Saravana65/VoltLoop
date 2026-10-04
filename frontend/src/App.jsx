import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import QRScanner from './components/QRScanner';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Stations from './pages/Stations';
import Reservations from './pages/Reservations';
import ChargingSessions from './pages/ChargingSessions';
import SmartCharging from './pages/SmartCharging';
import { X } from 'lucide-react';

function AppContent() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleQrVehicleFound = (vehicle) => {
    setIsQrModalOpen(false);
    navigate(`/vehicles/${vehicle.vehicleId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar onOpenQrModal={() => setIsQrModalOpen(true)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/sessions" element={<ChargingSessions />} />
          <Route path="/smart-charging" element={<SmartCharging />} />
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
            >
              <X className="h-4 w-4" />
            </button>
            <QRScanner onVehicleFound={handleQrVehicleFound} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VoltLoop — Smart Campus EV Fleet & Energy Management System</span>
          <span className="font-mono text-[11px] text-slate-400">React + Spring Boot + JDBC + Docker MySQL</span>
        </div>
      </footer>
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
