import api from './api';
import { Product } from '../types';

export const productsService = {
  getAll: (category?: string) =>
    api.get<Product[]>('/products', { params: { category } }).then((r) => r.data),
  getById: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (data: Partial<Product>) =>
    api.post<Product>('/products', data).then((r) => r.data),
  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/products/${id}`),
  updateStock: (id: string, stock: number) =>
    api.patch<Product>(`/products/${id}/stock`, { stock }).then((r) => r.data),
};
