import api from './api';
import { SalesReport, ProfitReport, ProfitTimeline } from '../types';

export const reportsService = {
  getSales: (params?: { startDate?: string; endDate?: string }) =>
    api.get<SalesReport>('/reports/sales', { params }).then((r) => r.data),
  getProfits: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ProfitReport>('/reports/profits', { params }).then((r) => r.data),
  getProfitsTimeline: (groupBy: 'day' | 'week' | 'month' = 'day') =>
    api.get<ProfitTimeline[]>('/reports/profits-timeline', { params: { groupBy } }).then((r) => r.data),
};
