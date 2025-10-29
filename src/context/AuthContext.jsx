import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Base API URL - Update this to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Create axios instance with authentication - use useMemo to prevent recreation
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    instance.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle response errors
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setNotifications([]);
          setUnreadCount(0);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []); // Empty dependency array - only create once

  // ✅ Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // Fetch current user info
  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/api/v1/auth/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return null;
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const [notificationsRes, unreadRes] = await Promise.all([
        api.get('/api/v1/notifications?limit=10'),
        api.get('/api/v1/notifications/unread/count'),
      ]);
      
      setNotifications(notificationsRes.data || []);
      setUnreadCount(unreadRes.data?.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/api/v1/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await api.put('/api/v1/notifications/mark-all-read');
      
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/v1/auth/login', {
        email,
        password,
      });

      const { access_token, user_id, role, email: userEmail } = response.data;

      // Store token
      localStorage.setItem('token', access_token);
      setToken(access_token);

      // Fetch full user info
      const userInfo = await fetchUserInfo();

      return {
        success: true,
        user: userInfo,
        role: role,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      setLoading(true);
      
      console.log('Signup - Sending data:', userData); // Debug log
      console.log('Signup - API endpoint:', `${API_BASE_URL}/api/v1/auth/signup`); // Debug log
      
      const response = await api.post('/api/v1/auth/signup', userData);

      console.log('Signup - Response:', response.data); // Debug log

      const { access_token, user_id, role, email } = response.data;

      // Store token
      localStorage.setItem('token', access_token);
      setToken(access_token);

      // Fetch full user info
      const userInfo = await fetchUserInfo();

      return {
        success: true,
        user: userInfo,
        role: role,
      };
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Signup error response:', error.response?.data); // Debug log
      console.error('Signup error status:', error.response?.status); // Debug log
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || 'Signup failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await api.post('/api/v1/auth/refresh');
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const endpoint = user.role === 'patient' 
        ? '/api/v1/patient/profile' 
        : user.role === 'doctor'
        ? '/api/v1/doctor/profile'
        : '/api/v1/admin/profile';
      
      await api.put(endpoint, profileData);
      
      // Refresh user info
      await fetchUserInfo();
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Profile update failed',
      };
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        await fetchUserInfo();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Fetch notifications periodically when user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // WebSocket connection for real-time updates (optional)
  useEffect(() => {
    if (!user) return;

    const WS_URL = API_BASE_URL.replace('http', 'ws');
    let ws;

    try {
      ws = new WebSocket(`${WS_URL}/ws/${user.id}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            // Add new notification to the list
            setNotifications((prev) => [data.data, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Optional: Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.data.title, {
                body: data.data.message,
                icon: '/favicon.ico',
              });
            }
          } else if (data.type === 'chat_message') {
            // Handle chat messages
            console.log('New chat message:', data.data);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    notifications,
    unreadCount,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshToken,
    updateProfile,
    fetchUserInfo,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    api, // Export configured axios instance
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;