import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { purchasesService } from '../services/purchases.service';
import { rawMaterialsService } from '../services/raw-materials.service';
import { formatCurrency, formatDate, todayISO } from '../utils/format';
import { Purchase, RawMaterial } from '../types';

interface DraftItem {
  key: string;
  rawMaterialId?: string;
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

let keyCounter = 0;
const newKey = () => String(++keyCounter);

const emptyItem = (): DraftItem => ({
  key: newKey(),
  name: '',
  quantity: '',
  unit: '',
  unitPrice: '',
});

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Raw materials for autocomplete
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, RawMaterial[]>>({});

  // Form state
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    purchasesService
      .getAll()
      .then(setPurchases)
      .catch(() => toast.error('Error al cargar compras'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    rawMaterialsService.getAll().then(setRawMaterials).catch(() => {});
  }, [load]);

  const runningTotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleItemChange = (key: string, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  };

  const handleSearchChange = (key: string, value: string) => {
    setSearchTerms((prev) => ({ ...prev, [key]: value }));
    handleItemChange(key, 'name', value);

    if (value.length >= 1) {
      const filtered = rawMaterials.filter((m) =>
        m.name.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions((prev) => ({ ...prev, [key]: filtered.slice(0, 6) }));
    } else {
      setSuggestions((prev) => ({ ...prev, [key]: [] }));
    }
  };

  const selectRawMaterial = (key: string, m: RawMaterial) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              rawMaterialId: m.id,
              name: m.name,
              unit: m.unit,
              unitPrice: m.referencePrice ? String(m.referencePrice) : i.unitPrice,
            }
          : i,
      ),
    );
    setSearchTerms((prev) => ({ ...prev, [key]: m.name }));
    setSuggestions((prev) => ({ ...prev, [key]: [] }));
  };

  const addItem = () => {
    const k = newKey();
    setItems((prev) => [...prev, emptyItem()]);
    setSearchTerms((prev) => ({ ...prev }));
  };

  const removeItem = (key: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.key !== key));
    setSearchTerms((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setDate(todayISO());
    setNotes('');
    setItems([emptyItem()]);
    setSearchTerms({});
    setSuggestions({});
  };

  const handleSubmit = async () => {
    const validItems = items.filter(
      (i) => i.name.trim() && parseFloat(i.quantity) > 0 && parseFloat(i.unitPrice) > 0,
    );
    if (validItems.length === 0) {
      toast.error('Agrega al menos un ítem válido');
      return;
    }
    setSaving(true);
    try {
      await purchasesService.create({
        date,
        notes: notes.trim() || undefined,
        items: validItems.map((i) => ({
          rawMaterialId: i.rawMaterialId,
          name: i.name.trim(),
          quantity: parseFloat(i.quantity),
          unit: i.unit.trim() || 'unidad',
          unitPrice: parseFloat(i.unitPrice),
        })),
      });
      toast.success('Compra registrada exitosamente');
      setShowForm(false);
      resetForm();
      load();
    } catch {
      toast.error('Error al registrar la compra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await purchasesService.delete(id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
      toast.success('Compra eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Compras</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold active:bg-orange-600"
        >
          + Nueva Compra
        </button>
      </div>

      {/* Purchases list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-gray-500 text-sm">No hay compras registradas</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            Registrar primera compra
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                className="w-full p-4 text-left"
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{formatDate(p.date)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.items.length} {p.items.length === 1 ? 'ítem' : 'ítems'}
                      {p.user && ` · ${p.user.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-800">{formatCurrency(p.total)}</span>
                    <span className={`text-gray-400 transition-transform ${expandedId === p.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>
              </button>

              {expandedId === p.id && (
                <div className="border-t border-gray-50 px-4 pb-4">
                  <div className="space-y-2 mt-3">
                    {p.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="text-gray-800 font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-700">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                  {p.notes && (
                    <p className="text-xs text-gray-400 mt-3 italic">{p.notes}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">Total: {formatCurrency(p.total)}</span>
                    <button
                      onClick={() => setDeleteConfirm(p.id)}
                      className="text-xs text-red-400 underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Purchase Form (slide-up panel) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[95vh] flex flex-col">
            {/* Form header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg">Nueva Compra</h2>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="text-gray-400 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Date */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {/* Items */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-3 block">Ítems de la compra</label>
                <div className="space-y-4">
                  {items.map((item, idx) => {
                    const subtotal =
                      (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                    const itemSuggestions = suggestions[item.key] ?? [];

                    return (
                      <div
                        key={item.key}
                        className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-500">Ítem {idx + 1}</span>
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(item.key)}
                              className="text-red-400 text-sm font-medium"
                            >
                              Quitar
                            </button>
                          )}
                        </div>

                        {/* Name with autocomplete */}
                        <div className="relative">
                          <input
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Nombre del producto *"
                            value={searchTerms[item.key] ?? item.name}
                            onChange={(e) => handleSearchChange(item.key, e.target.value)}
                          />
                          {itemSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-10 overflow-hidden">
                              {itemSuggestions.map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => selectRawMaterial(item.key, m)}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 border-b border-gray-50 last:border-0"
                                >
                                  <span className="font-medium text-gray-800">{m.name}</span>
                                  <span className="text-gray-400 text-xs ml-2">
                                    {m.unit}
                                    {m.referencePrice ? ` · ${formatCurrency(m.referencePrice)}` : ''}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quantity + Unit */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Cantidad *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                              placeholder="0"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(item.key, 'quantity', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Unidad *</label>
                            <input
                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                              placeholder="kg, litro..."
                              value={item.unit}
                              onChange={(e) => handleItemChange(item.key, 'unit', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Unit price + subtotal */}
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Precio unitario (COP) *</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.key, 'unitPrice', e.target.value)}
                          />
                        </div>

                        {subtotal > 0 && (
                          <div className="text-right">
                            <span className="text-xs text-gray-500">Subtotal: </span>
                            <span className="text-sm font-bold text-orange-600">{formatCurrency(subtotal)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={addItem}
                  className="mt-3 w-full border border-dashed border-orange-300 text-orange-500 rounded-xl py-3 text-sm font-medium active:bg-orange-50"
                >
                  + Agregar ítem
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notas (opcional)</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Observaciones de la compra..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Total + Submit */}
            <div className="border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total compra</span>
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(runningTotal)}</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full bg-orange-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-60 active:bg-orange-600"
              >
                {saving ? 'Registrando...' : 'Registrar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900">¿Eliminar esta compra?</h3>
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
