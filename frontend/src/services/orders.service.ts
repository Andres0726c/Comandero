import api from './api';
import { Order } from '../types';

export const ordersService = {
  getAll: (params?: { status?: string; startDate?: string; endDate?: string }) =>
    api.get<Order[]>('/orders', { params }).then((r) => r.data),
  getById: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  create: (data: Partial<Order>) =>
    api.post<Order>('/orders', data).then((r) => r.data),
  updateStatus: (id: string, status: Order['status']) =>
    api.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
  delete: (id: string) => api.delete(`/orders/${id}`),
};
