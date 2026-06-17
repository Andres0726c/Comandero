import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { reportsService } from '@/services/reports.service';
import { ordersService } from '@/services/orders.service';
import type { DailyReport, Order } from '@/types';
import { formatPrice, formatTime, todayISO } from '@/utils/format';
import Card from '@/components/ui/Card';
import Badge, { getStatusBadgeVariant } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [dailyReport, orders] = await Promise.all([
        reportsService.getDaily(todayISO()),
        ordersService.getAll(),
      ]);
      setReport(dailyReport);
      setRecentOrders(orders.slice(0, 5));
    } catch {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Hola, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-gray-500">Resumen de hoy</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-white">
          <p className="text-sm opacity-90">Ventas Hoy</p>
          <p className="text-2xl font-bold mt-1">
            {formatPrice(report?.totalSales ?? 0)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-sm opacity-90">Pedidos</p>
          <p className="text-2xl font-bold mt-1">{report?.orderCount ?? 0}</p>
        </Card>
      </div>

      <Link
        to="/pedidos/nuevo"
        className="flex bg-primary hover:bg-primary-dark text-white rounded-xl p-4 text-center font-semibold text-lg shadow-md transition-colors min-h-[56px] items-center justify-center gap-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Pedido
      </Link>

      {report && report.byProduct.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">Productos Vendidos Hoy</h3>
          <div className="space-y-2">
            {report.byProduct.map((item) => (
              <div key={item.productName} className="flex items-center justify-between py-1">
                <div>
                  <span className="text-gray-800">{item.productName}</span>
                  <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                </div>
                <span className="font-medium text-gray-900">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Pedidos Recientes</h3>
          <Link to="/pedidos" className="text-sm text-primary font-medium">
            Ver todos
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No hay pedidos aun</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to="/pedidos"
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.customer?.name || 'Sin cliente'}
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total)}</p>
                  <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
