import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [pilots, setPilots] = useState([]);
  const [filters, setFilters] = useState({ vehicle_id: '', pilot_id: '', date_from: '', date_to: '', status: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    try {
      const r = await api.get(`/usage/history?${params}`);
      setRecords(r.data);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    if (user?.role !== 'PILOT') {
      api.get('/vehicles').then(r => setVehicles(r.data));
      api.get('/users').then(r => setPilots(r.data.filter(u => u.role === 'PILOT')));
    }
    load();
  }, [load, user]);

  const f = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Historial de usos</h1>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{records.length} registros</div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div className="filters">
          {user?.role !== 'PILOT' && (
            <select value={filters.pilot_id} onChange={e => f('pilot_id', e.target.value)} style={{ minWidth: 160 }}>
              <option value="">Todos los pilotos</option>
              {pilots.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          )}
          {user?.role !== 'PILOT' && (
            <select value={filters.vehicle_id} onChange={e => f('vehicle_id', e.target.value)} style={{ minWidth: 160 }}>
              <option value="">Todos los vehículos</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          )}
          <input type="date" value={filters.date_from} onChange={e => f('date_from', e.target.value)} title="Desde" style={{ minWidth: 140 }} />
          <input type="date" value={filters.date_to} onChange={e => f('date_to', e.target.value)} title="Hasta" style={{ minWidth: 140 }} />
          <select value={filters.status} onChange={e => f('status', e.target.value)} style={{ minWidth: 130 }}>
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="closed">Cerrado</option>
          </select>
          <button className="btn-secondary btn-sm" onClick={() => setFilters({ vehicle_id: '', pilot_id: '', date_from: '', date_to: '', status: '' })}>
            Limpiar
          </button>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                {user?.role !== 'PILOT' && <th>Piloto</th>}
                <th>Placa</th>
                <th>Ruta</th>
                <th>KM inicial</th>
                <th>KM final</th>
                <th>Recorrido</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {records.map(u => (
                <tr key={u.id}>
                  {user?.role !== 'PILOT' && <td style={{ color: 'var(--text)', fontWeight: 500 }}>{u.pilot_name}</td>}
                  <td><span className="badge badge-blue">{u.plate}</span></td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.route}>{u.route}</td>
                  <td>{u.km_start?.toLocaleString()} km</td>
                  <td>{u.km_end != null ? u.km_end.toLocaleString() + ' km' : '—'}</td>
                  <td>
                    {u.km_traveled != null ? (
                      <span style={{ color: u.km_suspicious ? 'var(--yellow)' : 'var(--text2)' }}>
                        {u.km_traveled.toLocaleString()} km {u.km_suspicious && '⚠️'}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>{new Date(u.checkin_at).toLocaleString('es')}</td>
                  <td style={{ fontSize: 12 }}>{u.checkout_at ? new Date(u.checkout_at).toLocaleString('es') : '—'}</td>
                  <td><span className={`badge ${u.status === 'active' ? 'badge-yellow' : 'badge-green'}`}>{u.status === 'active' ? 'Activo' : 'Cerrado'}</span></td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
