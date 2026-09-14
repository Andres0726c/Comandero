import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { usersService } from '../services/users.service';
import { UserRecord } from '../types';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  COCINA: 'Cocina',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  VENDEDOR: 'bg-blue-100 text-blue-700',
  COCINA: 'bg-orange-100 text-orange-700',
};

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const EMPTY_FORM: UserForm = { name: '', email: '', password: '', role: 'VENDEDOR' };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersService.getAll()
      .then(setUsers)
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (user: UserRecord) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nombre y email son requeridos');
      return;
    }
    if (!editUser && !form.password) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        const data: Parameters<typeof usersService.update>[1] = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password) data.password = form.password;
        const updated = await usersService.update(editUser.id, data);
        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? updated : u)));
        toast.success('Usuario actualizado');
      } else {
        const created = await usersService.create(form);
        setUsers((prev) => [...prev, created]);
        toast.success('Usuario creado');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: UserRecord) => {
    try {
      let updated: UserRecord;
      if (user.active) {
        updated = await usersService.deactivate(user.id);
        toast.success('Usuario desactivado');
      } else {
        updated = await usersService.update(user.id, { active: true });
        toast.success('Usuario activado');
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  if (loading) return <div className="p-4 text-center py-16 text-gray-400">Cargando...</div>;

  const active = users.filter((u) => u.active).length;

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-xs text-gray-400 mt-0.5">{active} activos · {users.length} total</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          + Nuevo
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-2">
        {(['ADMIN', 'VENDEDOR', 'COCINA'] as const).map((role) => {
          const count = users.filter((u) => u.role === role && u.active).length;
          return (
            <div key={role} className="bg-white rounded-2xl shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[role]}</p>
            </div>
          );
        })}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className={`bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 ${!user.active ? 'opacity-60' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              user.active ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                {!user.active && <span className="text-xs text-gray-400">· Inactivo</span>}
              </div>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => openEdit(user)}
                className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={() => toggleActive(user)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                  user.active
                    ? 'text-red-500 border-red-200 hover:bg-red-50'
                    : 'text-green-600 border-green-200 hover:bg-green-50'
                }`}
              >
                {user.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-50 shadow-2xl p-5 max-w-sm mx-auto">
            <h2 className="font-bold text-gray-900 mb-4 text-base">
              {editUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Contraseña{' '}
                  {editUser && (
                    <span className="text-gray-400 font-normal text-xs">(vacío = no cambia)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  placeholder={editUser ? '••••••••' : 'Mínimo 4 caracteres'}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="COCINA">Cocina</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
