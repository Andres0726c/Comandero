import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const BOTTOM_NAV: NavItem[] = [
  { to: '/', icon: '🏠', label: 'Inicio' },
  { to: '/pedidos', icon: '📋', label: 'Pedidos' },
  { to: '/pedidos/nuevo', icon: '➕', label: 'Nuevo' },
  { to: '/compras', icon: '🛒', label: 'Compras' },
];

const MORE_ITEMS: NavItem[] = [
  { to: '/productos', icon: '🍖', label: 'Productos' },
  { to: '/clientes', icon: '👥', label: 'Clientes' },
  { to: '/materia-prima', icon: '🥬', label: 'Materia Prima' },
  { to: '/ganancias', icon: '📈', label: 'Ganancias' },
  { to: '/reportes', icon: '📊', label: 'Reportes' },
];

export default function Layout() {
  const [showDrawer, setShowDrawer] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-bold text-orange-600 text-sm">Donde Kuyu Grill</span>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-1.5 text-sm text-gray-600"
        >
          <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </span>
          <span className="text-xs hidden sm:block">{user?.name}</span>
        </button>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-30 safe-bottom">
        <div className="flex items-center">
          {BOTTOM_NAV.map((item) => {
            const isNew = item.to === '/pedidos/nuevo';
            if (isNew) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex-1 flex flex-col items-center justify-center py-2"
                >
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-orange-200 -mt-5">
                    ➕
                  </div>
                  <span className="text-xs text-orange-500 font-medium mt-0.5">Nuevo</span>
                </Link>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center py-2 gap-0.5 ${
                    isActive ? 'text-orange-500' : 'text-gray-400'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Más button */}
          <button
            onClick={() => setShowDrawer(true)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-400"
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* Side drawer / More menu */}
      {showDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowDrawer(false)}
          />
          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="bg-orange-500 px-5 py-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white font-bold text-base">{user?.name ?? 'Usuario'}</p>
                  <p className="text-orange-100 text-xs mt-0.5">{user?.email}</p>
                  <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                    {user?.role ?? 'staff'}
                  </span>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="text-orange-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="text-orange-100 text-xs">🔥 Donde Kuyu Grill</div>
            </div>

            {/* More navigation items */}
            <div className="flex-1 overflow-y-auto py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 mb-2">
                Secciones
              </p>
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowDrawer(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3.5 text-sm font-medium ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}

              {/* Divider */}
              <div className="mx-5 my-3 border-t border-gray-100" />

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 mb-2">
                Navegación principal
              </p>
              {BOTTOM_NAV.filter((n) => n.to !== '/pedidos/nuevo').map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setShowDrawer(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3.5 text-sm font-medium ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 p-5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 text-red-500 text-sm font-medium py-2"
              >
                <span className="text-lg">🚪</span>
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
