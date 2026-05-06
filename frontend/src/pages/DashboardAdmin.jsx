import { useState, useEffect } from 'react';
import { Truck, Users, AlertTriangle, Activity } from 'lucide-react';
import api from '../services/api';

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/dashboard')
      .then(r => setStats(r.data))
      .catch(e => setError(e.response?.data?.error || 'Error al cargar dashboard'));
    api.get('/usage/history?status=closed')
      .then(r => setRecent(r.data.slice(0, 10)))
      .catch(() => {});
  }, []);

  if (error) return <div style={{ color: 'var(--red)', padding: 20 }}>{error}</div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Dashboard</h1></div>
      <div className="stat-grid">
        {[
          { label: 'Disponibles', value: stats?.vehicles?.available ?? '—', color: 'var(--green)', icon: <Truck size={18} color="var(--green)" /> },
          { label: 'En uso ahora', value: stats?.vehicles?.in_use ?? '—', color: 'var(--yellow)', icon: <Activity size={18} color="var(--yellow)" /> },
          { label: 'Pilotos', value: stats?.users?.pilots ?? '—', color: 'var(--text)', icon: <Users size={18} color="var(--text2)" /> },
          { label: 'Alertas', value: stats?.unread_alerts ?? '—', color: 'var(--red)', icon: <AlertTriangle size={18} color="var(--red)" /> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="stat-label">{s.label}</div>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Últimos usos registrados</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Piloto</th><th>Placa</th><th>Ruta</th><th>KM</th><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>
              {recent.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text)' }}>{u.pilot_name}</td>
                  <td><span className="badge badge-blue">{u.plate}</span></td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.route}</td>
                  <td>{u.km_traveled ? u.km_traveled.toLocaleString() + ' km' : '—'}</td>
                  <td>{new Date(u.checkin_at).toLocaleDateString('es')}</td>
                  <td>{u.km_suspicious ? <span className="badge badge-yellow">Sospechoso</span> : <span className="badge badge-green">Normal</span>}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Sin registros</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
