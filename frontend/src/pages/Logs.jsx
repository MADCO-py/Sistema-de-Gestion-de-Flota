import { useState, useEffect } from 'react';
import { Search, LogIn, Plus, Pencil, Trash2, KeyRound, ShieldAlert } from 'lucide-react';
import api from '../services/api';

const ACTION_META = {
  LOGIN:          { color: 'badge-green',  icon: <LogIn size={11} /> },
  CHECKIN:        { color: 'badge-blue',   icon: <KeyRound size={11} /> },
  CHECKOUT:       { color: 'badge-blue',   icon: <KeyRound size={11} /> },
  CREATE_USER:    { color: 'badge-yellow', icon: <Plus size={11} /> },
  UPDATE_USER:    { color: 'badge-yellow', icon: <Pencil size={11} /> },
  DELETE_USER:    { color: 'badge-red',    icon: <Trash2 size={11} /> },
  CREATE_VEHICLE: { color: 'badge-yellow', icon: <Plus size={11} /> },
  UPDATE_VEHICLE: { color: 'badge-yellow', icon: <Pencil size={11} /> },
  DELETE_VEHICLE: { color: 'badge-red',    icon: <Trash2 size={11} /> },
  ADMIN_VERIFY:   { color: 'badge-red',    icon: <ShieldAlert size={11} /> },
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/reports/logs?limit=200').then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    (l.username||'').toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.entity||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Logs del sistema</h1>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{filtered.length} entradas</div>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 350 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        <input placeholder="Filtrar por usuario, acción..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>IP</th></tr></thead>
            <tbody>
              {filtered.map(l => {
                const meta = ACTION_META[l.action] || { color: 'badge-gray', icon: null };
                return (
                  <tr key={l.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString('es')}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{l.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.username}</div>
                    </td>
                    <td>
                      <span className={`badge ${meta.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {meta.icon}{l.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {l.entity && <span style={{ color: 'var(--text2)' }}>{l.entity}</span>}
                      {l.details && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{JSON.stringify(l.details)}</div>}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{l.ip_address || '—'}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Sin logs</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
