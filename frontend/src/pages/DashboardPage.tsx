import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ordersService } from '../services/orders.service';
import { formatCurrency } from '../utils/format';
import { Order } from '../types';

const GASTOS_FIJOS_DOMINGO = 42750;

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    ordersService.getAll({ startDate: today, endDate: today })
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const todayRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter((o) => o.status === 'pendiente').length;
  const inProcess = orders.filter((o) => o.status === 'en_proceso').length;
  const gananciaEstimada = todayRevenue - GASTOS_FIJOS_DOMINGO;

  return (
    <div className="p-4 space-y-5">
      <div>
        <p className="text-gray-500 text-sm">Bienvenido,</p>
        <h1 className="text-xl font-bold text-gray-900">{user?.name ?? 'Usuario'} 👋</h1>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-500 text-white rounded-2xl p-4">
              <p className="text-orange-100 text-xs font-medium">Ventas hoy</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(todayRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-xs font-medium">Pedidos hoy</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-yellow-600 text-xs font-medium">Pendientes</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{pending}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-blue-600 text-xs font-medium">En proceso</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{inProcess}</p>
            </div>
          </div>

          {todayRevenue > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-gray-800">Cierre de jornada</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ventas del día</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(todayRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gastos fijos</span>
                  <span className="font-semibold text-red-500">− {formatCurrency(GASTOS_FIJOS_DOMINGO)}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Ganancia estimada</span>
                  <span className={`font-bold text-lg ${gananciaEstimada >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {gananciaEstimada < 0 ? '−' : ''}{formatCurrency(Math.abs(gananciaEstimada))}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Sin descontar costo de insumos. Ver Ganancias para el detalle completo.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Accesos rápidos</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { to: '/pedidos/nuevo', icon: '➕', label: 'Nuevo pedido' },
                { to: '/pedidos', icon: '📋', label: 'Pedidos' },
                { to: '/compras', icon: '🛒', label: 'Compras' },
                { to: '/productos', icon: '🍖', label: 'Productos' },
                { to: '/ganancias', icon: '📈', label: 'Ganancias' },
                { to: '/materia-prima', icon: '🥬', label: 'Mat. Prima' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center bg-gray-50 rounded-xl p-3 active:bg-orange-50"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs text-gray-600 text-center mt-1">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {orders.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-gray-800">Pedidos recientes</h2>
                <Link to="/pedidos" className="text-orange-500 text-sm">Ver todos</Link>
              </div>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Pedido #{order.number}</p>
                      <p className="text-xs text-gray-400">{order.customer?.name ?? 'Sin cliente'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'en_proceso' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'listo' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{order.status.replace('_', ' ')}</span>
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
