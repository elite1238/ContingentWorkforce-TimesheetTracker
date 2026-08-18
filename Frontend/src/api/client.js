import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('wb_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r.data?.data ?? r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wb_token')
      localStorage.removeItem('wb_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data?.message ?? err.message ?? 'Request failed')
  }
)

export default api
