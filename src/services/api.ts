import axios from 'axios'

/**
 * Centralized Axios instance that automatically attaches the
 * Authorization: Bearer <token> header to every outgoing request.
 *
 * All pages should import `api` from this module instead of using
 * bare `axios` — this guarantees the backend auth middleware
 * (get_current_user) always receives a valid Bearer token.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
  // Remove leading /api if present to prevent /api/v1/api/... paths
  if (config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api\//, '/');
  }

  const token = localStorage.getItem('sla_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api


