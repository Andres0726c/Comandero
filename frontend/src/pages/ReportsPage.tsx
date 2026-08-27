import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { reportsService } from '../services/reports.service';
import { formatCurrency } from '../utils/format';
import { SalesReport } from '../types';

type Period = 'hoy' | 'semana' | 'mes';

function getPeriodDates(period: Period) {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  if (period === 'hoy') return { startDate: end, endDate: end };
  if (period === 'semana') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: start.toISOString().split('T')[0], endDate: end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: start.toISOString().split('T')[0], endDate: end };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('mes');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsService.getSales(getPeriodDates(period))
      .then(setReport)
      .catch(() => toast.error('Error al cargar reportes'))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <Link to="/ganancias" className="text-orange-500 text-sm font-medium">Ver ganancias →</Link>
      </div>

      <div className="flex gap-2">
        {(['hoy', 'semana', 'mes'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium ${period === p ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : !report ? (
        <div className="text-center py-16 text-gray-400">Sin datos</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-green-600 text-xs font-medium">Total ingresos</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(report.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-gray-500 text-xs font-medium">Total pedidos</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{report.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-4 col-span-2">
              <p className="text-gray-500 text-xs font-medium">Ticket promedio</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(report.averageOrderValue)}</p>
            </div>
          </div>

          {report.topProducts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Productos más vendidos</h2>
              <div className="space-y-2">
                {report.topProducts.slice(0, 5).map((prod, i) => (
                  <div key={prod.productId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="text-sm text-gray-800">{prod.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(prod.revenue)}</p>
                      <p className="text-xs text-gray-400">{prod.quantity} uds</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
