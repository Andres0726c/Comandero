import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsService } from '../services/products.service';
import { customersService } from '../services/customers.service';
import { ordersService } from '../services/orders.service';
import { formatCurrency } from '../utils/format';
import { Product, Customer } from '../types';

interface LineItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<'local' | 'domicilio' | 'para_llevar'>('local');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productsService.getAll().then(setProducts).catch(() => {});
    customersService.getAll().then(setCustomers).catch(() => {});
  }, []);

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  };

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    setLoading(true);
    try {
      await ordersService.create({
        customerId: customerId || undefined,
        type,
        notes: notes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
        })) as never,
        subtotal: total,
        total,
      });
      toast.success('Pedido registrado');
      navigate('/pedidos');
    } catch {
      toast.error('Error al registrar el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-32">
      <h1 className="text-xl font-bold text-gray-900">Nuevo Pedido</h1>

      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <div className="flex gap-2 mt-1">
            {(['local', 'domicilio', 'para_llevar'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium ${type === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {t === 'local' ? 'Local' : t === 'domicilio' ? 'Domicilio' : 'Para llevar'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Cliente (opcional)</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Sin cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Productos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {products.filter((p) => p.active).map((product) => {
            const itemInOrder = items.find((i) => i.productId === product.id);
            const available = product.stock;
            const outOfStock = available === 0;
            const atMax = itemInOrder ? itemInOrder.quantity >= available : false;
            return (
              <div
                key={product.id}
                className={`border rounded-xl p-3 flex flex-col ${
                  outOfStock ? 'border-gray-100 bg-gray-50 opacity-50' : 'border-gray-100'
                }`}
              >
                <p className="text-sm font-medium text-gray-800 leading-tight">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-orange-600 text-sm font-semibold">{formatCurrency(product.price)}</p>
                  {!outOfStock && (
                    <span className="text-xs text-gray-400">{available} disp.</span>
                  )}
                  {outOfStock && (
                    <span className="text-xs text-red-400 font-medium">Agotado</span>
                  )}
                </div>
                {!outOfStock && (
                  itemInOrder ? (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(product.id, itemInOrder.quantity - 1)}
                        className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold"
                      >−</button>
                      <span className="flex-1 text-center text-sm font-semibold">{itemInOrder.quantity}</span>
                      <button
                        onClick={() => !atMax && updateQty(product.id, itemInOrder.quantity + 1)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                          atMax ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-orange-500 text-white'
                        }`}
                      >+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(product)}
                      className="mt-2 w-full bg-orange-50 text-orange-600 rounded-lg py-1.5 text-xs font-medium hover:bg-orange-100 transition-colors"
                    >
                      Agregar
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Resumen</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}x {item.name}</span>
                <span className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <label className="text-sm font-medium text-gray-700">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none"
          placeholder="Instrucciones especiales..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || items.length === 0}
        className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-60 active:bg-orange-600"
      >
        {loading ? 'Registrando...' : `Registrar Pedido${total > 0 ? ` · ${formatCurrency(total)}` : ''}`}
      </button>
    </div>
  );
}
