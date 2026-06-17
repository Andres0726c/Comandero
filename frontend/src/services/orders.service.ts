import api from './api';
import type { Order, Payment, CreateOrderData } from '@/types';

export const ordersService = {
  async getAll(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders', { params: filters });
    return data;
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  async create(order: CreateOrderData): Promise<Order> {
    const { data } = await api.post<Order>('/orders', order);
    return data;
  },

  async update(id: string, updates: { status?: string; notes?: string }): Promise<Order> {
    const { data } = await api.patch<Order>(`/orders/${id}`, updates);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/orders/${id}`);
  },

  async addPayment(orderId: string, payment: { amount: number; method?: string }): Promise<Payment> {
    const { data } = await api.post<Payment>(`/orders/${orderId}/payments`, payment);
    return data;
  },
};
