import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { reportsService } from '../services/reports.service';
import { formatCurrency, formatDate } from '../utils/format';
import { ProfitReport, ProfitTimeline } from '../types';

const GASTOS_FIJOS_POR_DOMINGO = 42750;

function countSundays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    if (d.getDay() === 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

type Period = 'hoy' | 'semana' | 'mes' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

function getPeriodRange(period: Exclude<Period, 'custom'>): DateRange {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  if (period === 'hoy') return { startDate: end, endDate: end };
  if (period === 'semana') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: start.toISOString().split('T')[0], endDate: end };
  }
  // mes
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: start.toISOString().split('T')[0], endDate: end };
}

export default function GananciasPage() {
  const [period, setPeriod] = useState<Period>('mes');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
  });
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [timeline, setTimeline] = useState<ProfitTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveRange: DateRange | null =
    period === 'custom'
      ? customRange.startDate && customRange.endDate
        ? customRange
        : null
      : getPeriodRange(period as Exclude<Period, 'custom'>);

  useEffect(() => {
    if (!effectiveRange) return;
    setLoading(true);
    const groupBy: 'day' | 'week' | 'month' = 'day';
    const range = effectiveRange;
    Promise.all([
      reportsService.getProfits(range),
      reportsService.getProfitsTimeline(groupBy),
    ])
      .then(([r, t]) => {
        setReport(r);
        setTimeline(t);
      })
      .catch(() => toast.error('Error al cargar ganancias'))
      .finally(() => setLoading(false));
  }, [period, customRange.startDate, customRange.endDate]); // effectiveRange derived from these

  const isProfit = report ? report.grossProfit >= 0 : true;
  const gastosFijos = effectiveRange
    ? countSundays(effectiveRange.startDate, effectiveRange.endDate) * GASTOS_FIJOS_POR_DOMINGO
    : 0;
  const gananciaNeta = report ? report.grossProfit - gastosFijos : 0;

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ganancias</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ventas − Compras = Ganancia</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {(['hoy', 'semana', 'mes', 'custom'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === p
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Esta semana' : p === 'mes' ? 'Este mes' : 'Personalizado'}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Desde</label>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) =>
                setCustomRange((r) => ({ ...r, startDate: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) =>
                setCustomRange((r) => ({ ...r, endDate: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      )}

      {/* Period custom with no range yet */}
      {period === 'custom' && !effectiveRange && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Selecciona un rango de fechas
        </div>
      )}

      {/* Loading */}
      {loading && effectiveRange && (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      )}

      {/* Summary cards */}
      {!loading && report && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Ventas */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-green-600 text-xs font-medium">💰 Total Ventas</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(report.totalSales)}
              </p>
            </div>

            {/* Compras */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-red-500 text-xs font-medium">🛒 Total Compras</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(report.totalPurchases)}
              </p>
            </div>

            {/* Ganancia bruta */}
            <div
              className={`rounded-2xl p-4 col-span-2 ${
                isProfit
                  ? 'bg-blue-50 border border-blue-100'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isProfit ? 'text-blue-600' : 'text-red-600'
                }`}
              >
                📈 Ganancia Bruta
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  isProfit ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {isProfit ? '' : '−'}{formatCurrency(Math.abs(report.grossProfit))}
              </p>
            </div>

            {/* Gastos fijos */}
            {gastosFijos > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 col-span-2">
                <p className="text-orange-600 text-xs font-medium">🔥 Gastos Fijos ({countSundays(report.period.startDate, report.period.endDate)} domingo{countSundays(report.period.startDate, report.period.endDate) !== 1 ? 's' : ''})</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  − {formatCurrency(gastosFijos)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Energía + Gas + Carbón = $42.750/domingo</p>
              </div>
            )}

            {/* Ganancia neta */}
            <div
              className={`rounded-2xl p-4 col-span-2 ${
                gananciaNeta >= 0
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p className={`text-xs font-semibold ${gananciaNeta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                ✅ Ganancia Neta (después de gastos fijos)
              </p>
              <p className={`text-2xl font-bold mt-1 ${gananciaNeta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {gananciaNeta < 0 ? '−' : ''}{formatCurrency(Math.abs(gananciaNeta))}
              </p>
            </div>

            {/* Margen */}
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 col-span-2">
              <p className="text-purple-600 text-xs font-medium">% Margen de ganancia bruta</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  report.profitMargin >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {report.profitMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Del {formatDate(report.period.startDate)} al {formatDate(report.period.endDate)}
              </p>
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800">Desglose por día</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {/* Header row */}
                <div className="grid grid-cols-4 px-4 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500">Fecha</span>
                  <span className="text-xs font-semibold text-green-600 text-right">Ventas</span>
                  <span className="text-xs font-semibold text-red-500 text-right">Compras</span>
                  <span className="text-xs font-semibold text-blue-600 text-right">Ganancia</span>
                </div>
                {timeline.map((row) => {
                  const rowProfit = row.profit;
                  return (
                    <div key={row.date} className="grid grid-cols-4 px-4 py-3 items-center">
                      <span className="text-xs text-gray-600">{formatDate(row.date)}</span>
                      <span className="text-xs font-medium text-gray-800 text-right">
                        {formatCurrency(row.sales)}
                      </span>
                      <span className="text-xs font-medium text-gray-800 text-right">
                        {formatCurrency(row.purchases)}
                      </span>
                      <span
                        className={`text-xs font-bold text-right ${
                          rowProfit >= 0 ? 'text-blue-600' : 'text-red-500'
                        }`}
                      >
                        {rowProfit < 0 ? '−' : ''}{formatCurrency(Math.abs(rowProfit))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {timeline.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-gray-400 text-sm">Sin datos para el período seleccionado</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
