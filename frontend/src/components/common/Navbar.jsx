import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AlertBell from './AlertBell';
import Logo from './Logo';
import { useState } from 'react';
import { LayoutDashboard, Truck, Users, ClipboardList, BarChart2, ScrollText, KeyRound, LogOut, Menu, X, Camera, UserCircle } from 'lucide-react';

const navItems = {
  ADMIN: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/vehicles', label: 'Vehículos', icon: Truck },
    { to: '/users', label: 'Usuarios', icon: Users },
    { to: '/vehicle-photos', label: 'Fotos', icon: Camera },
    { to: '/history', label: 'Historial', icon: ClipboardList },
    { to: '/reports', label: 'Reportes', icon: BarChart2 },
    { to: '/logs', label: 'Logs', icon: ScrollText },
  ],
  HOST: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/vehicles', label: 'Vehículos', icon: Truck },
    { to: '/users', label: 'Usuarios', icon: Users },
    { to: '/vehicle-photos', label: 'Fotos', icon: Camera },
    { to: '/history', label: 'Historial', icon: ClipboardList },
    { to: '/reports', label: 'Reportes', icon: BarChart2 },
    { to: '/logs', label: 'Logs', icon: ScrollText },
  ],
  PILOT: [
    { to: '/', label: 'Inicio', icon: LayoutDashboard, exact: true },
    { to: '/checkin', label: 'Check-in/out', icon: KeyRound },
    { to: '/history', label: 'Mi historial', icon: ClipboardList },
  ],
};

const ROLE_COLOR = { ADMIN: '#8b5cf6', HOST: '#3b82f6', PILOT: '#22c55e' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = navItems[user?.role] || [];
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', height: 54, gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Logo size={30} />
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px' }}>
            Fleet<span style={{ color: 'var(--accent)' }}>Control</span>
          </span>
        </div>

        <div className="hide-mobile" style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({
                padding: '6px 11px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--text)' : 'var(--text3)',
                background: isActive ? 'var(--bg3)' : 'transparent',
                whiteSpace: 'nowrap', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              })}>
              <item.icon size={13} />{item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertBell />
          {/* Mi perfil */}
          <button onClick={() => navigate('/profile')} className="btn-icon" title="Mi perfil"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserCircle size={18} />
          </button>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{user?.full_name}</span>
            <span className="badge" style={{ fontSize: 10, background: ROLE_COLOR[user?.role] + '22', color: ROLE_COLOR[user?.role] }}>{user?.role}</span>
          </div>
          <button className="btn-sm btn-secondary" onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <LogOut size={13} /> Salir
          </button>
          <button className="btn-icon" onClick={() => setMenuOpen(o => !o)}>
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
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', fontSize: 15,
                color: isActive ? 'var(--accent2)' : 'var(--text2)', textDecoration: 'none',
              })}>
              <item.icon size={17} />{item.label}
            </NavLink>
          ))}
          <div onClick={() => { navigate('/profile'); setMenuOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', fontSize: 15, color: 'var(--text2)', cursor: 'pointer' }}>
            <UserCircle size={17} /> Mi perfil
          </div>
        </div>
      )}
    </nav>
  );
}
