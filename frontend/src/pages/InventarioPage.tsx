import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productsService } from '../services/products.service';
import { formatCurrency } from '../utils/format';
import { Product } from '../types';

const CATEGORY_ORDER = [
  'Tortiburguers', 'Tortiburguers Picantes', 'Chorizos y Chuzos',
  'Sodas Italianas', 'Gaseosas',
];

export default function InventarioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pending, setPending] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsService.getAll()
      .then((data) => {
        setProducts(data);
        const initial: Record<string, number> = {};
        data.forEach((p) => { initial[p.id] = p.stock; });
        setPending(initial);
      })
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  }, []);

  const setQty = (id: string, value: number) => {
    setPending((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  };

  const save = async (product: Product) => {
    setSaving((s) => ({ ...s, [product.id]: true }));
    try {
      await productsService.updateStock(product.id, pending[product.id] ?? 0);
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, stock: pending[product.id] ?? 0 } : p)
      );
      toast.success(`${product.name} actualizado`);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving((s) => ({ ...s, [product.id]: false }));
    }
  };

  const setAll = async (stock: number) => {
    const promises = products.map((p) =>
      productsService.updateStock(p.id, stock)
    );
    try {
      await Promise.all(promises);
      const updated: Record<string, number> = {};
      products.forEach((p) => { updated[p.id] = stock; });
      setPending(updated);
      setProducts((prev) => prev.map((p) => ({ ...p, stock })));
      toast.success(stock === 0 ? 'Todo a cero' : `Todo en ${stock}`);
    } catch {
      toast.error('Error al actualizar todo');
    }
  };

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    const cat = p.category || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  if (loading) return <div className="p-4 text-center text-gray-400 py-16">Cargando...</div>;

  return (
    <div className="p-4 space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inventario de Jornada</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configura cuántas unidades hay disponibles para vender hoy</p>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Acciones rápidas</p>
        <div className="flex gap-2 flex-wrap">
          {[0, 5, 10, 15, 20].map((n) => (
            <button
              key={n}
              onClick={() => setAll(n)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              {n === 0 ? 'Todo a cero' : `Todo en ${n}`}
            </button>
          ))}
        </div>
      </div>

      {/* Products by category */}
      {categories.map((cat) => (
        <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">{cat}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {grouped[cat].map((product) => {
              const qty = pending[product.id] ?? product.stock;
              const changed = qty !== product.stock;
              const isAvailable = qty > 0;
              return (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(product.price)}</p>
                  </div>

                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                  }`}>
                    {isAvailable ? `${qty} disp.` : 'Sin stock'}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setQty(product.id, qty - 1)}
                      className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center font-bold text-lg leading-none hover:bg-orange-100 hover:text-orange-600"
                    >−</button>
                    <input
                      type="number"
                      min={0}
                      value={qty}
                      onChange={(e) => setQty(product.id, parseInt(e.target.value) || 0)}
                      className="w-12 text-center border border-gray-200 rounded-lg py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <button
                      onClick={() => setQty(product.id, qty + 1)}
                      className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center font-bold text-lg leading-none hover:bg-orange-100 hover:text-orange-600"
                    >+</button>
                  </div>

                  <button
                    onClick={() => save(product)}
                    disabled={!changed || saving[product.id]}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      changed
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-100 text-gray-400 cursor-default'
                    }`}
                  >
                    {saving[product.id] ? '...' : 'Guardar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
