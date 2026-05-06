import { useState, useEffect } from 'react';
import { Truck, Users, AlertTriangle, Activity, MapPin, Phone, CreditCard } from 'lucide-react';
import api from '../services/api';

export default function DashboardHost() {
  const [stats, setStats] = useState(null);
  const [activeUsages, setActiveUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/reports/dashboard'), api.get('/usage/active')])
      .then(([s, u]) => { setStats(s.data); setActiveUsages(u.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{new Date().toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="stat-grid">
        {[
          { label: 'Total vehículos', value: stats?.vehicles?.total || 0, color: 'var(--accent2)', icon: <Truck size={18} color="var(--accent2)" /> },
          { label: 'Disponibles', value: stats?.vehicles?.available || 0, color: 'var(--green)', icon: <Truck size={18} color="var(--green)" /> },
          { label: 'En uso ahora', value: stats?.vehicles?.in_use || 0, color: 'var(--yellow)', icon: <Activity size={18} color="var(--yellow)" /> },
          { label: 'Pilotos activos', value: stats?.users?.pilots || 0, color: 'var(--text)', icon: <Users size={18} color="var(--text2)" /> },
          { label: 'Alertas', value: stats?.unread_alerts || 0, color: stats?.unread_alerts > 0 ? 'var(--red)' : 'var(--text)', icon: <AlertTriangle size={18} color={stats?.unread_alerts > 0 ? 'var(--red)' : 'var(--text3)'} /> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-label">{s.label}</div>
              {s.icon}
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Active usages — main info */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="var(--accent)" /> Vehículos en uso ahora
          <span style={{ marginLeft: 'auto', background: activeUsages.length ? 'var(--accent)' : 'var(--bg3)', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 99, padding: '2px 10px' }}>{activeUsages.length}</span>
        </div>

        {activeUsages.length === 0 ? (
          <div className="empty-state">Sin vehículos en uso actualmente</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeUsages.map(u => (
              <div key={u.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  {/* Vehicle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck size={20} color="var(--accent2)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>{u.plate}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.brand} {u.model} — {u.type}</div>
                    </div>
                  </div>
                  {/* Time */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Desde</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{new Date(u.checkin_at).toLocaleString('es')}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {/* Pilot name */}
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Piloto</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.pilot_name}</div>
                  </div>
                  {/* DPI */}
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}><CreditCard size={9} /> DPI</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'monospace' }}>{u.pilot_dpi || '—'}</div>
                  </div>
                  {/* Phone */}
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={9} /> Teléfono</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{u.pilot_phone || '—'}</div>
                  </div>
                </div>

                {/* Route */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: 'var(--text2)' }}>
                  <MapPin size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--accent2)' }} />
                  <span>{u.route}</span>
                </div>

                {/* KM */}
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                  KM inicial: <strong style={{ color: 'var(--text2)' }}>{u.km_start?.toLocaleString()} km</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
