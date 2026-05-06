import { useState, useEffect } from 'react';
import { Truck, Users, AlertTriangle, Activity, MapPin } from 'lucide-react';
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
          { label: 'Vehículos totales', value: stats?.vehicles?.total || 0, color: 'var(--accent)', icon: <Truck size={18} color="#3b82f6" /> },
          { label: 'Disponibles', value: stats?.vehicles?.available || 0, color: 'var(--green)', icon: <Truck size={18} color="#22c55e" /> },
          { label: 'En uso', value: stats?.vehicles?.in_use || 0, color: 'var(--yellow)', icon: <Activity size={18} color="#eab308" /> },
          { label: 'Pilotos activos', value: stats?.users?.pilots || 0, color: 'var(--text)', icon: <Users size={18} color="#94a3b8" /> },
          { label: 'Alertas sin leer', value: stats?.unread_alerts || 0, color: stats?.unread_alerts > 0 ? 'var(--red)' : 'var(--text)', icon: <AlertTriangle size={18} color={stats?.unread_alerts > 0 ? '#ef4444' : '#64748b'} /> },
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

      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#3b82f6" /> Usos activos ahora
        </div>
        {activeUsages.length === 0 ? (
          <div className="empty-state">Sin vehículos en uso actualmente</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Piloto</th><th>Vehículo</th><th>Ruta</th><th>KM inicial</th><th>Desde</th></tr></thead>
              <tbody>
                {activeUsages.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{u.pilot_name}</td>
                    <td><span className="badge badge-blue">{u.plate}</span> <span style={{ color: 'var(--text3)', fontSize: 12 }}>{u.type}</span></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} style={{ flexShrink: 0 }} />{u.route}</span>
                    </td>
                    <td>{u.km_start?.toLocaleString()} km</td>
                    <td>{new Date(u.checkin_at).toLocaleString('es')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
