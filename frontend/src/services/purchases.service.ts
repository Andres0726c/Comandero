import api from './api';
import { Purchase } from '../types';

export const purchasesService = {
  getAll: (params?: { startDate?: string; endDate?: string }) =>
    api.get<Purchase[]>('/purchases', { params }).then((r) => r.data),
  getById: (id: string) => api.get<Purchase>(`/purchases/${id}`).then((r) => r.data),
  create: (data: {
    date?: string;
    notes?: string;
    items: Array<{
      rawMaterialId?: string;
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
    }>;
  }) => api.post<Purchase>('/purchases', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/purchases/${id}`),
};
