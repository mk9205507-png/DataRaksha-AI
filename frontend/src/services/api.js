import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Attach Supabase JWT token to Bearer authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dataraksha_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Detect 401 Unauthorized or 403 Forbidden
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.isNetworkDown = true;
      error.friendlyMessage = `Cannot connect to DataRaksha backend at ${API_BASE_URL}. Please ensure the FastAPI server is running on port 8000.`;
    }
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('dataraksha_auth_token');
      if (token && !token.startsWith('demo_jwt_token')) {
        localStorage.removeItem('dataraksha_auth_token');
        localStorage.removeItem('dataraksha_user');
        localStorage.removeItem('dataraksha_person_name');
        localStorage.removeItem('dataraksha_saved_email');
        window.dispatchEvent(
          new CustomEvent('dataraksha:unauthorized', {
            detail: {
              message: error.response.data?.detail || 'Session expired. Please sign in again.',
            },
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
