import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'var(--accent-light)', borderRadius: 16, marginBottom: 16 }}>
            <Truck size={28} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>FleetControl</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>Sistema de gestión de flota vehicular</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Usuario</label>
              <input type="text" placeholder="Ingresa tu usuario" value={username}
                onChange={e => setUsername(e.target.value)} autoFocus required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="Ingresa tu contraseña" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--text2)' }}>Usuarios de prueba</strong> — contraseña: <code style={{ color: 'var(--accent)' }}>Admin1234!</code>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['host','HOST'],['admin','ADMIN'],['pilot1','PILOT']].map(([u,r]) => (
              <button key={u} type="button" className="btn-secondary btn-sm"
                onClick={() => { setUsername(u); setPassword('Admin1234!'); }}>
                {u} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({r})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
