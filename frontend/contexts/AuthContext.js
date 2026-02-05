import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import Router from 'next/router';

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
        const contextData = response.data.data?.context || {};

        const fullUser = { ...userData, context: contextData };
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

      const { user: initialUser, token } = response.data.data;
      let finalUser = initialUser;

      localStorage.setItem('access_token', token);

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

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    router,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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