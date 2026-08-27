import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { customersService } from '../services/customers.service';
import { formatDate } from '../utils/format';
import { Customer } from '../types';

const EMPTY: Partial<Customer> = { name: '', phone: '', email: '', address: '', notes: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    customersService.getAll(search || undefined)
      .then(setCustomers)
      .catch(() => toast.error('Error al cargar clientes'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing.name?.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        await customersService.update(editing.id, editing);
      } else {
        await customersService.create(editing);
      }
      toast.success(editing.id ? 'Cliente actualizado' : 'Cliente creado');
      setShowModal(false);
      load();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await customersService.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success('Cliente eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => { setEditing(EMPTY); setShowModal(true); }}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + Agregar
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar clientes..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
      />

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500">No hay clientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  {c.phone && <p className="text-sm text-gray-500 mt-0.5">📱 {c.phone}</p>}
                  {c.email && <p className="text-sm text-gray-500">✉️ {c.email}</p>}
                  <p className="text-xs text-gray-400 mt-1">Desde {formatDate(c.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-xs text-orange-500 underline">Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 underline">Borrar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg">{editing.id ? 'Editar' : 'Agregar'} cliente</h2>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Nombre *" value={editing.name ?? ''} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Teléfono" value={editing.phone ?? ''} onChange={(e) => setEditing((p) => ({ ...p, phone: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Correo electrónico" value={editing.email ?? ''} onChange={(e) => setEditing((p) => ({ ...p, email: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" placeholder="Dirección" value={editing.address ?? ''} onChange={(e) => setEditing((p) => ({ ...p, address: e.target.value }))} />
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none" rows={2} placeholder="Notas" value={editing.notes ?? ''} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} />
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
