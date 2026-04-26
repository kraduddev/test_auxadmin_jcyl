import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  PlayCircle,
  Trophy,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { to: '/',           label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/select',     label: 'Seleccionar',   icon: CheckSquare },
  { to: '/execute',    label: 'Ejecutar Test', icon: PlayCircle },
  { to: '/results',    label: 'Resultados',    icon: Trophy },
  { to: '/statistics', label: 'Estadísticas',  icon: BarChart3 },
];

const Layout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Cerrar el drawer en cualquier cambio de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Bloquear scroll del body cuando el drawer está abierto en móvil
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className="app-container">
      {/* ---- Barra superior (solo visible en móvil / tablet) ---- */}
      <header className="mobile-header">
        <span className="mobile-header-title">JCyL AuxAdmin</span>
        <button
          className="hamburger-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ---- Overlay que cierra el drawer al tocar fuera ---- */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ---- Sidebar / Drawer ---- */}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Menú principal">
        <div className="sidebar-header">
          <h2>JCyL AuxAdmin</h2>
          {/* Botón cerrar (solo visible en móvil) */}
          <button
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="nav-links">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---- Contenido principal ---- */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
