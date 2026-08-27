export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  active: boolean;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Order {
  id: string;
  number: number;
  date: string;
  customerId?: string;
  customer?: Customer;
  userId: string;
  user?: User;
  status: 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'cancelado';
  type: 'local' | 'domicilio' | 'para_llevar';
  items: OrderItem[];
  subtotal: number;
  total: number;
  notes?: string;
  deliveryAddress?: string;
  createdAt: string;
}

export interface SalesReport {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  period: { startDate: string; endDate: string };
}

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  referencePrice?: number;
  notes?: string;
  active: boolean;
}

export interface PurchaseItem {
  id: string;
  rawMaterialId?: string;
  rawMaterial?: RawMaterial;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  date: string;
  userId: string;
  user?: User;
  total: number;
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
}

export interface ProfitReport {
  totalSales: number;
  totalPurchases: number;
  grossProfit: number;
  profitMargin: number;
  period: { startDate: string; endDate: string };
}

export interface ProfitTimeline {
  date: string;
  sales: number;
  purchases: number;
  profit: number;
}
