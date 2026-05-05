import { Outlet, NavLink } from 'react-router-dom';
import { Map, List, CheckSquare } from 'lucide-react';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout-container">
      <main className="main-content">
        <Outlet />
      </main>
      
      <nav className="bottom-nav glass-panel">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Map size={24} />
          <span>지도</span>
        </NavLink>
        <NavLink to="/list" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <List size={24} />
          <span>목록/비교</span>
        </NavLink>
        <NavLink to="/checklist" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={24} />
          <span>체크리스트</span>
        </NavLink>
      </nav>
    </div>
  );
}
