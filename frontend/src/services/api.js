import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // If accessed over local network IP or 127.0.0.1, match the backend host automatically
    if (host && host !== 'localhost' && (!envUrl || !envUrl.startsWith('https://'))) {
      const port = (envUrl && envUrl.match(/:(\d+)/)?.[1]) || '8000';
      return `http://${host}:${port}/api/v1`;
    }
  }
  return envUrl || 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

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
      const requestUrl = error.config?.url || '';
      // Do not log out or kick user to login screen for auxiliary, health, scan, or admin verification checks
      if (
        requestUrl.includes('/history') ||
        requestUrl.includes('/health') ||
        requestUrl.includes('/gmail/status') ||
        requestUrl.includes('/scan/') ||
        requestUrl.includes('/admin/me')
      ) {
        return Promise.reject(error);
      }

      const token = localStorage.getItem('dataraksha_auth_token');
      if (token && !token.startsWith('demo_jwt_token')) {
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
