import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productsService } from '../services/products.service';
import { formatCurrency } from '../utils/format';
import { Product } from '../types';

const EMPTY: Partial<Product> = { name: '', description: '', price: 0, category: '', active: true };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    productsService.getAll()
      .then(setProducts)
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(EMPTY); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setShowModal(true); };

  const handleSave = async () => {
    if (!editing.name?.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        await productsService.update(editing.id, editing);
      } else {
        await productsService.create(editing);
      }
      toast.success(editing.id ? 'Producto actualizado' : 'Producto creado');
      setShowModal(false);
      load();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: Product) => {
    try {
      await productsService.update(p.id, { active: !p.active });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x));
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await productsService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Producto eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={openAdd}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🍖</p>
          <p className="text-gray-500">No hay productos aún</p>
          <button onClick={openAdd} className="mt-3 text-orange-500 font-medium text-sm">Agregar primero</button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl shadow-sm p-4 ${!p.active ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{p.category}</span>
                    <span className="text-orange-600 font-semibold text-sm">{formatCurrency(p.price)}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => handleToggle(p)} className="text-xs text-gray-400 underline">
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-xs text-orange-500 underline">Editar</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 underline">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg">{editing.id ? 'Editar' : 'Agregar'} producto</h2>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Nombre *" value={editing.name ?? ''} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Categoría" value={editing.category ?? ''} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" type="number" placeholder="Precio" value={editing.price ?? ''} onChange={(e) => setEditing((p) => ({ ...p, price: Number(e.target.value) }))} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Descripción (opcional)" value={editing.description ?? ''} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
