import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { reportsService } from '@/services/reports.service';
import type { DailyReport, CustomerDebt, ReportSummary } from '@/types';
import { formatPrice, todayISO, getStartOfWeek, getStartOfMonth } from '@/utils/format';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type DateRange = 'today' | 'week' | 'month' | 'custom';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, customStart, customEnd]);

  async function loadData() {
    setLoading(true);
    try {
      const debtsPromise = reportsService.getDebts();

      if (dateRange === 'today') {
        const [daily, debtsData] = await Promise.all([
          reportsService.getDaily(todayISO()),
          debtsPromise,
        ]);
        setDailyReport(daily);
        setSummary(null);
        setDebts(debtsData.customers || []);
      } else {
        let startDate: string;
        let endDate: string;

        if (dateRange === 'week') {
          startDate = getStartOfWeek();
          endDate = todayISO();
        } else if (dateRange === 'month') {
          startDate = getStartOfMonth();
          endDate = todayISO();
        } else {
          startDate = customStart;
          endDate = customEnd;
        }

        const [summaryData, debtsData] = await Promise.all([
          reportsService.getSummary(startDate, endDate),
          debtsPromise,
        ]);
        setSummary(summaryData);
        setDailyReport(null);
        setDebts(debtsData.customers || []);
      }
    } catch {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }

  const totalSales = dailyReport?.totalSales ?? summary?.totalSales ?? 0;
  const orderCount = dailyReport?.orderCount ?? summary?.totalOrders ?? 0;
  const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;
  const byProduct = dailyReport?.byProduct ?? summary?.byProduct ?? [];
  const byPaymentMethod = dailyReport?.byPaymentMethod ?? summary?.byPaymentMethod ?? [];

  const rangeButtons: { key: DateRange; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Reportes</h2>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {rangeButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setDateRange(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] transition-colors ${
              dateRange === key
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {dateRange === 'custom' && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-base min-h-[44px]"
              />
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="mt-10" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-xs text-gray-500">Ventas</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(totalSales)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500">Pedidos</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{orderCount}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-gray-500">Promedio</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(avgOrder)}</p>
            </Card>
          </div>

          {byProduct.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Productos Vendidos</h3>
              <div className="space-y-2">
                {byProduct.map((item) => (
                  <div key={item.productName} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-gray-800 font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {byPaymentMethod.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Por Metodo de Pago</h3>
              <div className="space-y-2">
                {byPaymentMethod.map((item) => (
                  <div key={item.method} className="flex items-center justify-between py-2">
                    <p className="text-gray-800">
                      {item.method === 'EFECTIVO' ? 'Efectivo' : item.method === 'TRANSFERENCIA' ? 'Transferencia' : item.method}
                    </p>
                    <p className="font-semibold text-gray-900">{formatPrice(item.total)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">Deudores</h3>
            {debts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No hay deudas pendientes</p>
            ) : (
              <div className="space-y-3">
                {debts.map((debt) => (
                  <div key={debt.customer.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{debt.customer.name}</p>
                      {debt.customer.phone && (
                        <p className="text-sm text-gray-500">{debt.customer.phone}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {debt.pendingOrders?.length || 0} pedido(s) pendiente(s)
                      </p>
                    </div>
                    <Badge variant="red">{formatPrice(debt.totalDebt)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
