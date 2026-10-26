import React, { useState, useEffect } from 'react';
import {
  Zap,
  QrCode,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Download,
  X,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import QRCode from 'qrcode';
import { getOwnerStations, updateOwnerStationStatus } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function OwnerStations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOwnerStations();
      setStations(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load station bays.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleToggleStatus = async (stationId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      setUpdatingId(stationId);
      await updateOwnerStationStatus(stationId, nextStatus);
      await fetchStations();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenQrModal = async (station) => {
    setSelectedStation(station);
    try {
      const qrCodePayload = station.qrCode || `VL-ST-00${station.stationId}`;
      const url = await QRCode.toDataURL(qrCodePayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#080808',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate station QR', err);
    }
  };

  const filteredStations = stations.filter(
    (s) =>
      s.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.qrCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.connectorType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && stations.length === 0) {
    return <LoadingSpinner message="Loading campus charging stations..." />;
  }

  if (error && stations.length === 0) {
    return <ErrorAlert message={error} onRetry={fetchStations} />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#2A2A2A] rounded-xl p-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Station Bays & Hardware Control
          </h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Configure bay statuses, inspect charging specs, and export Station QR codes for physical bay mounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search bays, QR, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg bg-[#181818] border border-[#2A2A2A] pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#666] focus:border-[#FF7A00]"
            />
          </div>

          <button
            onClick={fetchStations}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#202020] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-[#A3A3A3] hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => {
          const isAvailable = station.status === 'AVAILABLE';
          const isCharging = station.status === 'CHARGING';
          const isMaintenance = station.status === 'MAINTENANCE';

          return (
            <div
              key={station.stationId}
              className="bg-[#121212] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#383838] transition flex flex-col justify-between"
            >
              <div>
                {/* Station Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block font-mono text-xs font-bold text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/20 px-2 py-0.5 rounded">
                      {station.qrCode || `VL-ST-00${station.stationId}`}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{station.stationName}</h3>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">{station.location}</p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isCharging
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isAvailable && <CheckCircle className="h-3 w-3" />}
                    {isCharging && <Zap className="h-3 w-3 animate-pulse" />}
                    {isMaintenance && <Wrench className="h-3 w-3" />}
                    {station.status}
                  </span>
                </div>

                {/* Specs */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#181818] p-2 rounded-lg border border-[#2A2A2A]">
                    <span className="text-[10px] text-[#A3A3A3] block">Power Output</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {station.powerRating} kW
                    </span>
                  </div>

                  <div className="bg-[#181818] p-2 rounded-lg border border-[#2A2A2A]">
                    <span className="text-[10px] text-[#A3A3A3] block">Connector</span>
                    <span className="font-semibold text-white text-sm truncate block">
                      {station.connectorType}
                    </span>
                  </div>
                </div>

                {/* Rates & Owner info */}
                <div className="mt-3 pt-3 border-t border-[#2A2A2A] text-xs space-y-1">
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Base Energy Rate:</span>
                    <span className="font-mono text-white font-medium">₹15.00 / kWh</span>
                  </div>
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Operating Owner:</span>
                    <span className="text-white font-medium">Campus Energy Hub</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenQrModal(station)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-3 py-1.5 text-xs font-semibold text-white transition"
                >
                  <QrCode className="h-3.5 w-3.5 text-[#FF7A00]" />
                  <span>Station QR</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(station.stationId, station.status)}
                  disabled={updatingId === station.stationId || isCharging}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                    isMaintenance
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
                  }`}
                  title={isCharging ? 'Cannot modify status while a vehicle is actively charging' : undefined}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>{isMaintenance ? 'Set Available' : 'Set Maintenance'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal for Station Bay */}
      {selectedStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setSelectedStation(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-[#A3A3A3] hover:bg-[#202020] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 mb-3">
              <QrCode className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold text-white">{selectedStation.stationName}</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">{selectedStation.location}</p>

            <div className="my-4 inline-block p-3 bg-white rounded-xl shadow-md">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Station Bay QR" className="h-52 w-52 mx-auto" />
              ) : (
                <div className="h-52 w-52 flex items-center justify-center text-slate-800">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="bg-[#181818] p-2.5 rounded-lg border border-[#2A2A2A] text-xs font-mono text-[#A3A3A3] mb-4">
              Station Code: <span className="text-[#FF7A00] font-bold">{selectedStation.qrCode}</span>
            </div>

            <p className="text-[11px] text-[#A3A3A3] mb-4">
              Customers scan this code via the VoltLoop Customer Portal to initiate charging at this bay.
            </p>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${selectedStation.qrCode || 'station'}-qr.png`}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#F04438] to-[#FF7A00] py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition"
              >
                <Download className="h-4 w-4" />
                <span>Download QR for Bay Printing</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
