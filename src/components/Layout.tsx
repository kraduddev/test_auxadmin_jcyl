import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, PlayCircle, Trophy, BarChart3 } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>TestApp Pro</h2>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/select" className={({ isActive }) => isActive ? 'active' : ''}>
              <CheckSquare size={20} />
              <span>Select Test</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/execute" className={({ isActive }) => isActive ? 'active' : ''}>
              <PlayCircle size={20} />
              <span>Execute Test</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/results" className={({ isActive }) => isActive ? 'active' : ''}>
              <Trophy size={20} />
              <span>Results</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/statistics" className={({ isActive }) => isActive ? 'active' : ''}>
              <BarChart3 size={20} />
              <span>Statistics</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
