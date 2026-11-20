// API service for communicating with backend, with seamless local demo fallback for Vercel/cloud previews
import { userRepository, childRepository } from './dataStore';
import { queryClientVaxbot } from './vaxbotEngine';

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

// Generic API request function with automatic network-failure detection
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
    // If backend is unreachable (e.g. deployed on Vercel without a live backend URL)
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('Load failed')) {
      const networkErr = new Error('BACKEND_OFFLINE');
      networkErr.isNetworkError = true;
      throw networkErr;
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.success && response.data && response.data.token) {
        setToken(response.data.token);
        const userId = response.data.user._id || response.data.user.id;
        if (userId) {
          localStorage.setItem('vaccitrack_user_id', userId);
        }
      }
      return response;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        // Fallback for Vercel/cloud demo
        const user = userRepository.authenticate(email, password);
        if (user) {
          const token = `mock_token_${user.id}_${Date.now()}`;
          setToken(token);
          localStorage.setItem('vaccitrack_user_id', user.id);
          return {
            success: true,
            data: {
              token,
              user: {
                ...user,
                _id: user.id,
              },
            },
          };
        }
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success && response.data && response.data.token) {
        setToken(response.data.token);
        const userId = response.data.user._id || response.data.user.id;
        if (userId) {
          localStorage.setItem('vaccitrack_user_id', userId);
        }
      }
      return response;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const newUser = userRepository.create(userData);
        const token = `mock_token_${newUser.id}_${Date.now()}`;
        setToken(token);
        localStorage.setItem('vaccitrack_user_id', newUser.id);
        return {
          success: true,
          data: {
            token,
            user: { ...newUser, _id: newUser.id },
          },
        };
      }
      throw error;
    }
  },

  logout: () => {
    removeToken();
    localStorage.removeItem('vaccitrack_user_id');
  },

  getCurrentUser: async () => {
    try {
      return await apiRequest('/users/me');
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const userId = localStorage.getItem('vaccitrack_user_id') || 'user_parent_1';
        const user = userRepository.findById(userId) || userRepository.findById('user_parent_1');
        return {
          success: true,
          data: user ? { ...user, _id: user.id } : null,
        };
      }
      throw error;
    }
  },
};

// Children API
export const childrenAPI = {
  getAll: async () => {
    try {
      const response = await apiRequest('/children');
      return response.data || [];
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const userId = localStorage.getItem('vaccitrack_user_id') || 'user_parent_1';
        const user = userRepository.findById(userId);
        if (user && user.role === 'doctor') {
          return childRepository.findAll().map(c => ({ ...c, _id: c.id }));
        }
        return childRepository.findByParentId(userId).map(c => ({ ...c, _id: c.id }));
      }
      return [];
    }
  },

  getById: async (id) => {
    try {
      const response = await apiRequest(`/children/${id}`);
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const child = childRepository.findById(id);
        return child ? { ...child, _id: child.id } : null;
      }
      return null;
    }
  },

  search: async (query) => {
    try {
      const response = await apiRequest(`/children/search?q=${encodeURIComponent(query)}`);
      return response.data || [];
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return childRepository.searchByName(query).map(c => ({ ...c, _id: c.id }));
      }
      return [];
    }
  },

  create: async (childData) => {
    try {
      const response = await apiRequest('/children', {
        method: 'POST',
        body: JSON.stringify(childData),
      });
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const parentId = localStorage.getItem('vaccitrack_user_id') || 'user_parent_1';
        const newChild = childRepository.create({
          name: childData.name,
          dateOfBirth: new Date(childData.dateOfBirth),
          gender: childData.gender || 'male',
          parentId: parentId,
        });
        return { ...newChild, _id: newChild.id };
      }
      throw error;
    }
  },

  update: async (childId, updates) => {
    try {
      const response = await apiRequest(`/children/${childId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const child = childRepository.update(childId, updates);
        return child ? { ...child, _id: child.id } : null;
      }
      throw error;
    }
  },

  remove: async (childId) => {
    try {
      const response = await apiRequest(`/children/${childId}`, {
        method: 'DELETE',
      });
      return {
        success: response.success !== false,
        parentDeleted: response.parentDeleted === true,
        message: response.message || 'Child deleted successfully',
        data: response.data,
      };
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const deleted = childRepository.remove(childId);
        const parentId = localStorage.getItem('vaccitrack_user_id') || 'user_parent_1';
        const remaining = childRepository.findByParentId(parentId);
        return {
          success: deleted,
          parentDeleted: remaining.length === 0,
          message: 'Child deleted successfully',
        };
      }
      throw error;
    }
  },

  updateVaccineStatus: async (childId, vaccineId, administeredDate) => {
    try {
      const response = await apiRequest(`/children/${childId}/vaccines/${vaccineId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          administeredDate: administeredDate ? administeredDate.toISOString() : new Date().toISOString() 
        }),
      });
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const child = childRepository.updateVaccineStatus(
          childId,
          vaccineId,
          'COMPLETED',
          administeredDate ? new Date(administeredDate) : new Date()
        );
        return child ? { ...child, _id: child.id } : null;
      }
      throw error;
    }
  },

  transferDoctor: async (childId, newDoctorId) => {
    try {
      const response = await apiRequest(`/children/${childId}/transfer`, {
        method: 'PATCH',
        body: JSON.stringify({ newDoctorId }),
      });
      return response;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const doc = userRepository.findByDoctorId(newDoctorId) || {
          id: 'doc_1',
          name: 'Dr. Rajesh Gupta',
          hospitalName: 'AIIMS Delhi',
          doctorId: newDoctorId,
        };
        const updated = childRepository.update(childId, {
          doctorId: {
            _id: doc.id,
            name: doc.name,
            doctorId: newDoctorId,
            hospitalName: doc.hospitalName,
          },
        });
        return { success: true, data: updated ? { ...updated, _id: updated.id } : null };
      }
      throw error;
    }
  },

  verifyCertificate: async (childId) => {
    try {
      const response = await apiRequest(`/children/${childId}/certificate-verify`);
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        const child = childRepository.findById(childId);
        return {
          valid: true,
          child: child ? { ...child, _id: child.id } : null,
          verifiedAt: new Date().toISOString(),
        };
      }
      throw error;
    }
  },
};

