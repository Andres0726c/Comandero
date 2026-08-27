import api from './api';
import { Customer } from '../types';

export const customersService = {
  getAll: (search?: string) =>
    api.get<Customer[]>('/customers', { params: { search } }).then((r) => r.data),
  getById: (id: string) => api.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (data: Partial<Customer>) =>
    api.post<Customer>('/customers', data).then((r) => r.data),
  update: (id: string, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};
