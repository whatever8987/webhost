import axios from 'axios';
import { Template, PaginatedResponse, Business, TypeBusiness } from './types.js';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const API = {
  templates: {
    list: () => api.get<PaginatedResponse<Template>>('/templates/'),
    get: (id: number) => api.get<Template>(`/templates/${id}/`),
  },
  user: {
    getProfile: () => api.get('/users/me/'),
  },
  iframe: {
    getTypeBusinesses: () => api.get<TypeBusiness[]>('/types-businesses/'),
    getBusinesses: () => api.get<Business[]>('/businesses/'),
    getBusiness: (id: number) => api.get<Business>(`/businesses/${id}/`),
    getBusinessesByType: (typeName: string) => api.get<Business[]>(`/businesses/${typeName}/`),
  },
}; 