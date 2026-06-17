import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { customersService } from '@/services/customers.service';
import { reportsService } from '@/services/reports.service';
import type { Customer, CustomerDebt } from '@/types';
import { formatPrice } from '@/utils/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [custs, debtsData] = await Promise.all([
        customersService.getAll(),
        reportsService.getDebts(),
      ]);
      setCustomers(custs);
      setDebts(debtsData.customers || []);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }

  const debtMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of debts) {
      map.set(d.customer.id, d.totalDebt);
    }
    return map;
  }, [debts]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  function openCreateModal() {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || '');
    setFormAddress(customer.address || '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const customerData = {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
      };

      if (editingCustomer) {
        await customersService.update(editingCustomer.id, customerData);
        toast.success('Cliente actualizado');
      } else {
        await customersService.create(customerData);
        toast.success('Cliente creado');
      }

      setModalOpen(false);
      await loadData();
    } catch {
      toast.error('Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Eliminar "${customer.name}"?`)) return;
    try {
      await customersService.delete(customer.id);
      toast.success('Cliente eliminado');
      setDetailCustomer(null);
      await loadData();
    } catch {
      toast.error('Error al eliminar cliente');
    }
  }

  async function openDetail(customer: Customer) {
    try {
      const full = await customersService.getById(customer.id);
      setDetailCustomer(full);
    } catch {
      setDetailCustomer(customer);
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
        <Button onClick={openCreateModal} size="sm">
          + Agregar
        </Button>
      </div>

      <Input
        placeholder="Buscar clientes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredCustomers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {search ? 'No se encontraron clientes' : 'No hay clientes'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => {
            const debt = debtMap.get(customer.id);
            return (
              <Card
                key={customer.id}
                className={`cursor-pointer active:bg-gray-50 transition-colors ${
                  debt ? 'border-l-4 border-l-red-400' : ''
                }`}
                onClick={() => openDetail(customer)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                      {debt && debt > 0 && (
                        <Badge variant="red">Debe {formatPrice(debt)}</Badge>
                      )}
                    </div>
                    {customer.phone && (
                      <p className="text-sm text-gray-500 mt-0.5">{customer.phone}</p>
                    )}
                    {customer.address && (
                      <p className="text-sm text-gray-400 mt-0.5">{customer.address}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(customer);
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Nombre del cliente"
          />
          <Input
            label="Telefono"
            type="tel"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="Numero de telefono"
          />
          <Input
            label="Direccion"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
            placeholder="Direccion"
          />
          <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
            {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        title={detailCustomer?.name || ''}
      >
        {detailCustomer && (
          <div className="space-y-4">
            <div>
              {detailCustomer.phone && (
                <p className="text-gray-600">
                  <span className="text-gray-400 text-sm">Tel: </span>
                  {detailCustomer.phone}
                </p>
              )}
              {detailCustomer.address && (
                <p className="text-gray-600">
                  <span className="text-gray-400 text-sm">Dir: </span>
                  {detailCustomer.address}
                </p>
              )}
            </div>

            {debtMap.get(detailCustomer.id) && (
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-red-800 font-semibold">
                  Deuda pendiente: {formatPrice(debtMap.get(detailCustomer.id)!)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => {
                setDetailCustomer(null);
                openEditModal(detailCustomer);
              }} className="flex-1">
                Editar
              </Button>
              <Button variant="danger" onClick={() => handleDelete(detailCustomer)} className="flex-1">
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
