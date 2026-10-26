import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  QrCode,
  Battery,
  Zap,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getCustomerVehicles, addCustomerVehicle } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import BatteryIndicator from '../../components/BatteryIndicator';

export default function CustomerVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicleForQr, setSelectedVehicleForQr] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Add vehicle form state
  const [form, setForm] = useState({
    vehicleModel: '',
    registrationNumber: '',
    batteryCapacity: 40.5,
    currentBattery: 65,
    connectorType: 'CCS2',
    vehicleType: 'FOUR_WHEELER',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCustomerVehicles();
      setVehicles(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load customer vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenQrModal = async (vehicle) => {
    setSelectedVehicleForQr(vehicle);
    try {
      const code = vehicle.qrIdentifier || `VL-EV-${vehicle.vehicleId}`;
      const url = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#080808',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation error', err);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);

    try {
      await addCustomerVehicle({
        vehicleModel: form.vehicleModel,
        registrationNumber: form.registrationNumber.toUpperCase(),
        batteryCapacity: Number(form.batteryCapacity),
        currentBattery: Number(form.currentBattery),
        connectorType: form.connectorType,
        vehicleType: form.vehicleType,
      });

      setIsAddModalOpen(false);
      setForm({
        vehicleModel: '',
        registrationNumber: '',
        batteryCapacity: 40.5,
        currentBattery: 65,
        connectorType: 'CCS2',
        vehicleType: 'FOUR_WHEELER',
      });
      await fetchVehicles();
    } catch (err) {
      setAddError(err.message || 'Failed to add vehicle.');
    } finally {
      setAdding(false);
    }
  };

  if (loading && vehicles.length === 0) {
    return <LoadingSpinner message="Loading your electric vehicles..." />;
  }

  if (error && vehicles.length === 0) {
    return <ErrorAlert message={error} onRetry={fetchVehicles} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-bold text-white">My Electric Vehicles</h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Registered EV fleet for campus gate check-in, priority charging, and automated telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Electric Vehicle</span>
          </button>

          <button
            onClick={fetchVehicles}
            className="p-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-[#A3A3A3] hover:text-white transition"
            title="Refresh vehicles"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Vehicles Grid */}
      {vehicles.length === 0 ? (
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-12 text-center max-w-md mx-auto">
          <Car className="h-10 w-10 text-[#A3A3A3] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Vehicles Registered</h3>
          <p className="text-xs text-[#A3A3A3] mt-1 mb-5">
            Link your electric car, scooter, or bike to start using campus charging bays.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF7A00]/90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vehicle Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.vehicleId}
              className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#383838] transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{v.vehicleModel || 'EV'}</h3>
                    <p className="text-xs font-mono font-semibold text-[#FF7A00] mt-0.5">
                      {v.registrationNumber}
                    </p>
                  </div>
                  <span className="rounded bg-[#1a1a1a] border border-[#2A2A2A] px-2 py-0.5 text-[10px] font-mono text-[#A3A3A3]">
                    {v.vehicleType}
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A3A3A3]">Battery State of Charge</span>
                    <span className="font-mono font-bold text-white">{v.currentBattery || 65}%</span>
                  </div>
                  <BatteryIndicator batteryLevel={v.currentBattery || 65} />

                  <div className="pt-2 flex justify-between text-[11px] text-[#A3A3A3] border-t border-[#2A2A2A]/60">
                    <span>Pack: <strong className="text-white">{v.batteryCapacity} kWh</strong></span>
                    <span>Plug: <strong className="text-white">{v.connectorType || 'CCS2'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
                <span className="text-[10px] text-[#A3A3A3] font-mono">
                  Pass ID: {v.qrIdentifier || `VL-EV-${v.vehicleId}`}
                </span>
                <button
                  onClick={() => handleOpenQrModal(v)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-white transition"
                >
                  <QrCode className="h-3.5 w-3.5 text-[#FF7A00]" />
                  <span>Digital Pass</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Add Electric Vehicle</h3>
            <p className="text-xs text-[#A3A3A3] mb-4">
              Enter vehicle registration and charging specifications.
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#A3A3A3] mb-1 font-semibold">Model / Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Nexon EV"
                  value={form.vehicleModel}
                  onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                  className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white focus:border-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-[#A3A3A3] mb-1 font-semibold">License Plate / Reg No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-EV-9988"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white uppercase font-mono focus:border-[#FF7A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A3A3A3] mb-1 font-semibold">Battery Size (kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.batteryCapacity}
                    onChange={(e) => setForm({ ...form, batteryCapacity: e.target.value })}
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white focus:border-[#FF7A00]"
                  />
                </div>

                <div>
                  <label className="block text-[#A3A3A3] mb-1 font-semibold">Current SoC (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={form.currentBattery}
                    onChange={(e) => setForm({ ...form, currentBattery: e.target.value })}
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white focus:border-[#FF7A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A3A3A3] mb-1 font-semibold">Connector Type</label>
                  <select
                    value={form.connectorType}
                    onChange={(e) => setForm({ ...form, connectorType: e.target.value })}
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white focus:border-[#FF7A00]"
                  >
                    <option value="CCS2">CCS2 (DC Fast)</option>
                    <option value="Type 2">Type 2 (AC)</option>
                    <option value="GB/T">GB/T</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#A3A3A3] mb-1 font-semibold">Vehicle Class</label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                    className="w-full rounded-lg bg-[#181818] border border-[#2A2A2A] px-3 py-2 text-white focus:border-[#FF7A00]"
                  >
                    <option value="FOUR_WHEELER">4-Wheeler (Car)</option>
                    <option value="TWO_WHEELER">2-Wheeler (Bike/Scooter)</option>
                    <option value="BUS">Campus Bus</option>
                    <option value="TRUCK">Utility Van</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#F04438] to-[#FF7A00] font-bold text-white hover:opacity-95 transition disabled:opacity-50"
                >
                  {adding ? 'Saving...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital EV Pass Modal */}
      {selectedVehicleForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setSelectedVehicleForQr(null)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white">{selectedVehicleForQr.vehicleModel}</h3>
            <p className="text-xs font-mono text-[#FF7A00] mt-0.5">
              {selectedVehicleForQr.registrationNumber}
            </p>

            <div className="my-4 inline-block p-3 bg-white rounded-xl shadow-md">
              {qrDataUrl && <img src={qrDataUrl} alt="EV Pass QR" className="h-48 w-48 mx-auto" />}
            </div>

            <div className="bg-[#181818] p-2.5 rounded-lg border border-[#2A2A2A] text-xs font-mono text-[#A3A3A3] mb-4">
              Pass: <span className="text-white font-bold">{selectedVehicleForQr.qrIdentifier}</span>
            </div>

            <p className="text-[11px] text-[#A3A3A3] mb-4">
              Display this pass at campus entry gates or station scanners for automated vehicle validation.
            </p>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${selectedVehicleForQr.registrationNumber}-pass.png`}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] py-2 text-xs font-bold text-white transition"
              >
                <Download className="h-4 w-4" />
                <span>Save Pass to Gallery</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
