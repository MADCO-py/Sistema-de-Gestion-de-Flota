import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AlertBell from './AlertBell';
import { useState } from 'react';
import {
  LayoutDashboard, Truck, Users, ClipboardList,
  BarChart2, ScrollText, KeyRound, LogOut, Menu, X
} from 'lucide-react';

const navItems = {
  HOST:  [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/vehicles', label: 'Vehículos', icon: Truck },
    { to: '/users', label: 'Usuarios', icon: Users },
    { to: '/history', label: 'Historial', icon: ClipboardList },
    { to: '/reports', label: 'Reportes', icon: BarChart2 },
    { to: '/logs', label: 'Logs', icon: ScrollText },
  ],
  ADMIN: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/users', label: 'Usuarios', icon: Users },
    { to: '/history', label: 'Historial', icon: ClipboardList },
    { to: '/reports', label: 'Reportes', icon: BarChart2 },
  ],
  PILOT: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/checkin', label: 'Check-in/out', icon: KeyRound },
    { to: '/history', label: 'Mi historial', icon: ClipboardList },
  ],
};

const roleColors = { HOST: '#8b5cf6', ADMIN: '#3b82f6', PILOT: '#22c55e' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navItems[user?.role] || [];
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: 56, gap: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', whiteSpace: 'nowrap', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={20} color="#3b82f6" />
          FleetControl
        </div>

        <div className="hide-mobile" style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--text)' : 'var(--text3)',
                background: isActive ? 'var(--bg3)' : 'transparent',
                whiteSpace: 'nowrap', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              })}>
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertBell />
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name}</span>
            <span className="badge" style={{ background: roleColors[user?.role] + '22', color: roleColors[user?.role], fontSize: 11 }}>
              {user?.role}
            </span>
          </div>
          <button className="btn-sm btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <LogOut size={13} /> Salir
          </button>
          <button className="btn-icon" style={{ display: menuOpen ? 'flex' : undefined }}
            onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 0' }}>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', fontSize: 14,
                color: isActive ? 'var(--accent)' : 'var(--text2)', textDecoration: 'none',
              })}>
              <item.icon size={15} />{item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
