// API service for communicating with backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('vaccitrack_token');
};

// Helper function to set auth token
const setToken = (token) => {
  localStorage.setItem('vaccitrack_token', token);
};

// Helper function to remove auth token
const removeToken = () => {
  localStorage.removeItem('vaccitrack_token');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Enhanced error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data && response.data.token) {
      setToken(response.data.token);
      // Handle both _id (MongoDB) and id formats
      const userId = response.data.user._id || response.data.user.id;
      if (userId) {
        localStorage.setItem('vaccitrack_user_id', userId);
      }
    }
    
    return response;
  },

  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data && response.data.token) {
      setToken(response.data.token);
      // Handle both _id (MongoDB) and id formats
      const userId = response.data.user._id || response.data.user.id;
      if (userId) {
        localStorage.setItem('vaccitrack_user_id', userId);
      }
    }
    
    return response;
  },

  logout: () => {
    removeToken();
    localStorage.removeItem('vaccitrack_user_id');
  },

  getCurrentUser: async () => {
    return await apiRequest('/users/me');
  },
};

// Children API
export const childrenAPI = {
  getAll: async () => {
    const response = await apiRequest('/children');
    return response.data || [];
  },

  getById: async (id) => {
    const response = await apiRequest(`/children/${id}`);
    return response.data;
  },

  search: async (query) => {
    const response = await apiRequest(`/children/search?q=${encodeURIComponent(query)}`);
    return response.data || [];
  },

  create: async (childData) => {
    const response = await apiRequest('/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
    return response.data;
  },

  update: async (childId, updates) => {
    const response = await apiRequest(`/children/${childId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response.data;
  },

  remove: async (childId) => {
    const response = await apiRequest(`/children/${childId}`, {
      method: 'DELETE',
    });
    return response.data || { success: true };
  },

  updateVaccineStatus: async (childId, vaccineId, administeredDate) => {
    const response = await apiRequest(`/children/${childId}/vaccines/${vaccineId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        administeredDate: administeredDate ? administeredDate.toISOString() : new Date().toISOString() 
      }),
    });
    return response.data;
  },
};

