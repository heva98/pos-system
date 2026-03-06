import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pos_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get('/auth/me'),
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productsAPI = {
  list:       (params) => api.get('/products', { params }),
  get:        (id)     => api.get(`/products/${id}`),
  byBarcode:  (code)   => api.get(`/products/barcode/${code}`),
  create:     (data)   => api.post('/products', data),
  update:     (id, data) => api.patch(`/products/${id}`, data),
  delete:     (id)     => api.delete(`/products/${id}`),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesAPI = {
  list:   ()         => api.get('/categories'),
  create: (data)     => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id)       => api.delete(`/categories/${id}`),
}

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const suppliersAPI = {
  list:   ()         => api.get('/suppliers'),
  create: (data)     => api.post('/suppliers', data),
  update: (id, data) => api.patch(`/suppliers/${id}`, data),
  delete: (id)       => api.delete(`/suppliers/${id}`),
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const customersAPI = {
  list:   (params)   => api.get('/customers', { params }),
  create: (data)     => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export const salesAPI = {
  list:   (params)  => api.get('/sales', { params }),
  get:    (id)      => api.get(`/sales/${id}`),
  create: (data)    => api.post('/sales', data),
  void:   (id)      => api.post(`/sales/${id}/void`),
}

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const purchasesAPI = {
  list:    ()   => api.get('/purchase-orders'),
  get:     (id) => api.get(`/purchase-orders/${id}`),
  create:  (data) => api.post('/purchase-orders', data),
  receive: (id) => api.post(`/purchase-orders/${id}/receive`),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersAPI = {
  list:   ()         => api.get('/users'),
  create: (data)     => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id)       => api.delete(`/users/${id}`),
}

// ── Dashboard & Reports ───────────────────────────────────────────────────────
export const dashboardAPI = {
  summary: () => api.get('/dashboard'),
}

export const reportsAPI = {
  salesSummary: (params) => api.get('/reports/sales-summary', { params }),
  topProducts:  (params) => api.get('/reports/top-products', { params }),
  lowStock:     ()       => api.get('/reports/low-stock'),
}

export default api