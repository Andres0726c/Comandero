import api from './api';
import type { Customer } from '@/types';

export const customersService = {
  async getAll(search?: string): Promise<Customer[]> {
    const params = search ? { search } : {};
    const { data } = await api.get<Customer[]>('/customers', { params });
    return data;
  },

  async getById(id: string): Promise<Customer> {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
  },

  async create(customer: { name: string; phone?: string; address?: string }): Promise<Customer> {
    const { data } = await api.post<Customer>('/customers', customer);
    return data;
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const { data } = await api.patch<Customer>(`/customers/${id}`, customer);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
