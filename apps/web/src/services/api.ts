import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // crucial to send/receive secure HttpOnly cookies like refresh_token
});

// Request interceptor: Attach access token if present
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Handle expired tokens and automatic rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger RTR rotation only on 401 errors if we have not retried already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Request token rotation (automatically posts HttpOnly refresh_token cookie)
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data?.success && response.data?.data?.accessToken) {
          const { accessToken, user } = response.data.data;
          
          // Update zustand state
          useAuthStore.getState().setSession(accessToken, user);

          // Retry the original failed request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (rotationError) {
        // Rotation failed (cookie expired or invalid) -> Logout the user
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);
