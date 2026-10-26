import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerCustomerApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('voltloop_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('voltloop_token') || '');
  const [portal, setPortal] = useState(() => {
    const saved = localStorage.getItem('voltloop_portal');
    if (saved) return saved;
    const storedUser = localStorage.getItem('voltloop_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        return u.role === 'OWNER' ? 'OWNER' : 'CUSTOMER';
      } catch {
        return 'CUSTOMER';
      }
    }
    return 'CUSTOMER';
  });

  const [loading, setLoading] = useState(true);

  // Sync state to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('voltloop_token', token);
    } else {
      localStorage.removeItem('voltloop_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('voltloop_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('voltloop_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('voltloop_portal', portal);
  }, [portal]);

  // Initial load verification
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('voltloop_token');
      if (savedToken) {
        try {
          const profile = await getMeApi();
          if (profile && profile.user) {
            setUser(profile.user);
            const userPortal = profile.user.role === 'OWNER' ? 'OWNER' : 'CUSTOMER';
            setPortal(userPortal);
          }
        } catch (err) {
          console.warn('Saved auth token session expired or invalid. Keeping cached user state for demo.', err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password, requestedPortal) => {
    const res = await loginApi({ email, password, portal: requestedPortal });
    if (res && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      const activePortal = res.user.role === 'OWNER' ? 'OWNER' : 'CUSTOMER';
      setPortal(activePortal);
      return { success: true, user: res.user, portal: activePortal };
    }
    throw new Error(res?.message || 'Authentication failed');
  };

  const register = async (registerData) => {
    const res = await registerCustomerApi(registerData);
    if (res && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      setPortal('CUSTOMER');
      return { success: true, user: res.user, vehicle: res.vehicle };
    }
    throw new Error(res?.message || 'Registration failed');
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('voltloop_token');
    localStorage.removeItem('voltloop_user');
  };

  const switchPortal = (targetPortal) => {
    setPortal(targetPortal);
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const value = {
    user,
    token,
    portal,
    isAuthenticated: !!token && !!user,
    isOwner: user?.role === 'OWNER',
    isCustomer: user?.role === 'CUSTOMER' || user?.role === 'USER',
    loading,
    login,
    register,
    logout,
    switchPortal,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
