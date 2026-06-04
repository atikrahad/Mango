import { createApiClient } from '@mangosteen/shared';
import { useAuthStore } from '../store/authStore';

export const api = createApiClient(useAuthStore);