// OTP API
export const otpAPI = {
  send: async (childId, vaccineId) => {
    try {
      return await apiRequest('/otp/send', {
        method: 'POST',
        body: JSON.stringify({ childId, vaccineId }),
      });
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return { success: true, message: 'OTP sent successfully to registered mobile number' };
      }
      throw error;
    }
  },

  verify: async (childId, vaccineId, otp) => {
    try {
      return await apiRequest('/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ childId, vaccineId, otp }),
      });
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return { success: true, verified: true, message: 'OTP verified successfully' };
      }
      throw error;
    }
  },

  resend: async (childId, vaccineId) => {
    try {
      return await apiRequest('/otp/resend', {
        method: 'POST',
        body: JSON.stringify({ childId, vaccineId }),
      });
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return { success: true, message: 'OTP resent successfully' };
      }
      throw error;
    }
  },

  sendReminderEmail: async (reminderData) => {
    try {
      return await apiRequest('/otp/send-reminder-email', {
        method: 'POST',
        body: JSON.stringify(reminderData),
      });
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return { success: true, message: `Vaccine reminder sent successfully to ${reminderData.email || 'your Gmail'}` };
      }
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  lookupDoctor: async (doctorId) => {
    try {
      const response = await apiRequest(`/users/doctor/${encodeURIComponent(doctorId)}`);
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return {
          _id: 'doc_demo_1',
          name: 'Dr. Rajesh Gupta',
          hospitalName: 'AIIMS Delhi',
          specialization: 'Pediatrics & Immunization',
        };
      }
      throw error;
    }
  },
  deleteCurrentUser: async () => {
    try {
      return await apiRequest('/users/me', {
        method: 'DELETE',
      });
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return { success: true, message: 'User account reset' };
      }
      throw error;
    }
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    try {
      return await apiRequest('/notifications');
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return { success: true, data: [] };
      }
      throw error;
    }
  },
  markAsRead: async (id) => {
    try {
      return await apiRequest(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (error) {
      return { success: true };
    }
  },
  markAllAsRead: async () => {
    try {
      return await apiRequest('/notifications/read-all', {
        method: 'PATCH',
      });
    } catch (error) {
      return { success: true };
    }
  },
  sendDoctorReminder: async (childId, message) => {
    try {
      return await apiRequest('/notifications/send-reminder', {
        method: 'POST',
        body: JSON.stringify({ childId, message }),
      });
    } catch (error) {
      return { success: true, message: 'Reminder sent' };
    }
  },
};

// VaxBot AI Chat API (with n8n RAG Integration & Offline Fallback)
export const chatAPI = {
  ask: async (message, context = {}) => {
    // 1. If direct n8n RAG Webhook is configured, call n8n RAG pipeline directly
    const n8nWebhook = import.meta.env.VITE_N8N_RAG_WEBHOOK_URL;
    if (n8nWebhook) {
      try {
        const n8nRes = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, query: message, context }),
        });
        if (n8nRes.ok) {
          const n8nJson = await n8nRes.json();
          const replyText = n8nJson.reply || n8nJson.output || n8nJson.text;
          if (replyText) {
            return {
              reply: replyText,
              suggestions: n8nJson.suggestions || [
                'Fever after vaccination?',
                'BCG scar guidelines',
                'Download Certificate',
              ],
              rag_verified: true,
            };
          }
        }
      } catch (err) {
        console.warn('n8n RAG Webhook unavailable, using backend fallback:', err);
      }
    }

    // 2. Query VacciTrack backend chat API
    try {
      const response = await apiRequest('/chat/ask', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
      if (response && response.data && response.data.reply) {
        return response.data;
      }
      return queryClientVaxbot(message, context);
    } catch (error) {
      console.warn('Backend chat API unavailable, utilizing VaxBot Clinical Engine:', error.message);
      return queryClientVaxbot(message, context);
    }
  },
};

// Vaccination Centers & Hospitals API
export const centersAPI = {
  getAll: async (params = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.type && params.type !== 'all') query.append('type', params.type);
      if (params.search) query.append('search', params.search);
      if (params.inStockOnly) query.append('inStockOnly', 'true');
      if (params.pincode) query.append('pincode', params.pincode);

      const queryString = query.toString() ? `?${query.toString()}` : '';
      const response = await apiRequest(`/centers${queryString}`);
      return response.data || [];
    } catch (error) {
      // Fallback centers array is handled by VaccinationCenters.tsx default dataset
      return [];
    }
  },

  bookSlot: async (bookingData) => {
    try {
      const response = await apiRequest('/centers/book-slot', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      return response.data;
    } catch (error) {
      if (error.isNetworkError || error.message === 'BACKEND_OFFLINE') {
        return {
          success: true,
          bookingId: `ABHA-SLOT-${Math.floor(100000 + Math.random() * 900000)}`,
          message: 'Vaccination appointment slot booked successfully',
        };
      }
      throw error;
    }
  },
};
