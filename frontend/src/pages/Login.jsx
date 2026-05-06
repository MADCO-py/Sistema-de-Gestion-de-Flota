import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/common/Logo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Usuario o contraseña incorrectos'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

      {/* Panel izquierdo — visible solo en desktop via CSS */}
      <div className="login-left-panel">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 48, position: 'relative', zIndex: 1 }}>
          <Logo size={160} style={{ marginBottom: 32 }} />
          <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', textAlign: 'center' }}>
            Fleet<span style={{ color: 'var(--accent)' }}>Control</span>
          </div>
          <div style={{ color: 'var(--text3)', fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 1.6 }}>
            Sistema de gestión de flota vehicular
          </div>
        </div>
        {/* Decoración */}
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(220,38,38,0.08)', top: -120, right: -120, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', border: '1px solid rgba(220,38,38,0.05)', bottom: -80, left: -80, pointerEvents: 'none', zIndex: 0 }} />
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <Logo size={72} />
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px' }}>
              Fleet<span style={{ color: 'var(--accent)' }}>Control</span>
            </h1>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 6 }}>Inicia sesión para continuar</p>
          </div>

          <div className="card" style={{ border: '1px solid var(--border2)' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Usuario</label>
                <input type="text" placeholder="Tu usuario" value={username}
                  onChange={e => setUsername(e.target.value)} autoFocus required
                  style={{ fontSize: 16, padding: '12px 14px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: error ? 8 : 20 }}>
                <label>Contraseña</label>
                <input type="password" placeholder="Tu contraseña" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  style={{ fontSize: 16, padding: '12px 14px' }} />
              </div>
              {error && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, color: 'var(--red)', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button type="submit" className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10 }}
                disabled={loading}>
                <LogIn size={18} /> {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>

          <div style={{ marginTop: 16, padding: 14, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
            <strong style={{ color: 'var(--text2)' }}>Demo</strong> — contraseña: <code style={{ color: 'var(--accent2)' }}>Admin1234!</code>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[['host','HOST'],['admin','ADMIN'],['pilot1','PILOTO']].map(([u, r]) => (
                <button key={u} type="button" className="btn-secondary btn-sm"
                  onClick={() => { setUsername(u); setPassword('Admin1234!'); }}>
                  {u} <span style={{ color: 'var(--text3)', fontSize: 10 }}>({r})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
