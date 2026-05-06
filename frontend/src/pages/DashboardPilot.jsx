import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, KeyRound, CheckCircle, AlertTriangle, Wrench, Bell } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPilot() {
  const { user } = useAuth();
  const [activeUsage, setActiveUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/usage/my-active'), api.get('/usage/history'), api.get('/alerts')])
      .then(([a, h, al]) => {
        setActiveUsage(a.data);
        setHistory(h.data.slice(0, 5));
        setAlerts(al.data.filter(x => !x.is_read).slice(0, 5));
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const alertIcon = { maintenance: <Wrench size={14} />, suspicious_km: <AlertTriangle size={14} />, info: <Bell size={14} /> };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bienvenido, {user?.full_name?.split(' ')[0]}</h1>
      </div>

      {activeUsage ? (
        <div style={{ background: 'var(--yellow-bg)', border: '1px solid #713f12', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={16} /> Vehículo activo
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
              {activeUsage.plate} — {activeUsage.route} — Desde {new Date(activeUsage.checkin_at).toLocaleString('es')}
            </div>
          </div>
          <Link to="/checkin"><button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><KeyRound size={14} /> Hacer Check-out</button></Link>
        </div>
      ) : (
        <div style={{ background: 'var(--green-bg)', border: '1px solid #14532d', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={16} /> Sin vehículo activo. Listo para usar uno.
          </div>
          <Link to="/checkin"><button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><KeyRound size={14} /> Hacer Check-in</button></Link>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} color="#eab308" /> Alertas pendientes</div>
          {alerts.map(a => (
            <div key={a.id} className={`alert-item alert-${a.type}`}>
              <span style={{ flexShrink: 0, marginTop: 2 }}>{alertIcon[a.type] || <Bell size={14} />}</span>
              <div>
                <div style={{ fontSize: 13 }}>{a.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{new Date(a.created_at).toLocaleString('es')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>Últimos usos</div>
          <Link to="/history" style={{ fontSize: 13 }}>Ver todo →</Link>
        </div>
        {history.length === 0 ? (
          <div className="empty-state">Sin historial de usos</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Vehículo</th><th>Ruta</th><th>KM</th><th>Fecha</th><th>Estado</th></tr></thead>
              <tbody>
                {history.map(u => (
                  <tr key={u.id}>
                    <td><span className="badge badge-blue">{u.plate}</span></td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.route}</td>
                    <td>{u.km_traveled != null ? u.km_traveled.toLocaleString() + ' km' : '—'}</td>
                    <td>{new Date(u.checkin_at).toLocaleDateString('es')}</td>
                    <td><span className={`badge ${u.status === 'active' ? 'badge-yellow' : 'badge-green'}`}>{u.status === 'active' ? 'Activo' : 'Cerrado'}</span></td>
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
