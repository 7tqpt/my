// API client using axios with JWT token support
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pm_token');
      localStorage.removeItem('pm_user');
      // redirect only if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Convenience CRUD helpers
export const listAll = (resource) => api.get(`/${resource}`).then((r) => r.data);
export const getOne = (resource, id) => api.get(`/${resource}/${id}`).then((r) => r.data);
export const createOne = (resource, data) => api.post(`/${resource}`, data).then((r) => r.data);
export const updateOne = (resource, id, data) => api.put(`/${resource}/${id}`, data).then((r) => r.data);
export const deleteOne = (resource, id) => api.delete(`/${resource}/${id}`).then((r) => r.data);

export const authLogin = (username, password) =>
  api.post('/auth/login', { username, password }).then((r) => r.data);
export const authMe = () => api.get('/auth/me').then((r) => r.data);

export const getDashboard = () => api.get('/dashboard/summary').then((r) => r.data);
export const getSettings = () => api.get('/settings').then((r) => r.data);
export const updateSettings = (data) => api.put('/settings', data).then((r) => r.data);

export const generateMonthlyPayments = (year_month) =>
  api.post('/payments/generate-monthly', { year_month }).then((r) => r.data);

export const markOverduePayments = (opts = {}) =>
  api.post('/payments/mark-overdue', opts).then((r) => r.data);
