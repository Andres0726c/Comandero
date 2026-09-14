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

function orderLabel(o: Order) {
  return o.orderNumber ? `#${String(o.orderNumber).padStart(3, '0')}` : `#${o.id.slice(-4).toUpperCase()}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);

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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['', 'pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setLoading(true); setFilterStatus(s); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
              filterStatus === s
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {s === '' ? 'Todos' : STATUS_LABELS[s]}
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
                  <p className="font-semibold text-gray-900">Pedido {orderLabel(order)}</p>
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
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-orange-600">{formatCurrency(order.total)}</p>
                  <button
                    onClick={() => setTicketOrder(order)}
                    className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50"
                  >
                    🧾 Ticket
                  </button>
                </div>
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

      {/* Ticket modal */}
      {ticketOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 print:hidden" onClick={() => setTicketOrder(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 shadow-2xl p-5 max-w-xs mx-auto print:shadow-none print:rounded-none print:fixed print:inset-0 print:translate-y-0 print:flex print:flex-col print:justify-center">
            {/* Header */}
            <div className="text-center mb-4">
              <p className="text-xl">🔥</p>
              <p className="font-bold text-base">Donde Kuyu Grill</p>
              <p className="text-xs text-gray-400">Autenticidad en cada bocado</p>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <p className="font-bold text-sm">Pedido {orderLabel(ticketOrder)}</p>
              <p className="text-xs text-gray-400">{formatDateTime(ticketOrder.createdAt)}</p>
              {ticketOrder.customer && (
                <p className="text-xs text-gray-500 mt-1">Cliente: {ticketOrder.customer.name}</p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-1.5 mb-3">
              {ticketOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}x {item.product?.name ?? 'Producto'}</span>
                  <span className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between font-bold text-sm mb-1">
              <span>TOTAL</span>
              <span className="text-orange-600">{formatCurrency(ticketOrder.total)}</span>
            </div>

            {ticketOrder.notes && (
              <p className="text-xs text-gray-400 italic mt-2">📝 {ticketOrder.notes}</p>
            )}

            <div className="border-t border-dashed border-gray-300 mt-3 pt-3 text-center">
              <p className="text-xs text-gray-400">¡Gracias por tu visita!</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4 print:hidden">
              <button
                onClick={() => setTicketOrder(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold"
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
