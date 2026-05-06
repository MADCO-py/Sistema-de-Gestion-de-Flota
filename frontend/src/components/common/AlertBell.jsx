import { useState, useEffect, useRef } from 'react';
import { Bell, Wrench, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import api from '../../services/api';

const TYPE_ICON = {
  maintenance: <Wrench size={14} color="#eab308" />,
  suspicious_km: <AlertTriangle size={14} color="#ef4444" />,
  no_checkout: <AlertTriangle size={14} color="#f97316" />,
  info: <Info size={14} color="#3b82f6" />,
};

export default function AlertBell() {
  const [count, setCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const fetchCount = async () => {
    try { const r = await api.get('/alerts/unread-count'); setCount(r.data.count); } catch {}
  };
  const fetchAlerts = async () => {
    try { const r = await api.get('/alerts'); setAlerts(r.data); } catch {}
  };

  useEffect(() => {
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => { setOpen(o => !o); if (!open) fetchAlerts(); };

  const markRead = async (id) => {
    await api.put(`/alerts/${id}/read`);
    setAlerts(a => a.map(x => x.id === id ? { ...x, is_read: true } : x));
    setCount(c => Math.max(0, c - 1));
  };

  const markAll = async () => {
    await api.put('/alerts/mark-all-read');
    setAlerts(a => a.map(x => ({ ...x, is_read: true })));
    setCount(0);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn-icon" onClick={handleOpen} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={18} />
        {count > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '99px', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', width: 340, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 200, maxHeight: 420, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Alertas</span>
            {count > 0 && (
              <button className="btn-sm btn-secondary" onClick={markAll} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <CheckCheck size={12} /> Marcar todas
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {alerts.length === 0 && <div className="empty-state" style={{ padding: 24 }}>Sin alertas</div>}
            {alerts.map(a => (
              <div key={a.id} onClick={() => !a.is_read && markRead(a.id)}
                style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: a.is_read ? 'default' : 'pointer', background: a.is_read ? 'transparent' : 'var(--accent-light)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[a.type] || <Info size={14} />}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{a.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{new Date(a.created_at).toLocaleString('es')}</div>
                  </div>
                  {!a.is_read && <span style={{ width: 7, height: 7, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
