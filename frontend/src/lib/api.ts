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
