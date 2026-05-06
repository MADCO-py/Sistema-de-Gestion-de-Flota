import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Truck, AlertTriangle, Search } from 'lucide-react';
import api from '../services/api';

const TYPES = ['car', 'truck', 'van', 'motorcycle'];
const TYPE_LABELS = { car: 'Carro', truck: 'Camión', van: 'Van', motorcycle: 'Moto' };
const emptyForm = { plate: '', type: 'car', brand: '', model: '', year: '', current_km: '', maintenance_km: '5000', notes: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => { setLoading(true); api.get('/vehicles').then(r => setVehicles(r.data)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (v) => { setForm({ plate: v.plate, type: v.type, brand: v.brand||'', model: v.model||'', year: v.year||'', current_km: v.current_km, maintenance_km: v.maintenance_km, notes: v.notes||'' }); setError(''); setModal(v); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, current_km: parseInt(form.current_km), maintenance_km: parseInt(form.maintenance_km), year: form.year ? parseInt(form.year) : null };
      if (modal === 'create') await api.post('/vehicles', payload);
      else await api.put(`/vehicles/${modal.id}`, payload);
      setModal(null); load();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este vehículo?')) return;
    try { await api.delete(`/vehicles/${id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const filtered = vehicles.filter(v =>
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    (v.brand||'').toLowerCase().includes(search.toLowerCase()) ||
    (v.model||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vehículos</h1>
        <button className="btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Agregar vehículo
        </button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 320 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
        <input placeholder="Buscar placa, marca, modelo..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Tipo</th><th>Placa</th><th>Marca / Modelo</th><th>KM actual</th><th>Mantenimiento</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {filtered.map(v => {
                const kmLeft = v.maintenance_km - v.current_km;
                return (
                  <tr key={v.id}>
                    <td style={{ color: 'var(--text2)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Truck size={14} /> {TYPE_LABELS[v.type]}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--text)' }}>{v.plate}</td>
                    <td>{[v.brand, v.model, v.year].filter(Boolean).join(' ') || '—'}</td>
                    <td>{v.current_km?.toLocaleString()} km</td>
                    <td>
                      {kmLeft <= 0
                        ? <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> Vencido</span>
                        : kmLeft <= 500
                          ? <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} /> {kmLeft.toLocaleString()} km</span>
                          : <span style={{ color: 'var(--text3)', fontSize: 13 }}>{kmLeft.toLocaleString()} km restantes</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${v.status === 'available' ? 'badge-green' : v.status === 'in_use' ? 'badge-yellow' : 'badge-red'}`}>
                        {v.status === 'available' ? 'Disponible' : v.status === 'in_use' ? 'En uso' : 'Mantenimiento'}
                      </span>
                      {v.current_pilot && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{v.current_pilot}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(v)} title="Editar"><Pencil size={14} /></button>
                        {v.status !== 'in_use' && <button className="btn-icon" onClick={() => handleDelete(v.id)} title="Eliminar" style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Sin vehículos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-title">{modal === 'create' ? 'Nuevo vehículo' : `Editar — ${modal.plate}`}</div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group"><label>Placa *</label><input value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} required placeholder="ABC-123" /></div>
                <div className="form-group"><label>Tipo *</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Marca</label><input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="Toyota" /></div>
                <div className="form-group"><label>Modelo</label><input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Corolla" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Año</label><input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="2023" /></div>
                <div className="form-group"><label>KM actual *</label><input type="number" value={form.current_km} onChange={e => setForm({...form, current_km: e.target.value})} required min="0" /></div>
              </div>
              <div className="form-group">
                <label>KM para próximo mantenimiento *</label>
                <input type="number" value={form.maintenance_km} onChange={e => setForm({...form, maintenance_km: e.target.value})} required min="0" />
              </div>
              <div className="form-group"><label>Notas</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
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
