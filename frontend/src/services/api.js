/**
 * VoltLoop Centralized API Service Layer
 * Connects React frontend directly to the Spring Boot REST API.
 * Supports Phase 9 Dual-Portal (Owner & Customer), JWT/Bearer auth tokens,
 * Payments, QR Station resolution, and all legacy Phases 1-8 operations.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

/**
 * Standardized Fetch Client with structured HTTP status parsing and auth injection
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('voltloop_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // Handle No-Content (204)
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const err = new Error(
        (data && data.message) ||
        (data && data.error) ||
        `Request failed with status ${response.status}`
      );
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (
      error.name === 'TypeError' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError')
    ) {
      const networkErr = new Error(
        'Unable to connect to VoltLoop server. Please verify the Java backend is active on port 8080.'
      );
      networkErr.status = 503;
      throw networkErr;
    }
    throw error;
  }
}

// ==========================================
// Phase 9: Authentication & Profile APIs
// ==========================================

export const loginApi = (credentials) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const registerCustomerApi = (data) =>
  request('/auth/register-customer', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMeApi = () => request('/auth/me');

// ==========================================
// Phase 9: Owner Portal APIs
// ==========================================

export const getOwnerOverview = () => request('/owner/overview');
export const getOwnerStations = () => request('/owner/stations');
export const updateOwnerStationStatus = (stationId, status) =>
  request(`/owner/stations/${stationId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
export const getOwnerActiveSessions = () => request('/owner/sessions/active');
export const getOwnerRecentActivity = () => request('/owner/activity');
export const getOwnerRevenue = () => request('/owner/revenue');

// ==========================================
// Phase 9: Customer Portal APIs
// ==========================================

export const getCustomerDashboard = () => request('/customer/dashboard');
export const resolveStationByQr = (identifier) =>
  request(`/customer/stations/qr/${encodeURIComponent(identifier)}`);
export const getCustomerVehicles = () => request('/customer/vehicles');
export const addCustomerVehicle = (data) =>
  request('/customer/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const getCustomerBookings = () => request('/customer/bookings');
export const createCustomerBooking = (data) =>
  request('/customer/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const cancelCustomerBooking = (bookingId) =>
  request(`/customer/bookings/${bookingId}/cancel`, {
    method: 'PUT',
  });
export const getCustomerSessions = () => request('/customer/sessions');
export const startCustomerCharging = (data) =>
  request('/customer/charging/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const completeCustomerCharging = (data) =>
  request('/customer/charging/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const getCustomerProfile = () => request('/customer/profile');
export const updateCustomerProfile = (data) =>
  request('/customer/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ==========================================
// Phase 9: Payment APIs (Simulated PBL Engine)
// ==========================================

export const initiatePayment = (data) =>
  request('/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const simulatePayment = (data) =>
  request('/payments/simulate', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getPaymentReceipt = (transactionRef) =>
  request(`/payments/receipt/${encodeURIComponent(transactionRef)}`);

export const getCustomerPayments = () => request('/payments/customer');

// ==========================================
// Phases 1-8: Existing Core System APIs
// ==========================================

export const getVehicles = () => request('/vehicles');
export const getVehicleById = (id) => request(`/vehicles/${id}`);
export const getVehicleByQR = (qrIdentifier) =>
  request(`/vehicles/qr/${encodeURIComponent(qrIdentifier)}`);
export const createVehicle = (data) =>
  request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateVehicleBattery = (id, battery) =>
  request(`/vehicles/${id}/battery`, {
    method: 'PUT',
    body: JSON.stringify({ currentBattery: battery }),
  });

export const getStations = () => request('/stations');
export const getAvailableStations = () => request('/stations/available');
export const getStationById = (id) => request(`/stations/${id}`);
export const createStation = (data) =>
  request('/stations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateStationStatus = (id, status) =>
  request(`/stations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const getReservations = () => request('/reservations');
export const getReservationById = (id) => request(`/reservations/${id}`);
export const createReservation = (data) =>
  request('/charging/reserve', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const cancelReservation = (id) =>
  request(`/reservations/${id}/cancel`, {
    method: 'PUT',
  });

export const getChargingSessions = () => request('/sessions');
export const getActiveChargingSessions = () => request('/sessions/active');
export const getVehicleChargingSessions = (vehicleId) =>
  request(`/sessions/vehicle/${vehicleId}`);
export const startCharging = (data) =>
  request('/charging/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const completeCharging = (data) =>
  request('/charging/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const checkInStation = (data, evaluate = false) =>
  request(`/charging/check-in${evaluate ? '?evaluate=true' : ''}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const authorizeCheckIn = checkInStation;

export const getSmartChargingRecommendation = (data) =>
  request('/charging/recommend', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const getRecommendedStationForVehicle = (vehicleId) =>
  request(`/charging/stations/recommended/${vehicleId}`);

export const getAnalytics = () => request('/analytics');

export const getDashboard = async () => {
  try {
    return await request('/analytics/summary');
  } catch (err) {
    const [vehicles, stations, sessions, active] = await Promise.all([
      getVehicles(),
      getStations(),
      getChargingSessions(),
      getActiveChargingSessions(),
    ]);
    const totalEnergy = sessions.reduce((acc, s) => acc + (Number(s.energyConsumed) || 0), 0);
    const totalCost = sessions.reduce((acc, s) => acc + (Number(s.chargingCost) || 0), 0);
    return {
      totalVehicles: vehicles.length,
      availableStations: stations.filter((s) => s.status === 'AVAILABLE').length,
      activeSessionsCount: active.length,
      totalChargingSessions: sessions.length,
      totalEnergyConsumed: Math.round(totalEnergy * 100) / 100,
      totalChargingCost: Math.round(totalCost * 100) / 100,
    };
  }
};

export const getUsers = () => request('/users');

// ==========================================
// Namespaced Export Bundles
// ==========================================

export const authApi = {
  login: loginApi,
  registerCustomer: registerCustomerApi,
  getMe: getMeApi,
};

export const ownerApi = {
  getOverview: getOwnerOverview,
  getStations: getOwnerStations,
  updateStationStatus: updateOwnerStationStatus,
  getActiveSessions: getOwnerActiveSessions,
  getActivity: getOwnerRecentActivity,
  getRevenue: getOwnerRevenue,
};

export const customerApi = {
  getDashboard: getCustomerDashboard,
  resolveStationByQr,
  getVehicles: getCustomerVehicles,
  addVehicle: addCustomerVehicle,
  getBookings: getCustomerBookings,
  createBooking: createCustomerBooking,
  cancelBooking: cancelCustomerBooking,
  getSessions: getCustomerSessions,
  startCharging: startCustomerCharging,
  completeCharging: completeCustomerCharging,
  getProfile: getCustomerProfile,
  updateProfile: updateCustomerProfile,
};

export const paymentsApi = {
  initiate: initiatePayment,
  simulate: simulatePayment,
  getReceipt: getPaymentReceipt,
  getCustomerPayments,
};

export const vehiclesApi = {
  getAll: getVehicles,
  getById: getVehicleById,
  getByQr: getVehicleByQR,
  register: createVehicle,
  updateBattery: updateVehicleBattery,
};

export const stationsApi = {
  getAll: getStations,
  getAvailable: getAvailableStations,
  getById: getStationById,
  create: createStation,
  register: createStation,
  updateStatus: updateStationStatus,
  toggleStatus: updateStationStatus,
};

export const reservationsApi = {
  getAll: getReservations,
  getById: getReservationById,
  create: createReservation,
  cancel: cancelReservation,
};

export const sessionsApi = {
  getAll: getChargingSessions,
  getActive: getActiveChargingSessions,
  getByVehicle: getVehicleChargingSessions,
  start: startCharging,
  complete: completeCharging,
};

export const smartChargingApi = {
  recommend: getSmartChargingRecommendation,
  getRecommendations: getRecommendedStationForVehicle,
  getHistory: (vehicleId) => request(`/charging/history/${vehicleId}`),
  getActive: getActiveChargingSessions,
  checkIn: checkInStation,
  authorizeCheckIn: checkInStation,
  start: startCharging,
  complete: completeCharging,
  reserve: createReservation,
};

export const analyticsApi = {
  getSummary: getAnalytics,
  getDashboard: getDashboard,
};

export const usersApi = {
  getAll: getUsers,
};

export default {
  authApi,
  ownerApi,
  customerApi,
  paymentsApi,
  getDashboard,
  getVehicles,
  getVehicleById,
  getVehicleByQR,
  createVehicle,
  getStations,
  getReservations,
  createReservation,
  cancelReservation,
  getChargingSessions,
  getActiveChargingSessions,
  getSmartChargingRecommendation,
  startCharging,
  completeCharging,
  getAnalytics,
  vehiclesApi,
  stationsApi,
  reservationsApi,
  sessionsApi,
  smartChargingApi,
  analyticsApi,
  usersApi,
};
