import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordersService } from '@/services/orders.service';
import type { Order } from '@/types';
import { formatPrice, formatDateTime } from '@/utils/format';
import Card from '@/components/ui/Card';
import Badge, { getStatusBadgeVariant } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type StatusFilter = 'TODOS' | 'PENDIENTE' | 'PAGADO' | 'PARCIAL';

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'PENDIENTE', label: 'Pendiente' },
  { key: 'PAGADO', label: 'Pagado' },
  { key: 'PARCIAL', label: 'Parcial' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO'>('EFECTIVO');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const data = await ordersService.getAll();
      setOrders(data);
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders =
    statusFilter === 'TODOS'
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  function openOrderDetail(order: Order) {
    setSelectedOrder(order);
  }

  function openPaymentModal() {
    setPaymentModalOpen(true);
    setPaymentAmount('');
    setPaymentMethod('EFECTIVO');
  }

  async function handleAddPayment() {
    if (!selectedOrder || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto valido');
      return;
    }

    setPaymentLoading(true);
    try {
      await ordersService.addPayment(selectedOrder.id, { amount, method: paymentMethod });
      toast.success('Pago registrado');
      setPaymentModalOpen(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch {
      toast.error('Error al registrar pago');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!confirm('Cancelar este pedido?')) return;
    try {
      await ordersService.update(orderId, { status: 'CANCELADO' });
      toast.success('Pedido cancelado');
      setSelectedOrder(null);
      await loadOrders();
    } catch {
      toast.error('Error al cancelar pedido');
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  const totalPaid = selectedOrder?.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const remaining = (selectedOrder?.total ?? 0) - totalPaid;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Pedidos</h2>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {statusFilters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap min-h-[40px] transition-colors ${
              statusFilter === key
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">No hay pedidos</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer active:bg-gray-50 transition-colors"
              onClick={() => openOrderDetail(order)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {order.customer?.name || 'Sin cliente'}
                    </p>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {order.items?.map((i) => `${i.product?.name || 'Producto'} x${i.quantity}`).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="text-lg font-bold text-gray-900 ml-3">{formatPrice(order.total)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedOrder && !paymentModalOpen}
        onClose={() => setSelectedOrder(null)}
        title="Detalle del Pedido"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedOrder.customer?.name || 'Sin cliente'}
                </p>
                {selectedOrder.customer?.phone && (
                  <p className="text-sm text-gray-500">{selectedOrder.customer.phone}</p>
                )}
              </div>
              <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                {selectedOrder.status}
              </Badge>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Productos</h4>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between py-1">
                  <span className="text-gray-800">
                    {item.product?.name || 'Producto'} x{item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>

            {selectedOrder.payments && selectedOrder.payments.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Pagos</h4>
                {selectedOrder.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between py-1">
                    <span className="text-gray-600 text-sm">{payment.method}</span>
                    <span className="font-medium text-green-600">{formatPrice(payment.amount)}</span>
                  </div>
                ))}
                {remaining > 0 && (
                  <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                    <span className="text-sm font-medium text-red-600">Pendiente</span>
                    <span className="font-bold text-red-600">{formatPrice(remaining)}</span>
                  </div>
                )}
              </div>
            )}

            {selectedOrder.notes && (
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Notas</h4>
                <p className="text-gray-700 text-sm">{selectedOrder.notes}</p>
              </div>
            )}

            <p className="text-xs text-gray-400">{formatDateTime(selectedOrder.createdAt)}</p>

            <div className="flex gap-2 pt-2">
              {selectedOrder.status !== 'PAGADO' && selectedOrder.status !== 'CANCELADO' && (
                <Button onClick={openPaymentModal} className="flex-1">
                  Registrar Pago
                </Button>
              )}
              {selectedOrder.status !== 'CANCELADO' && (
                <Button
                  variant="danger"
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Registrar Pago"
      >
        <div className="space-y-4">
          {remaining > 0 && (
            <p className="text-sm text-gray-500">
              Pendiente: <span className="font-semibold text-red-600">{formatPrice(remaining)}</span>
            </p>
          )}

          <Input
            label="Monto"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="100"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metodo de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EFECTIVO', 'TRANSFERENCIA', 'OTRO'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    paymentMethod === method
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {method === 'EFECTIVO' ? 'Efectivo' : method === 'TRANSFERENCIA' ? 'Transfer.' : 'Otro'}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAddPayment} loading={paymentLoading} className="w-full" size="lg">
            Confirmar Pago
          </Button>
        </div>
      </Modal>
    </div>
  );
}
