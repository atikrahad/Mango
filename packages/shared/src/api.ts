import axios, { AxiosInstance } from 'axios';
import { AuthStore } from './authStore';

export const createApiClient = (authStore: AuthStore): AxiosInstance => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Request interceptor: Attach access token if present
  api.interceptors.request.use(
    (config) => {
      const token = authStore.getState().accessToken;
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

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          if (response.data?.success && response.data?.data?.accessToken) {
            const { accessToken, user } = response.data.data;
            
            authStore.getState().setSession(accessToken, user);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (rotationError) {
          authStore.getState().logout();
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
};
