/**
 * VoltLoop Centralized API Service Layer
 * Connects React frontend directly to the Spring Boot REST API.
 * Uses environment configuration (VITE_API_BASE_URL) with fallback to proxy `/api`.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '/api';

/**
 * Standardized Fetch Client with structured HTTP status parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
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
// Standalone Named Functions (as specified in Section 19)
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
    // Graceful fallback to multi-endpoint aggregation
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
// Namespaced Objects for API Consistency
// ==========================================

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
  register: createStation,
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
