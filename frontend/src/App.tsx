import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/NewOrderPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import RawMaterialsPage from './pages/RawMaterialsPage';
import PurchasesPage from './pages/PurchasesPage';
import GananciasPage from './pages/GananciasPage';
import InventarioPage from './pages/InventarioPage';
import KitchenPage from './pages/KitchenPage';

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Kitchen role — standalone display, no layout
  if (user?.role === 'COCINA') {
    return (
      <Routes>
        <Route path="/cocina" element={<KitchenPage />} />
        <Route path="*" element={<Navigate to="/cocina" replace />} />
      </Routes>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/nuevo" element={<NewOrderPage />} />
        <Route path="clientes" element={<CustomersPage />} />
        {isAdmin && (
          <>
            <Route path="productos" element={<ProductsPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="materia-prima" element={<RawMaterialsPage />} />
            <Route path="compras" element={<PurchasesPage />} />
            <Route path="ganancias" element={<GananciasPage />} />
            <Route path="inventario" element={<InventarioPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
