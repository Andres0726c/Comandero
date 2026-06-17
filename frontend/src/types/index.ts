export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VENDEDOR';
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId?: string;
  customer?: Customer;
  userId: string;
  user?: User;
  status: 'PENDIENTE' | 'PAGADO' | 'PARCIAL' | 'CANCELADO';
  total: number;
  notes?: string;
  items: OrderItem[];
  payments: Payment[];
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';
  createdAt: string;
}

export interface DailyReport {
  totalSales: number;
  orderCount: number;
  byProduct: { productName: string; quantity: number; total: number }[];
  byPaymentMethod: { method: string; total: number }[];
}

export interface CustomerDebt {
  customer: Customer;
  totalDebt: number;
  pendingOrders: Order[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateOrderData {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}

export interface ReportSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  byProduct: { productName: string; quantity: number; total: number }[];
  byPaymentMethod: { method: string; total: number }[];
}
