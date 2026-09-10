import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ordersService } from '../services/orders.service';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  listo: 'Listo',
};

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  en_proceso: 'bg-blue-100 border-blue-300 text-blue-800',
  listo: 'bg-green-100 border-green-300 text-green-800',
};

const NEXT_STATUS: Record<string, string> = {
  pendiente: 'en_proceso',
  en_proceso: 'listo',
};

const NEXT_LABEL: Record<string, string> = {
  pendiente: 'Iniciar preparación',
  en_proceso: 'Marcar listo',
};

function timeSince(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const { logout } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await ordersService.getAll({ startDate: today, endDate: today });
      setOrders(data.filter((o) => ['pendiente', 'en_proceso'].includes(o.status)));
    } catch {
      // silently retry on next interval
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const advance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating((u) => ({ ...u, [order.id]: true }));
    try {
      await ordersService.updateStatus(order.id, next);
      setOrders((prev) =>
        next === 'listo'
          ? prev.filter((o) => o.id !== order.id)
          : prev.map((o) => o.id === order.id ? { ...o, status: next as Order['status'] } : o)
      );
      if (next === 'listo') toast.success(`Pedido #${order.id.slice(-4)} listo`);
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdating((u) => ({ ...u, [order.id]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pending = orders.filter((o) => o.status === 'pendiente');
  const inProcess = orders.filter((o) => o.status === 'en_proceso');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-white text-sm">Cocina — Donde Kuyu Grill</p>
            <p className="text-gray-400 text-xs">Se actualiza cada 20 segundos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="text-gray-400 hover:text-white text-xs border border-gray-600 px-3 py-1.5 rounded-lg"
          >
            Actualizar
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-xs"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-5xl mb-4">✅</p>
            <p className="text-lg font-semibold">Sin pedidos pendientes</p>
            <p className="text-sm mt-1">Todo al día</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* In process first */}
            {[...inProcess, ...pending].map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl border-2 p-4 space-y-3 ${STATUS_COLOR[order.status]}`}
              >
                {/* Order header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">Pedido #{order.id.slice(-4).toUpperCase()}</p>
                    <p className="text-sm opacity-70">
                      {order.customer?.name ?? 'Sin cliente'} · hace {timeSince(order.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                    order.status === 'pendiente'
                      ? 'bg-yellow-200 border-yellow-400 text-yellow-900'
                      : 'bg-blue-200 border-blue-400 text-blue-900'
                  }`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                {/* Items */}
                <div className="bg-white/50 rounded-xl p-3 space-y-1.5">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="font-bold text-lg leading-none w-7 text-center">
                        {item.quantity}
                      </span>
                      <span className="text-sm font-medium flex-1">
                        {item.product?.name ?? 'Producto'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {order.notes && (
                  <p className="text-xs bg-white/40 rounded-lg px-3 py-2 italic">
                    📝 {order.notes}
                  </p>
                )}

                {/* Action button */}
                {NEXT_STATUS[order.status] && (
                  <button
                    onClick={() => advance(order)}
                    disabled={updating[order.id]}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                      order.status === 'pendiente'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-60`}
                  >
                    {updating[order.id] ? 'Actualizando...' : NEXT_LABEL[order.status]}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
