import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types';
import { formatPrice } from '@/utils/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await productsService.getAll();
      setProducts(data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('');
    setFormDescription('');
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormCategory(product.category || '');
    setFormDescription(product.description || '');
    setModalOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Ingresa un precio valido');
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formName.trim(),
        price,
        category: formCategory.trim() || undefined,
        description: formDescription.trim() || undefined,
      };

      if (editingProduct) {
        await productsService.update(editingProduct.id, productData);
        toast.success('Producto actualizado');
      } else {
        await productsService.create(productData);
        toast.success('Producto creado');
      }

      setModalOpen(false);
      await loadProducts();
    } catch {
      toast.error('Error al guardar producto');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(product: Product) {
    try {
      await productsService.update(product.id, { active: !product.active });
      toast.success(product.active ? 'Producto desactivado' : 'Producto activado');
      await loadProducts();
    } catch {
      toast.error('Error al actualizar producto');
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Eliminar "${product.name}"?`)) return;
    try {
      await productsService.delete(product.id);
      toast.success('Producto eliminado');
      await loadProducts();
    } catch {
      toast.error('Error al eliminar producto');
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" className="mt-20" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Productos</h2>
        <Button onClick={openCreateModal} size="sm">
          + Agregar
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">No hay productos</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className={!product.active ? 'opacity-50' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex-1" onClick={() => openEditModal(product)}>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    {!product.active && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>
                  )}
                  {product.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                  )}
                  <p className="text-primary font-bold mt-1">{formatPrice(product.price)}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
                    title={product.active ? 'Desactivar' : 'Activar'}
                  >
                    {product.active ? (
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre *"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Ej: Chorizo Asado"
          />
          <Input
            label="Precio *"
            type="number"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
            placeholder="0"
            min="0"
            step="100"
          />
          <Input
            label="Categoria"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder="Ej: Chorizos, Postres"
          />
          <Input
            label="Descripcion"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Descripcion del producto"
          />
          <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
            {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
