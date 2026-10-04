/**
 * VoltLoop Centralized API Service Layer
 * Connects React frontend directly to the Spring Boot REST API
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Standardized Fetch Client
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
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      const networkErr = new Error(
        'Unable to connect to VoltLoop server. Please make sure the Java backend is running on port 8080.'
      );
      networkErr.status = 503;
      throw networkErr;
    }
    throw error;
  }
}

// ==========================================
// 1. Vehicles API
// ==========================================
export const vehiclesApi = {
  getAll: () => request('/vehicles'),
  getById: (id) => request(`/vehicles/${id}`),
  getByQr: (qrIdentifier) => request(`/vehicles/qr/${encodeURIComponent(qrIdentifier)}`),
  register: (vehicleData) => request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  }),
  updateBattery: (id, currentBattery) => request(`/vehicles/${id}/battery`, {
    method: 'PUT',
    body: JSON.stringify({ currentBattery: Number(currentBattery) }),
  }),
  updateStatus: (id, status) => request(`/vehicles/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// ==========================================
// 2. Charging Stations API
// ==========================================
export const stationsApi = {
  getAll: () => request('/stations'),
  getAvailable: () => request('/stations/available'),
  getById: (id) => request(`/stations/${id}`),
  create: (stationData) => request('/stations', {
    method: 'POST',
    body: JSON.stringify(stationData),
  }),
  updateStatus: (id, status) => request(`/stations/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

// ==========================================
// 3. Slot Reservations API
// ==========================================
export const reservationsApi = {
  getAll: () => request('/reservations'),
  getById: (id) => request(`/reservations/${id}`),
  create: (reservationData) => request('/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData),
  }),
  cancel: (id) => request(`/reservations/${id}/cancel`, {
    method: 'PUT',
  }),
};

// ==========================================
// 4. Charging Sessions API
// ==========================================
export const sessionsApi = {
  getAll: () => request('/sessions'),
  getActive: () => request('/sessions/active'),
  getById: (id) => request(`/sessions/${id}`),
  getByVehicleId: (vehicleId) => request(`/sessions/vehicle/${vehicleId}`),
  start: (sessionData) => request('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  }),
  complete: (id, payload) => request(`/sessions/${id}/complete`, {
    method: 'PUT',
    body: JSON.stringify(payload || {}),
  }),
};

// ==========================================
// 5. Smart Charging Allocation Engine API
// ==========================================
export const smartChargingApi = {
  recommend: (payload) => request('/charging/recommend', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getRecommendedForVehicle: (vehicleId) => request(`/charging/stations/recommended/${vehicleId}`),
  reserve: (payload) => request('/charging/reserve', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  start: (payload) => request('/charging/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  complete: (payload) => request('/charging/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getActiveSessions: () => request('/charging/active'),
  getHistory: (vehicleId) => request(`/charging/history/${vehicleId}`),
};

// ==========================================
// 6. Users API
// ==========================================
export const usersApi = {
  getAll: () => request('/users'),
  getById: (id) => request(`/users/${id}`),
  create: (userData) => request('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// ==========================================
// 7. System Health Check
// ==========================================
export const checkBackendHealth = async () => {
  try {
    await vehiclesApi.getAll();
    return true;
  } catch (e) {
    return false;
  }
};
