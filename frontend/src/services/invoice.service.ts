import api from './api';

export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ExtractedInvoice {
  supplier?: string | null;
  date?: string | null;
  notes?: string | null;
  items: ExtractedItem[];
  total: number;
}

export interface AnalyzeResult {
  imageUrl: string;
  data: ExtractedInvoice;
}

export const invoiceService = {
  analyze: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post<AnalyzeResult>('/invoice/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
