import api from './api';
import { RawMaterial } from '../types';

export const rawMaterialsService = {
  getAll: (category?: string) =>
    api.get<RawMaterial[]>('/raw-materials', { params: { category } }).then((r) => r.data),
  getCategories: () =>
    api.get<string[]>('/raw-materials/categories').then((r) => r.data),
  create: (data: Partial<RawMaterial>) =>
    api.post<RawMaterial>('/raw-materials', data).then((r) => r.data),
  update: (id: string, data: Partial<RawMaterial>) =>
    api.patch<RawMaterial>(`/raw-materials/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/raw-materials/${id}`),
};
