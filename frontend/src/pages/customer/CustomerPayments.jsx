import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Printer,
  X,
  ShieldCheck,
  RefreshCw,
  Zap,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  getCustomerSessions,
  getCustomerPayments,
  initiatePayment,
  simulatePayment,
  getPaymentReceipt,
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';

export default function CustomerPayments() {
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pay Modal State
  const [selectedSessionToPay, setSelectedSessionToPay] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sList, pList] = await Promise.all([
        getCustomerSessions(),
        getCustomerPayments(),
      ]);
      setSessions(sList || []);
      setPayments(pList || []);
    } catch (err) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const pendingSessions = sessions.filter(
    (s) => s.status === 'COMPLETED' && (!s.paymentStatus || s.paymentStatus === 'PENDING')
  );

  const handleOpenPayModal = (session) => {
    setSelectedSessionToPay(session);
    setPaymentMethod('UPI');
    setPayError('');
  };

  const handleSimulatePayment = async (shouldSucceed = true) => {
    if (!selectedSessionToPay) return;
    setPaying(true);
    setPayError('');

    try {
      // Step 1: Initiate payment record
      const initRes = await initiatePayment({
        sessionId: selectedSessionToPay.sessionId,
        amount: selectedSessionToPay.chargingCost || 100,
        paymentMethod,
        currency: 'INR',
      });

      // Step 2: Simulate settlement
      const simRes = await simulatePayment({
        paymentId: initRes.paymentId,
        simulateSuccess: shouldSucceed,
        simulatedDelayMs: 600,
      });

      if (!shouldSucceed) {
        setPayError('Simulated payment failed as requested. Transaction cancelled.');
        await fetchAll();
        return;
      }

      // Close pay modal & open receipt
      setSelectedSessionToPay(null);
      await fetchAll();
      handleViewReceipt(simRes.transactionRef);
    } catch (err) {
      setPayError(err.message || 'Payment simulation error.');
    } finally {
      setPaying(false);
    }
  };

  const handleViewReceipt = async (transactionRef) => {
    if (!transactionRef) return;
    setReceiptLoading(true);
    try {
      const receiptData = await getPaymentReceipt(transactionRef);
      setSelectedReceipt(receiptData);
    } catch (err) {
      alert(`Could not load receipt: ${err.message}`);
    } finally {
      setReceiptLoading(false);
    }
  };

  if (loading && sessions.length === 0) {
    return <LoadingSpinner message="Loading customer payments and invoices..." />;
  }

  if (error && sessions.length === 0) {
    return <ErrorAlert message={error} onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6">
        <div>
          <h2 className="text-lg font-bold text-white">Payments & Charging Invoices</h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Settle unpaid charging sessions, simulate live gateway checkout, and download official tax receipts.
          </p>
        </div>

        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-[#181818] border border-[#2A2A2A] px-3.5 py-2 text-xs font-semibold text-[#A3A3A3] hover:text-white transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Unpaid / Pending Invoices Section */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#FF7A00]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pending Invoices Awaiting Settlement ({pendingSessions.length})
            </h3>
          </div>
        </div>

        {pendingSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-emerald-400 flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>All completed charging sessions are fully paid and settled!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSessions.map((s) => (
              <div
                key={s.sessionId}
                className="bg-[#181818] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-[#FF7A00]">
                      Session #{s.sessionId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      UNPAID
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2">{s.stationName}</h4>
                  <p className="text-xs font-mono text-[#A3A3A3]">{s.stationQrCode} • {s.registrationNo}</p>

                  <div className="mt-3 p-2.5 rounded-lg bg-[#121212] border border-[#2A2A2A] flex justify-between items-center text-xs">
                    <span className="text-[#A3A3A3]">Energy Consumed:</span>
                    <span className="font-mono font-bold text-white">{Number(s.energyConsumed || 0).toFixed(2)} kWh</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#A3A3A3] block">Total Due</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      ₹{Number(s.chargingCost || 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenPayModal(s)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:opacity-95 transition"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Pay Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Payments History Table */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-[#A3A3A3]" />
            <h3 className="text-sm font-bold text-white">Settled Payments & Digital Receipts</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c0c0c] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#2A2A2A]">
              <tr>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Settled At</th>
                <th className="py-3 px-4">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A3A3A3]">
                    No completed payments recorded.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-[#181818] transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {p.transactionRef}
                    </td>

                    <td className="py-3 px-4 font-mono text-[#A3A3A3]">
                      #{p.sessionId}
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      {p.paymentMethod}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ₹{Number(p.amount || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'SUCCESSFUL'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#A3A3A3] font-mono">
                      {p.completedAt
                        ? new Date(p.completedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewReceipt(p.transactionRef)}
                        className="flex items-center gap-1 rounded bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] px-2.5 py-1 text-[11px] font-semibold text-white transition"
                      >
                        <Receipt className="h-3 w-3 text-[#FF7A00]" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated Payment Gateway Modal */}
      {selectedSessionToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setSelectedSessionToPay(null)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Simulated Banner */}
            <div className="mb-4 p-2.5 rounded-xl bg-[#FF7A00]/10 border border-[#FF7A00]/30 text-[11px] text-[#FF7A00] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Simulated Payment Gateway (PBL Live Demo Engine)</span>
            </div>

            <h3 className="text-base font-bold text-white">Settle Charging Session</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Session #{selectedSessionToPay.sessionId} • {selectedSessionToPay.stationName}
            </p>

            {payError && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200">
                {payError}
              </div>
            )}

            {/* Invoice Breakdown */}
            <div className="mt-4 p-4 rounded-xl bg-[#181818] border border-[#2A2A2A] space-y-2 text-xs">
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Energy Consumed:</span>
                <span className="font-mono text-white">{Number(selectedSessionToPay.energyConsumed || 0).toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Base Energy Tariff:</span>
                <span className="font-mono text-white">₹15.00 / kWh</span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>Subtotal:</span>
                <span className="font-mono text-white">
                  ₹{(Number(selectedSessionToPay.chargingCost || 0) * 0.8475).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#A3A3A3]">
                <span>GST (18% Clean Energy):</span>
                <span className="font-mono text-white">
                  ₹{(Number(selectedSessionToPay.chargingCost || 0) * 0.1525).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#2A2A2A] flex justify-between font-bold text-sm">
                <span className="text-white">Total Amount Due:</span>
                <span className="font-mono text-emerald-400">
                  ₹{Number(selectedSessionToPay.chargingCost || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-4 text-xs">
              <label className="block text-[#A3A3A3] mb-1.5 font-semibold uppercase tracking-wider">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR' },
                  { id: 'CREDIT_CARD', label: 'Credit / Debit Card' },
                  { id: 'NET_BANKING', label: 'Net Banking' },
                  { id: 'CAMPUS_WALLET', label: 'Campus Wallet' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold transition text-left ${
                      paymentMethod === m.id
                        ? 'bg-[#FF7A00]/15 border-[#FF7A00] text-white'
                        : 'bg-[#181818] border-[#2A2A2A] text-[#A3A3A3] hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Triggers */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={paying}
                onClick={() => handleSimulatePayment(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F04438] to-[#FF7A00] font-bold text-xs text-white shadow-lg shadow-orange-500/20 hover:opacity-95 transition disabled:opacity-50"
              >
                {paying ? 'Simulating Settlement...' : 'Simulate Successful Payment (Instant Receipt)'}
              </button>

              <button
                type="button"
                disabled={paying}
                onClick={() => handleSimulatePayment(false)}
                className="w-full py-2 rounded-xl bg-[#181818] border border-red-500/30 font-semibold text-xs text-red-400 hover:bg-red-500/10 transition"
              >
                Test Failed Payment Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Tax Invoice / Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Receipt Printable Layout */}
            <div className="bg-white text-slate-900 rounded-xl p-6 text-xs shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black tracking-tight text-slate-950 font-sans">
                    Volt<span className="text-[#FF7A00]">Loop</span> Technologies
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Smart Campus EV Fleet & Energy Management System
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    GSTIN: 29AAACV6501E1Z8
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    TAX INVOICE - PAID
                  </span>
                  <p className="text-[10px] font-mono text-slate-600 mt-1">
                    {selectedReceipt.transactionRef}
                  </p>
                </div>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-2 gap-4 my-4 py-2 border-b border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Billed To:</span>
                  <strong className="text-slate-900 block">{selectedReceipt.customerName}</strong>
                  <span className="text-slate-600">{selectedReceipt.customerEmail}</span>
                  <span className="font-mono text-slate-600 block mt-0.5">
                    Vehicle: {selectedReceipt.registrationNo}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block">Date & Time:</span>
                  <strong className="text-slate-900 block">
                    {selectedReceipt.completedAt ? new Date(selectedReceipt.completedAt).toLocaleString() : '—'}
                  </strong>
                  <span className="text-slate-600">Bay: {selectedReceipt.stationName}</span>
                  <span className="text-slate-600 block">Method: {selectedReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full text-left my-3 text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-1">Description</th>
                    <th className="py-1 text-center">Energy</th>
                    <th className="py-1 text-right">Rate</th>
                    <th className="py-1 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-1.5 font-sans">EV Clean Charging Service ({selectedReceipt.durationMinutes} min)</td>
                    <td className="py-1.5 text-center">{selectedReceipt.energyConsumed} kWh</td>
                    <td className="py-1.5 text-right">₹15.00</td>
                    <td className="py-1.5 text-right font-bold">₹{Number(selectedReceipt.amount || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 border-t border-slate-200 text-right space-y-1 font-mono text-[11px]">
                <div className="text-slate-600">
                  Subtotal: ₹{(Number(selectedReceipt.amount || 0) * 0.8475).toFixed(2)}
                </div>
                <div className="text-slate-600">
                  CGST (9%) + SGST (9%): ₹{(Number(selectedReceipt.amount || 0) * 0.1525).toFixed(2)}
                </div>
                <div className="text-base font-bold text-slate-950 pt-1 border-t border-slate-300">
                  Total Paid: ₹{Number(selectedReceipt.amount || 0).toFixed(2)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-center text-slate-500">
                Thank you for driving electric with VoltLoop Campus Grid.
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#202020] hover:bg-[#262626] border border-[#2A2A2A] text-xs font-bold text-white transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print Tax Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
