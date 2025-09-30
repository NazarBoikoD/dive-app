import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const diveApi = {
  getDives: () => api.get('/dives/dives'),
  createDive: (diveData: any) => api.post('/dives/dives', diveData),
  updateDive: (id: number, diveData: any) => api.put(`/dives/dives/${id}`, diveData),
  deleteDive: (id: number) => api.delete(`/dives/dives/${id}`),
  exportDives: (format: string) => api.get(`/exports/export/${format}`, { responseType: 'blob' }),
};

export const authApi = {
  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  register: (userData: any) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;