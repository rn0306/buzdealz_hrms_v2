import axios from 'axios'
import { clearUser } from '../utils/auth'   // ✅ Make sure this path is correct

// ----------------------------
// Get token from sessionStorage
// ----------------------------
function getToken(): string | null {
  try {
    const raw = sessionStorage.getItem('hrms_user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.apiToken || null
  } catch {
    return null
  }
}

// ----------------------------
// Axios Instance
// ----------------------------
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
})

// ----------------------------
// REQUEST INTERCEPTOR
// Add Token Automatically
// ----------------------------
api.interceptors.request.use((config) => {
  const token = getToken()
  config.headers = config.headers || {}

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  config.headers['Content-Type'] = 'application/json'
  return config
})


// ----------------------------
// RESPONSE INTERCEPTOR
// Auto-Logout on Token Expiry
// ----------------------------
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status

    // Token expired / Unauthorized
    if (status === 401) {
      clearUser()  // ✅ remove user + token from storage
      sessionStorage.removeItem('hrms_user') // optional double cleanup

      // Redirect to login
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)


// =========================================================
// API ENDPOINTS (YOUR EXISTING CODE — UNCHANGED)
// =========================================================

// TargetsMaster CRUD APIs
export const getTargetsMaster = () => api.get('/api/targets-master');
export const getTargetMasterById = (id: string) => api.get(`/api/targets-master/${id}`);
export const createTargetMaster = (data: any) => api.post('/api/targets-master', data);
export const updateTargetMaster = (id: string, data: any) => api.put(`/api/targets-master/${id}`, data);
export const deleteTargetMaster = (id: string) => api.delete(`/api/targets-master/${id}`);

// Employee Targets CRUD
export const getEmployeeTargets = () => api.get('/api/employee-targets');
export const getEmployeeTargetById = (id: string) => api.get(`/api/employee-targets/${id}`);
export const createEmployeeTarget = (data: any) => api.post('/api/employee-targets', data);
export const updateEmployeeTarget = (id: string, data: any) => api.put(`/api/employee-targets/${id}`, data);
export const deleteEmployeeTarget = (id: string) => api.delete(`/api/employee-targets/${id}`);

// Dropdown APIs for Employee Targets
export const getActiveTargets = () => api.get('/api/targets-master/active/list');
export const getActiveUsers = () => api.get('/api/auth/users/active');

// Plans APIs
export const getPlansMaster = () => api.get('/api/plans');
export const createPlanMaster = (data: any) => api.post('/api/plans', data);
export const updatePlanMaster = (id: string, data: any) => api.put(`/api/plans/${id}`, data);
export const deletePlanMaster = (id: string) => api.delete(`/api/plans/${id}`);

// Notifications APIs
export const createNotification = (data: any) => api.post('/api/notifications', data);
export const getNotifications = (params?: any) => api.get('/api/notifications', { params });
export const getNotificationById = (id: string) => api.get(`/api/notifications/${id}`);
export const markNotificationRead = (id: string) => api.put(`/api/notifications/${id}/read`);
export const markNotificationUnread = (id: string) => api.put(`/api/notifications/${id}/unread`);
export const markAllNotificationsRead = () => api.put('/api/notifications/all/read');
export const getUnreadNotificationsCount = () => api.get('/api/notifications/count');
export const deleteNotification = (id: string) => api.delete(`/api/notifications/${id}`);
