import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const MAIN_NAV: NavItem[] = [
  { to: '/', icon: '🏠', label: 'Inicio' },
  { to: '/pedidos', icon: '📋', label: 'Pedidos' },
  { to: '/clientes', icon: '👥', label: 'Clientes' },
];

const ADMIN_MAIN_NAV: NavItem[] = [
  { to: '/compras', icon: '🛒', label: 'Compras' },
  { to: '/ganancias', icon: '📈', label: 'Ganancias' },
  { to: '/inventario', icon: '📦', label: 'Inventario' },
];

const ADMIN_SECONDARY_NAV: NavItem[] = [
  { to: '/productos', icon: '🍖', label: 'Productos' },
  { to: '/materia-prima', icon: '🥬', label: 'Materia Prima' },
  { to: '/reportes', icon: '📊', label: 'Reportes' },
];

const BOTTOM_NAV: NavItem[] = [
  { to: '/', icon: '🏠', label: 'Inicio' },
  { to: '/pedidos', icon: '📋', label: 'Pedidos' },
  { to: '/pedidos/nuevo', icon: '➕', label: 'Nuevo' },
  { to: '/clientes', icon: '👥', label: 'Clientes' },
];

function SidebarNavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? 'bg-orange-50 text-orange-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      <span className="text-lg leading-none">{item.icon}</span>
      {item.label}
    </NavLink>
  );
}

export default function Layout() {
  const [showDrawer, setShowDrawer] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-100 z-20">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-orange-600 text-sm leading-tight">Donde Kuyu Grill</p>
              <p className="text-gray-400 text-xs">Gestión de ventas</p>
            </div>
          </div>
        </div>

        {/* New order CTA */}
        <div className="px-4 py-4">
          <Link
            to="/pedidos/nuevo"
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm shadow-orange-200"
          >
            <span>➕</span> Nuevo pedido
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 mb-1 mt-1">Principal</p>
          {MAIN_NAV.map((item) => (
            <SidebarNavLink key={item.to} item={item} />
          ))}
          {isAdmin && ADMIN_MAIN_NAV.map((item) => (
            <SidebarNavLink key={item.to} item={item} />
          ))}

          {isAdmin && (
            <>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 mb-1 mt-4">Administración</p>
              {ADMIN_SECONDARY_NAV.map((item) => (
                <SidebarNavLink key={item.to} item={item} />
              ))}
            </>
          )}
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT (offset by sidebar on desktop) ── */}
      <div className="flex flex-col flex-1 min-h-screen lg:pl-64">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-orange-600 text-sm">Donde Kuyu Grill</span>
          </div>
          <button
            onClick={() => setShowDrawer(true)}
            className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold"
          >
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="max-w-4xl mx-auto lg:py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30">
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
          <button
            onClick={() => setShowDrawer(true)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-400"
          >
            <span className="text-xl">☰</span>
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowDrawer(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col lg:hidden">
            <div className="bg-orange-500 px-5 py-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-white font-bold text-base">{user?.name ?? 'Usuario'}</p>
                  <p className="text-orange-100 text-xs mt-0.5">{user?.email}</p>
                  <span className="text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
                    {user?.role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </span>
                </div>
                <button onClick={() => setShowDrawer(false)} className="text-orange-200 text-2xl leading-none">×</button>
              </div>
              <div className="text-orange-100 text-xs">🔥 Donde Kuyu Grill</div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {isAdmin && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 mb-2">Gestión</p>
                  {[...ADMIN_MAIN_NAV, ...ADMIN_SECONDARY_NAV].map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowDrawer(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-5 py-3.5 text-sm font-medium ${
                          isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                  <div className="mx-5 my-3 border-t border-gray-100" />
                </>
              )}
            </div>

            <div className="border-t border-gray-100 p-5">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 text-red-500 text-sm font-medium py-2">
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
