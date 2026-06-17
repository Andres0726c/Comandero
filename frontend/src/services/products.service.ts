import api from './api';
import type { Product } from '@/types';

export const productsService = {
  async getAll(): Promise<Product[]> {
    const { data } = await api.get<Product[]>('/products');
    return data;
  },

  async getById(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  async create(product: { name: string; price: number; description?: string; category?: string }): Promise<Product> {
    const { data } = await api.post<Product>('/products', product);
    return data;
  },

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, product);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
