import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, KeyRound, CheckCircle, ClipboardList, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPilot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeUsage, setActiveUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/usage/my-active'), api.get('/usage/history')])
      .then(([a, h]) => { setActiveUsage(a.data); setHistory(h.data.slice(0, 3)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>Hola, {user?.full_name?.split(' ')[0]} 👋</h1>
      </div>

      {/* MAIN ACTION — always first */}
      {!activeUsage ? (
        <button onClick={() => navigate('/checkin')} className="btn-primary"
          style={{ width: '100%', padding: '24px 20px', fontSize: 20, fontWeight: 800, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, background: 'var(--accent)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <KeyRound size={24} />
            </div>
            Tomar un vehículo
          </span>
          <ArrowRight size={24} />
        </button>
      ) : (
        <div style={{ background: 'var(--accent-light)', border: '2px solid var(--accent)', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--accent2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Vehículo activo</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 2 }}>{activeUsage.plate}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{activeUsage.route}</div>
            </div>
            <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={28} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
            Desde: {new Date(activeUsage.checkin_at).toLocaleString('es')}
          </div>
          <button onClick={() => navigate('/checkin')} className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Flag size={16} /> Entregar vehículo
          </button>
        </div>
      )}

      {/* Status card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            {activeUsage ? <Truck size={22} color="var(--accent)" /> : <CheckCircle size={22} color="var(--green)" />}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Estado</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: activeUsage ? 'var(--accent2)' : 'var(--green)', marginTop: 2 }}>
            {activeUsage ? 'En ruta' : 'Disponible'}
          </div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <ClipboardList size={22} color="var(--text3)" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>Viajes totales</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{history.length + (activeUsage ? 1 : 0)}</div>
        </div>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Últimos viajes</div>
            <button onClick={() => navigate('/history')} className="btn-icon" style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver todo <ArrowRight size={13} />
            </button>
          </div>
          {history.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.plate}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{u.route?.slice(0, 40)}{u.route?.length > 40 ? '...' : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{u.km_traveled ? u.km_traveled.toLocaleString() + ' km' : '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(u.checkin_at).toLocaleDateString('es')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Flag({ size, color }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}
