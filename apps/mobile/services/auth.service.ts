import type { AuthResponse, User } from '@food/shared-types';
import type { LoginInput, RegisterInput, UpdateProfileInput } from '@food/validation';
import { api } from '@/lib/api';

export const login = (input: LoginInput) => api.post<AuthResponse>('/auth/login', input);
export const register = (input: RegisterInput) => api.post<AuthResponse>('/auth/register', input);
export const logout = () => api.post<null>('/auth/logout');
export const fetchMe = () => api.get<User>('/auth/me');
export const updateMe = (input: UpdateProfileInput) => api.patch<User>('/auth/me', input);
