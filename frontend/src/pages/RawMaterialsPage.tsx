import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { rawMaterialsService } from '../services/raw-materials.service';
import { formatCurrency } from '../utils/format';
import { RawMaterial } from '../types';

const CATEGORIES = ['TODOS', 'CARNES', 'LÁCTEOS', 'VERDURAS', 'ABARROTES', 'SALSAS', 'DESECHABLES', 'GASEOSAS'];

const EMPTY: Partial<RawMaterial> = {
  name: '',
  category: '',
  unit: '',
  referencePrice: undefined,
  notes: '',
  active: true,
};

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partial<RawMaterial>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const cat = activeCategory === 'TODOS' ? undefined : activeCategory;
    rawMaterialsService
      .getAll(cat)
      .then(setMaterials)
      .catch(() => toast.error('Error al cargar materias primas'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing({ ...EMPTY, category: activeCategory === 'TODOS' ? '' : activeCategory });
    setShowModal(true);
  };

  const openEdit = (m: RawMaterial) => {
    setEditing({ ...m });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing.name?.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!editing.unit?.trim()) {
      toast.error('La unidad es requerida');
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await rawMaterialsService.update(editing.id, editing);
        toast.success('Materia prima actualizada');
      } else {
        await rawMaterialsService.create(editing);
        toast.success('Materia prima creada');
      }
      setShowModal(false);
      load();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (m: RawMaterial) => {
    try {
      await rawMaterialsService.update(m.id, { active: !m.active });
      setMaterials((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, active: !x.active } : x)),
      );
      toast.success(m.active ? 'Desactivada' : 'Activada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await rawMaterialsService.delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      setDeleteConfirm(null);
      toast.success('Eliminada correctamente');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    CARNES: 'bg-red-100 text-red-700',
    LÁCTEOS: 'bg-blue-100 text-blue-700',
    VERDURAS: 'bg-green-100 text-green-700',
    ABARROTES: 'bg-yellow-100 text-yellow-700',
    SALSAS: 'bg-orange-100 text-orange-700',
    DESECHABLES: 'bg-gray-100 text-gray-600',
    GASEOSAS: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Materia Prima</h1>
        <button
          onClick={openAdd}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-orange-600"
        >
          + Agregar
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🥬</p>
          <p className="text-gray-500 text-sm">
            {activeCategory === 'TODOS'
              ? 'No hay materias primas registradas'
              : `No hay materias en ${activeCategory}`}
          </p>
          <button
            onClick={openAdd}
            className="mt-4 text-orange-500 font-medium text-sm"
          >
            Agregar primera materia prima
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-2xl shadow-sm p-4 transition-opacity ${!m.active ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        CATEGORY_COLORS[m.category] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {m.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500">Unidad: {m.unit}</span>
                    {m.referencePrice !== undefined && m.referencePrice > 0 && (
                      <span className="text-xs text-orange-600 font-medium">
                        Ref: {formatCurrency(m.referencePrice)}/{m.unit}
                      </span>
                    )}
                  </div>
                  {m.notes && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{m.notes}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="text-xs text-orange-500 font-medium underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggle(m)}
                    className="text-xs text-gray-400 font-medium underline"
                  >
                    {m.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(m.id)}
                    className="text-xs text-red-400 font-medium underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">
                {editing.id ? 'Editar' : 'Agregar'} Materia Prima
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nombre *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Ej: Pechuga de pollo"
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría *</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                  value={editing.category ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.filter((c) => c !== 'TODOS').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Unidad de medida *</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Ej: kg, litro, unidad, paquete"
                  value={editing.unit ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, unit: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Precio de referencia (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="0"
                  value={editing.referencePrice ?? ''}
                  onChange={(e) =>
                    setEditing((p) => ({
                      ...p,
                      referencePrice: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Información adicional..."
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3.5 text-sm font-medium text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 text-white rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60 active:bg-orange-600"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900">¿Eliminar materia prima?</h3>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
