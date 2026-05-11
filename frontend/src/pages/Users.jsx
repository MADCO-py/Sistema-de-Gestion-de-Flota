import { useState, useEffect } from 'react';
import { Plus, Pencil, UserCheck, UserX, Search, Phone, CreditCard, Shield } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = { ADMIN: 'Admin', HOST: 'Host', PILOT: 'Piloto' };
const ROLE_COLORS = { ADMIN: 'badge-red', HOST: 'badge-blue', PILOT: 'badge-green' };
const emptyForm = { username: '', password: '', full_name: '', dpi: '', phone: '', role: 'PILOT' };

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => { setLoading(true); api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (u) => {
    setForm({ username: u.username, password: '', full_name: u.full_name, dpi: u.dpi || '', phone: u.phone || '', role: u.role });
    setError(''); setModal(u);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (modal === 'create') await api.post('/users', payload);
      else await api.put(`/users/${modal.id}`, payload);
      setModal(null); load();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try { await api.put(`/users/${u.id}`, { is_active: !u.is_active }); load(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  // ADMIN puede crear cualquier rol, HOST puede crear HOST y PILOT
  const allowedRoles = me?.role === 'ADMIN'
    ? ['ADMIN', 'HOST', 'PILOT']
    : ['HOST', 'PILOT'];

  // Quién puede editar a quién
const canEdit = (target) => {
    if (me?.id === target.id) return false; // usar Mi Perfil para editarse uno mismo
    if (me?.role === 'ADMIN') return true; // ADMIN edita a todos
    if (me?.role === 'HOST') return target.role !== 'ADMIN'; // HOST edita HOST y PILOT pero no ADMIN
    return false;
  };;

  const canToggle = (target) => {
    if (me?.id === target.id) return false;
    if (me?.role === 'ADMIN') return true;
    if (me?.role === 'HOST') return target.role === 'PILOT';
    return false;
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.dpi || '').includes(search) ||
    (u.phone || '').includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Usuarios</h1>
        <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 340 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        <input placeholder="Buscar nombre, DPI, teléfono..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Usuario</th><th>DPI</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {u.full_name}
                    {u.id === me?.id && <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 6 }}>(tú)</span>}
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text3)', fontSize: 13 }}>{u.username}</td>
                  <td><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'monospace', color: 'var(--text2)' }}><CreditCard size={11} color="var(--text3)" />{u.dpi || '—'}</span></td>
                  <td><span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text2)' }}><Phone size={11} color="var(--text3)" />{u.phone || '—'}</span></td>
                  <td>
                    <span className={`badge ${ROLE_COLORS[u.role]}`} style={{ display: 'flex', alignItems: 'center', gap: 3, width: 'fit-content' }}>
                      {u.role === 'ADMIN' && <Shield size={9} />}{ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>{u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {canEdit(u) && <button className="btn-icon" onClick={() => openEdit(u)} title="Editar"><Pencil size={14} /></button>}
                      {canToggle(u) && (
                        <button className="btn-icon" onClick={() => toggleActive(u)} title={u.is_active ? 'Desactivar' : 'Activar'}>
                          {u.is_active ? <UserX size={14} color="var(--red)" /> : <UserCheck size={14} color="var(--green)" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Sin usuarios</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-title">{modal === 'create' ? 'Nuevo usuario' : `Editar — ${modal.username}`}</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label>Nombre completo *</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></div>
                <div className="form-group"><label>Usuario *</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{modal === 'create' ? 'Contraseña *' : 'Nueva contraseña (opcional)'}</label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal === 'create'} placeholder={modal !== 'create' ? 'Dejar vacío para no cambiar' : ''} />
                </div>
                <div className="form-group">
                  <label>Rol *</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CreditCard size={12} /> DPI</label>
                  <input value={form.dpi} onChange={e => setForm({ ...form, dpi: e.target.value })} placeholder="1234567890101" maxLength={13} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={12} /> Teléfono</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="502 1234 5678" />
                </div>
              </div>
              {error && <div className="error-msg">{error}</div>}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
