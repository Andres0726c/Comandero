import api from './api';
import type { DailyReport, CustomerDebt, ReportSummary } from '@/types';

export const reportsService = {
  async getDaily(date: string): Promise<DailyReport> {
    const { data } = await api.get<DailyReport>('/reports/daily', { params: { date } });
    return data;
  },

  async getDebts(): Promise<{ customers: CustomerDebt[] }> {
    const { data } = await api.get<{ customers: CustomerDebt[] }>('/reports/debts');
    return data;
  },

  async getSummary(startDate: string, endDate: string): Promise<ReportSummary> {
    const { data } = await api.get<ReportSummary>('/reports/summary', {
      params: { startDate, endDate },
    });
    return data;
  },
};
