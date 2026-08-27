import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ordersService } from '../services/orders.service';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Order } from '../types';

const STATUS_LABELS: Record<Order['status'], string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<Order['status'], string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  listo: 'bg-green-100 text-green-700',
  entregado: 'bg-gray-100 text-gray-600',
  cancelado: 'bg-red-100 text-red-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    ordersService.getAll(filterStatus ? { status: filterStatus } : undefined)
      .then(setOrders)
      .catch(() => toast.error('Error al cargar pedidos'))
      .finally(() => setLoading(false));
  }, [filterStatus]);

  const handleStatusChange = async (id: string, status: Order['status']) => {
    try {
      await ordersService.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
        <Link
          to="/pedidos/nuevo"
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + Nuevo
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {['', 'pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'].map((s) => (
          <button
            key={s}
            onClick={() => { setLoading(true); setFilterStatus(s); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
              filterStatus === s
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s as Order['status']]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">Pedido #{order.number}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              {order.customer && (
                <p className="text-sm text-gray-600 mb-2">👤 {order.customer.name}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {order.items.slice(0, 3).map((item) => (
                  <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {item.quantity}x {item.product?.name ?? item.productId}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    +{order.items.length - 3} más
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="font-bold text-orange-600">{formatCurrency(order.total)}</p>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
