import axios from 'axios'

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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  config.headers = config.headers || {}
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  config.headers['Content-Type'] = 'application/json'
  return config
})

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