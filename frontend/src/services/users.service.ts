import api from './api';
import { UserRecord } from '../types';

export const usersService = {
  getAll: () => api.get<UserRecord[]>('/users').then((r) => r.data),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<UserRecord>('/users', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; email: string; password: string; role: string; active: boolean }>) =>
    api.patch<UserRecord>(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.delete<UserRecord>(`/users/${id}`).then((r) => r.data),
};
