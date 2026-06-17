import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productsService } from '@/services/products.service';
import { customersService } from '@/services/customers.service';
import { ordersService } from '@/services/orders.service';
import type { Product, Customer } from '@/types';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CartItem {
  product: Product;
  quantity: number;
}

type Step = 'customer' | 'products' | 'review';

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('customer');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [skipCustomer, setSkipCustomer] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [payImmediately, setPayImmediately] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [prods, custs] = await Promise.all([
        productsService.getAll(),
        customersService.getAll(),
      ]);
      setProducts(prods.filter((p) => p.active));
      setCustomers(custs);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    for (const p of products) {
      const cat = p.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [products]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  function getCartQuantity(productId: string): number {
    return cart.find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((i) => i.product.id !== productId);
      }
      return prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }

  async function handleCreateCustomer() {
    if (!newCustomerName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    try {
      const customer = await customersService.create({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
        address: newCustomerAddress.trim() || undefined,
      });
      setSelectedCustomer(customer);
      setCustomers((prev) => [...prev, customer]);
      setShowNewCustomer(false);
      toast.success('Cliente creado');
      setStep('products');
    } catch {
      toast.error('Error al crear cliente');
    }
  }

  function handleCustomerNext() {
    if (skipCustomer || selectedCustomer) {
      setStep('products');
    } else {
      toast.error('Selecciona un cliente o continua sin cliente');
    }
  }

  function handleProductsNext() {
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    setStep('review');
  }

  async function handleSubmitOrder() {
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const order = await ordersService.create({
        customerId: selectedCustomer?.id,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        notes: notes.trim() || undefined,
      });

      if (payImmediately) {
        await ordersService.addPayment(order.id, {
          amount: order.total,
          method: paymentMethod,
        });
      }

      toast.success('Pedido creado exitosamente');
      navigate('/pedidos');
    } catch {
      toast.error('Error al crear pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (step === 'products') setStep('customer');
            else if (step === 'review') setStep('products');
            else navigate(-1);
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-900">Nuevo Pedido</h2>
      </div>

      <div className="flex items-center gap-1">
        {(['customer', 'products', 'review'] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`h-1.5 rounded-full flex-1 transition-colors ${
                idx <= ['customer', 'products', 'review'].indexOf(step)
                  ? 'bg-primary'
                  : 'bg-gray-200'
              }`}
            />
          </div>
        ))}
      </div>

      {step === 'customer' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Paso 1: Cliente</h3>

          {!showNewCustomer && !selectedCustomer && !skipCustomer && (
            <>
              <Input
                placeholder="Buscar cliente por nombre o telefono..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="cursor-pointer active:bg-primary-50 transition-colors"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setSkipCustomer(false);
                    }}
                  >
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                    {customer.address && <p className="text-sm text-gray-400">{customer.address}</p>}
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowNewCustomer(true)}
                  className="flex-1"
                >
                  Nuevo Cliente
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSkipCustomer(true);
                    setSelectedCustomer(null);
                  }}
                  className="flex-1"
                >
                  Sin Cliente
                </Button>
              </div>
            </>
          )}

          {showNewCustomer && (
            <Card>
              <h4 className="font-medium text-gray-900 mb-3">Nuevo Cliente</h4>
              <div className="space-y-3">
                <Input
                  label="Nombre *"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                />
                <Input
                  label="Telefono"
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Numero de telefono"
                />
                <Input
                  label="Direccion"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  placeholder="Direccion"
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateCustomer} className="flex-1">
                    Guardar
                  </Button>
                  <Button variant="ghost" onClick={() => setShowNewCustomer(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {selectedCustomer && (
            <Card className="border-primary border-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Card>
          )}

          {skipCustomer && (
            <Card className="border-gray-300 border-2">
              <div className="flex items-center justify-between">
                <p className="text-gray-500">Venta sin cliente</p>
                <button
                  onClick={() => setSkipCustomer(false)}
                  className="text-primary text-sm font-medium min-h-[44px] flex items-center"
                >
                  Cambiar
                </button>
              </div>
            </Card>
          )}

          {(selectedCustomer || skipCustomer) && (
            <Button onClick={handleCustomerNext} className="w-full" size="lg">
              Siguiente
            </Button>
          )}
        </div>
      )}

      {step === 'products' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Paso 2: Productos</h3>

          {Object.entries(groupedProducts).map(([category, prods]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                {category}
              </h4>
              <div className="space-y-2">
                {prods.map((product) => {
                  const qty = getCartQuantity(product.id);
                  return (
                    <Card key={product.id} className={qty > 0 ? 'border-primary border-2' : ''}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500">{product.description}</p>
                          )}
                          <p className="text-primary font-semibold mt-1">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {qty > 0 && (
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
                            >
                              -
                            </button>
                          )}
                          {qty > 0 && (
                            <span className="w-8 text-center font-semibold text-lg">{qty}</span>
                          )}
                          <button
                            onClick={() => addToCart(product)}
                            className="w-11 h-11 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center text-xl font-bold text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {cart.length > 0 && (
            <div className="sticky bottom-20 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)} productos
                  </p>
                  <p className="text-xl font-bold text-gray-900">{formatPrice(cartTotal)}</p>
                </div>
                <Button onClick={handleProductsNext} size="lg">
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Paso 3: Confirmar</h3>

          <Card>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Cliente</h4>
            <p className="font-medium text-gray-900">
              {selectedCustomer?.name || 'Sin cliente'}
            </p>
          </Card>

          <Card>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Productos</h4>
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-gray-800">{item.product.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 mt-2 border-t border-gray-200">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg text-primary">{formatPrice(cartTotal)}</span>
            </div>
          </Card>

          <Card>
            <Input
              label="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alguna nota para el pedido..."
            />
          </Card>

          <Card>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={payImmediately}
                onChange={(e) => setPayImmediately(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="font-medium text-gray-900">Marcar como pagado</span>
            </label>

            {payImmediately && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors min-h-[48px] ${
                    paymentMethod === 'EFECTIVO'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod('TRANSFERENCIA')}
                  className={`py-3 px-4 rounded-lg font-medium transition-colors min-h-[48px] ${
                    paymentMethod === 'TRANSFERENCIA'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Transferencia
                </button>
              </div>
            )}
          </Card>

          <Button
            onClick={handleSubmitOrder}
            loading={submitting}
            className="w-full"
            size="lg"
          >
            Confirmar Pedido
          </Button>
        </div>
      )}
    </div>
  );
}
