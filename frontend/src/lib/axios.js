import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // CRITICAL for HttpOnly cookie auth
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Simple global fallback: reload to login route
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default api
