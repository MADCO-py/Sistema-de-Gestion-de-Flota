import { useState, useEffect } from 'react';
import { Download, Truck, Users, Activity, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Reports() {
  const [vehicles, setVehicles] = useState([]);
  const [pilots, setPilots] = useState([]);
  const [filters, setFilters] = useState({ vehicle_id: '', pilot_id: '', date_from: '', date_to: '' });
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  useEffect(() => {
    api.get('/vehicles').then(r => setVehicles(r.data));
    api.get('/users').then(r => setPilots(r.data.filter(u => u.role === 'PILOT')));
    api.get('/reports/dashboard').then(r => setStats(r.data));
  }, []);

  const f = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));

  const handleExport = async () => {
    setExporting(true); setExportMsg('');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    try {
      const token = localStorage.getItem('fc_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `reporte_flota_${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setExportMsg('Reporte exportado correctamente');
    } catch (err) { setExportMsg('Error: ' + (err.message || 'No se pudo exportar')); }
    finally { setExporting(false); }
  };

  const statCards = stats ? [
    { label: 'Total vehículos', value: stats.vehicles?.total, color: 'var(--accent)', icon: <Truck size={18} color="#3b82f6" /> },
    { label: 'Disponibles', value: stats.vehicles?.available, color: 'var(--green)', icon: <Truck size={18} color="#22c55e" /> },
    { label: 'En uso', value: stats.vehicles?.in_use, color: 'var(--yellow)', icon: <Activity size={18} color="#eab308" /> },
    { label: 'Pilotos', value: stats.users?.pilots, color: 'var(--text)', icon: <Users size={18} color="#94a3b8" /> },
    { label: 'Alertas activas', value: stats.unread_alerts, color: 'var(--red)', icon: <AlertTriangle size={18} color="#ef4444" /> },
  ] : [];

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reportes</h1></div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><div className="stat-label">{s.label}</div>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={16} /> Exportar reporte CSV
        </div>
        <div className="filters" style={{ marginBottom: 16 }}>
          <select value={filters.pilot_id} onChange={e => f('pilot_id', e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Todos los pilotos</option>
            {pilots.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <select value={filters.vehicle_id} onChange={e => f('vehicle_id', e.target.value)} style={{ minWidth: 160 }}>
            <option value="">Todos los vehículos</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
          </select>
          <div>
            <label style={{ margin: 0, marginBottom: 4 }}>Desde</label>
            <input type="date" value={filters.date_from} onChange={e => f('date_from', e.target.value)} />
          </div>
          <div>
            <label style={{ margin: 0, marginBottom: 4 }}>Hasta</label>
            <input type="date" value={filters.date_to} onChange={e => f('date_to', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-primary" onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> {exporting ? 'Exportando...' : 'Descargar CSV'}
          </button>
          {exportMsg && <span style={{ fontSize: 13, color: exportMsg.startsWith('Error') ? 'var(--red)' : 'var(--green)' }}>{exportMsg}</span>}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>Incluye: piloto, placa, ruta, km inicial/final, recorrido, fechas y alertas de km sospechoso.</div>
      </div>
    </div>
  );
}
