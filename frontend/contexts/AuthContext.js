import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import Router from 'next/router';
import SessionWarning from '../components/auth/SessionWarning';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children, router }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check auth if we have an access token
    // Ensure we're on the client side before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        checkAuth();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (token) {
        // Add timeout to prevent hanging
        const response = await Promise.race([
          authAPI.getProfile(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 10000)
          )
        ]);
        const userData = response.data.data?.user || response.data;
        const subscription = response.data.data?.subscription;
        const client = response.data.data?.client;

        const fullUser = { ...userData, subscription, client };
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser)); // Update local storage with fresh data
      }
    } catch (error) {
      console.error('Auth verification failed:', error.message);

      if (error.response?.status === 401) {
        // Try refreshing if 401 (interceptor might have already tried and failed)
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            setUser(null);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      // Backend returns: { success: true, data: { user, token } }
      console.log('Login response:', response.data);
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Invalid response structure');
      }

      const { user: initialUser, token, refresh_token } = response.data.data;
      let finalUser = initialUser;

      localStorage.setItem('access_token', token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      if (!finalUser) {
        // Fetch profile if user info not in login response
        const profileRes = await authAPI.getProfile();
        finalUser = profileRes.data.data?.user || profileRes.data; // Handle various response structures
      } else {
        // Verify we have context if it was returned
        if (response.data.data.context) {
          finalUser = { ...finalUser, context: response.data.data.context };
        }
      }

      localStorage.setItem('user', JSON.stringify(finalUser));
      setUser(finalUser);

      return { success: true, user: finalUser };
    } catch (error) {
      console.error('Login error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, refresh_token, user } = response.data.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true };
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || errorData?.detail || 'Registration failed';
      // Format validation details if present
      let errorDetails = '';
      if (errorData?.details && Array.isArray(errorData.details)) {
        errorDetails = ': ' + errorData.details.map(d => d.message).join(', ');
      }

      return {
        success: false,
        error: errorMessage + errorDetails
      };
    }
  };

  const sendOtp = async (email) => {
    try {
      const response = await authAPI.sendOtp(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to send verification code'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    Router.push('/');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data;

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  const refreshSubscription = async () => {
    try {
      // Force re-authentication to get fresh subscription data
      await checkAuth();
    } catch (error) {
      console.error('Failed to refresh subscription:', error);
    }
  };

  // --- Session Management ---
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Helper to decode JWT
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const payload = parseJwt(token);
      if (!payload || !payload.exp) return;

      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = payload.exp - now;

      // Warning threshold: 5 minutes (300 seconds)
      if (secondsRemaining <= 300 && secondsRemaining > 0) {
        setShowWarning(true);
        setTimeLeft(secondsRemaining);
      } else if (secondsRemaining <= 0) {
        // Expired
        logout();
      } else {
        setShowWarning(false);
      }
    }, 1000); // Check every second for countdown accuracy

    return () => clearInterval(interval);
  }, [user]);

  const renewSession = async () => {
    try {
      // Assuming backend has /api/auth/refresh endpoint that uses cookie or body
      // Based on auth.js: POST /api/auth/refresh with { refresh_token }
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await authAPI.refresh(refreshToken);

      if (response.data.success) {
        const { access_token, refresh_token: newRefreshToken } = response.data.data;
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        setShowWarning(false);
        toast.success('Session renewed!');
      }
    } catch (error) {
      console.error('Session renewal failed:', error);
      logout();
      toast.error('Session expired. Please login again.');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    sendOtp,
    updateProfile,
    refreshSubscription,
    router,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {user && (
        <SessionWarning
          isOpen={showWarning}
          onClose={() => setShowWarning(false)}
          timeLeft={timeLeft}
          onRenew={renewSession}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}