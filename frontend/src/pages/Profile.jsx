import { useState, useEffect } from 'react';
import { UserCircle, Lock, Save, CheckCircle, AlertTriangle, Phone, Mail, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = { ADMIN: 'Administrador de sistema', HOST: 'Host / Dueño', PILOT: 'Piloto' };
const ROLE_COLORS = { ADMIN: '#8b5cf6', HOST: '#3b82f6', PILOT: '#22c55e' };

export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Formulario datos
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  // Formulario contraseña
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    api.get('/me').then(r => {
      setProfile(r.data);
      setForm({ full_name: r.data.full_name, email: r.data.email || '', phone: r.data.phone || '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveInfo = async (e) => {
    e.preventDefault(); setSaving(true); setMsg({ type: '', text: '' });
    try {
      await api.put('/me', { full_name: form.full_name, email: form.email, phone: form.phone });
      setMsg({ type: 'success', text: 'Información actualizada correctamente' });
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Error al guardar' }); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setMsg({ type: '', text: '' });
    if (pwForm.new_password !== pwForm.confirm_password) {
      setMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden' }); return;
    }
    if (pwForm.new_password.length < 6) {
      setMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' }); return;
    }
    setSaving(true);
    try {
      await api.put('/me', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setMsg({ type: 'success', text: 'Contraseña cambiada. Inicia sesión nuevamente.' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => { logout(); window.location.href = '/login'; }, 2000);
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Error al cambiar contraseña' }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Mi perfil</h1>
      </div>

      {/* Mensaje */}
      {msg.text && (
        <div style={{
          background: msg.type === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${msg.type === 'success' ? '#15803d' : 'var(--red)'}`,
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20,
          color: msg.type === 'success' ? 'var(--green)' : 'var(--red)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
        }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Header usuario */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: ROLE_COLORS[profile?.role] + '22', border: `2px solid ${ROLE_COLORS[profile?.role]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UserCircle size={36} color={ROLE_COLORS[profile?.role]} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{profile?.full_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>@{profile?.username}</div>
          <span className="badge" style={{ marginTop: 6, background: ROLE_COLORS[profile?.role] + '22', color: ROLE_COLORS[profile?.role], fontSize: 11 }}>
            {ROLE_LABELS[profile?.role]}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Miembro desde</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserCircle size={18} color="var(--accent2)" /> Información personal
        </div>
        <form onSubmit={handleSaveInfo}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required style={{ fontSize: 16 }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={12} /> Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" style={{ fontSize: 16 }} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} /> Teléfono</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="502 1234 5678" style={{ fontSize: 16 }} />
            </div>
          </div>
          {/* DPI solo lectura */}
          {profile?.dpi && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CreditCard size={12} /> DPI</label>
              <input value={profile.dpi} disabled style={{ opacity: 0.5, fontFamily: 'monospace', fontSize: 16 }} />
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: 15 }}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} color="var(--accent2)" /> Cambiar contraseña
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Contraseña actual *</label>
            <input type="password" value={pwForm.current_password}
              onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
              required placeholder="Tu contraseña actual" style={{ fontSize: 16 }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Nueva contraseña *</label>
              <input type="password" value={pwForm.new_password}
                onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                required placeholder="Mínimo 6 caracteres" style={{ fontSize: 16 }} />
            </div>
            <div className="form-group">
              <label>Confirmar contraseña *</label>
              <input type="password" value={pwForm.confirm_password}
                onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                required placeholder="Repite la nueva contraseña" style={{ fontSize: 16 }}
                style={{ fontSize: 16, borderColor: pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password ? 'var(--red)' : undefined }} />
              {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <div className="error-msg">Las contraseñas no coinciden</div>
              )}
            </div>
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text3)' }}>
            ⚠️ Al cambiar tu contraseña serás redirigido al login automáticamente.
          </div>
          <button type="submit" className="btn-primary" disabled={saving || (pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', fontSize: 15 }}>
            <Lock size={16} /> {saving ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
