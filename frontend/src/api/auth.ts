import { client } from './client';
import type { User, AuthTokens } from '../types';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; fullName: string; dateOfBirth: string; }

export const authApi = {
  login: (data: LoginPayload) =>
    client.post<AuthTokens & { user: User }>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    client.post<AuthTokens & { user: User }>('/auth/register', data).then((r) => r.data),

  me: () =>
    client.get<User>('/auth/me').then((r) => r.data),
};
