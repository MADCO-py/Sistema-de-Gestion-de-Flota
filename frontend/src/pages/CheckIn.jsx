import { useState, useEffect } from 'react';
import { Truck, MapPin, Gauge, CheckCircle, AlertTriangle, Flag } from 'lucide-react';
import api from '../services/api';

const TYPE_LABELS = { car: 'Carro', truck: 'Camión', van: 'Van', motorcycle: 'Moto' };

export default function CheckIn() {
  const [activeUsage, setActiveUsage] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [kmStart, setKmStart] = useState('');
  const [route, setRoute] = useState('');
  const [kmEnd, setKmEnd] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [active, veh] = await Promise.all([api.get('/usage/my-active'), api.get('/vehicles')]);
      setActiveUsage(active.data);
      setVehicles(veh.data.filter(v => v.status === 'available'));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/usage/checkin', { vehicle_id: selectedVehicle, km_start: parseInt(kmStart), route });
      setSuccess('Check-in realizado correctamente');
      setSelectedVehicle(''); setKmStart(''); setRoute('');
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Error en check-in'); }
    finally { setSaving(false); }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const r = await api.post('/usage/checkout', { usage_id: activeUsage.id, km_end: parseInt(kmEnd) });
      setSuccess(`Check-out realizado. Recorriste ${r.data.km_diff?.toLocaleString()} km.${r.data.suspicious ? ' Kilometraje marcado como sospechoso.' : ''}`);
      setKmEnd('');
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Error en check-out'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  const selectedV = vehicles.find(x => x.id === selectedVehicle);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header"><h1 className="page-title">Check-in / Check-out</h1></div>

      {success && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid #15803d', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, color: 'var(--green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid #991b1b', borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 20, color: 'var(--red)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {!activeUsage ? (
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={18} color="#3b82f6" /> Tomar un vehículo
          </div>
          {vehicles.length === 0 ? (
            <div className="empty-state">No hay vehículos disponibles en este momento</div>
          ) : (
            <form onSubmit={handleCheckIn}>
              <div className="form-group">
                <label>Seleccionar vehículo *</label>
                <select value={selectedVehicle} onChange={e => {
                  setSelectedVehicle(e.target.value);
                  const v = vehicles.find(x => x.id === e.target.value);
                  if (v) setKmStart(String(v.current_km));
                }} required>
                  <option value="">— Selecciona un vehículo —</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} — {[v.brand, v.model].filter(Boolean).join(' ')} ({TYPE_LABELS[v.type]}) — {v.current_km?.toLocaleString()} km
                    </option>
                  ))}
                </select>
              </div>

              {selectedV && (() => {
                const kmLeft = selectedV.maintenance_km - selectedV.current_km;
                return (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{selectedV.plate}</span>
                      <span style={{ color: 'var(--text3)' }}>{[selectedV.brand, selectedV.model, selectedV.year].filter(Boolean).join(' ')}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: kmLeft <= 500 ? 'var(--yellow)' : 'var(--text3)' }}>
                      {kmLeft <= 500 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      {kmLeft <= 0 ? 'Mantenimiento vencido' : kmLeft <= 500 ? `Faltan ${kmLeft.toLocaleString()} km para mantenimiento` : `${kmLeft.toLocaleString()} km para mantenimiento`}
                    </div>
                  </div>
                );
              })()}

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Gauge size={13} /> Kilometraje inicial *</label>
                <input type="number" value={kmStart} onChange={e => setKmStart(e.target.value)} required min="0" />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Verifica el odómetro del vehículo</div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> Destino / Ruta *</label>
                <textarea value={route} onChange={e => setRoute(e.target.value)} required rows={3} placeholder="Ej: Zona 10, Edificio Torre Roma, entrega de documentos..." />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={saving}>
                <CheckCircle size={16} /> {saving ? 'Procesando...' : 'Hacer Check-in'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div>
          <div className="card" style={{ marginBottom: 16, background: 'var(--yellow-bg)', border: '1px solid #713f12' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--yellow)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={16} /> Vehículo activo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div><div style={{ color: 'var(--text3)' }}>Placa</div><div style={{ fontWeight: 600, color: 'var(--text)' }}>{activeUsage.plate}</div></div>
              <div><div style={{ color: 'var(--text3)' }}>Tipo</div><div>{TYPE_LABELS[activeUsage.type]}</div></div>
              <div><div style={{ color: 'var(--text3)' }}>KM inicial</div><div>{activeUsage.km_start?.toLocaleString()} km</div></div>
              <div><div style={{ color: 'var(--text3)' }}>Entrada</div><div>{new Date(activeUsage.checkin_at).toLocaleString('es')}</div></div>
              <div style={{ gridColumn: '1/-1' }}><div style={{ color: 'var(--text3)' }}>Ruta</div><div>{activeUsage.route}</div></div>
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flag size={18} color="#3b82f6" /> Devolver vehículo
            </div>
            <form onSubmit={handleCheckOut}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Gauge size={13} /> Kilometraje final *</label>
                <input type="number" value={kmEnd} onChange={e => setKmEnd(e.target.value)} required min={parseInt(activeUsage.km_start) + 1} />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Debe ser mayor a {activeUsage.km_start?.toLocaleString()} km</div>
                {kmEnd && parseInt(kmEnd) > activeUsage.km_start && (
                  <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, color: (parseInt(kmEnd) - activeUsage.km_start) > 500 ? 'var(--yellow)' : 'var(--green)' }}>
                    {(parseInt(kmEnd) - activeUsage.km_start) > 500 ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                    {(parseInt(kmEnd) - activeUsage.km_start).toLocaleString()} km recorridos
                    {(parseInt(kmEnd) - activeUsage.km_start) > 500 && ' — se marcará como sospechoso'}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={saving}>
                <Flag size={16} /> {saving ? 'Procesando...' : 'Hacer Check-out'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
