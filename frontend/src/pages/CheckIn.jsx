import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Gauge, CheckCircle, AlertTriangle, Flag, Camera, Image } from 'lucide-react';
import api from '../services/api';

const TYPE_LABELS = { car: 'Carro', truck: 'Camión', van: 'Van', motorcycle: 'Moto' };
const SIDES = [
  { key: 'front', label: 'Frente',    dir: '⬆' },
  { key: 'back',  label: 'Atrás',     dir: '⬇' },
  { key: 'left',  label: 'Izquierda', dir: '⬅' },
  { key: 'right', label: 'Derecha',   dir: '➡' },
];

function PhotoSlot({ side, file, onFile }) {
  const camRef = useRef();
  const galRef = useRef();
  const [preview, setPreview] = useState(null);

  const handleFile = (f) => {
    if (!f) return;
    onFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  return (
    <div style={{
      borderRadius: 12,
      border: `2px ${file ? 'solid' : 'dashed'} ${file ? 'var(--green)' : 'var(--border2)'}`,
      background: file ? 'var(--green-bg)' : 'var(--bg2)',
      overflow: 'hidden', transition: 'all 0.2s',
    }}>
      {preview ? (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt={side.label} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.75))', padding: '20px 10px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={12} color="var(--green)" /> {side.label}
            </span>
            <button type="button" onClick={() => camRef.current.click()}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Camera size={11} /> Retomar
            </button>
          </div>
        </div>
      ) : (
        <div style={{ aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text2)' }}>{side.dir} {side.label}</div>
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 200 }}>
            <button type="button" onClick={() => camRef.current.click()}
              style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '10px 6px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Camera size={18} /> Cámara
            </button>
            <button type="button" onClick={() => galRef.current.click()}
              style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 6px', color: 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Image size={18} /> Galería
            </button>
          </div>
        </div>
      )}
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
      <input ref={galRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
    </div>
  );
}

function StepBar({ step }) {
  const steps = [
    { key: 'checkin',  short: 'Check-in', done: step !== 'checkin' },
    { key: 'photos',   short: 'Fotos',    done: step === 'checkout' },
    { key: 'checkout', short: 'Entrega',  done: false },
  ];
  return (
    <div style={{ display: 'flex', marginBottom: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{
          flex: 1, padding: '10px 4px', textAlign: 'center', fontSize: 12, fontWeight: 700,
          background: step === s.key ? 'var(--accent)' : s.done ? '#052e16' : 'var(--surface)',
          color: step === s.key ? '#fff' : s.done ? 'var(--green)' : 'var(--text3)',
          borderRight: i < 2 ? '1px solid var(--border)' : 'none',
          transition: 'background 0.2s', whiteSpace: 'nowrap',
        }}>
          {s.done ? '✓ ' : step === s.key ? '● ' : ''}{s.short}
        </div>
      ))}
    </div>
  );
}

export default function CheckIn() {
  const navigate = useNavigate();
  const [activeUsage, setActiveUsage] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState('checkin');

  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [kmStart, setKmStart] = useState('');
  const [route, setRoute] = useState('');
  const [photos, setPhotos] = useState({ front: null, back: null, left: null, right: null });
  const [uploading, setUploading] = useState(false);
  const [kmEnd, setKmEnd] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [active, veh] = await Promise.all([api.get('/usage/my-active'), api.get('/vehicles')]);
      const usage = active.data;
      setActiveUsage(usage);
      setVehicles(veh.data.filter(v => v.status === 'available'));
      if (usage) {
        const existing = Array.isArray(usage.photos) ? usage.photos : [];
        const allDone = ['front','back','left','right'].every(s => existing.some(p => p?.side === s));
        setStep(allDone ? 'checkout' : 'photos');
      } else {
        setStep('checkin');
        setPhotos({ front: null, back: null, left: null, right: null });
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/usage/checkin', { vehicle_id: selectedVehicle, km_start: parseInt(kmStart), route });
      setSuccess('Check-in realizado. Ahora puedes subir fotos del vehículo (opcional).');
      setSelectedVehicle(''); setKmStart(''); setRoute('');
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Error en check-in'); }
    finally { setSaving(false); }
  };

  const handleUploadPhotos = async () => {
    const hasPhotos = SIDES.some(s => photos[s.key]);
    if (!hasPhotos) {
      // Si no hay ninguna foto, saltar directo al checkout
      setStep('checkout');
      return;
    }
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      SIDES.forEach(s => {
        if (photos[s.key]) {
          const file = photos[s.key];
          const ext = file.type.split('/')[1] || 'jpg';
          formData.append(s.key, new File([file], `${s.key}.${ext}`, { type: file.type }));
        }
      });
      await api.post(`/usage/${activeUsage.id}/photos`, formData);
      setSuccess('Fotos subidas. Ahora puedes entregar el vehículo.');
      setStep('checkout');
      await load();
    } catch (err) { setError(err.response?.data?.error || 'Error al subir fotos'); }
    finally { setUploading(false); }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const r = await api.post('/usage/checkout', { usage_id: activeUsage.id, km_end: parseInt(kmEnd) });
      // Redirigir al inicio después del checkout
      navigate('/', { state: { checkoutSuccess: true, km: r.data.km_diff } });
    } catch (err) { setError(err.response?.data?.error || 'Error en check-out'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  const photosReady = SIDES.filter(s => photos[s.key]).length;
  const selectedV = vehicles.find(x => x.id === selectedVehicle);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {activeUsage && <StepBar step={step} />}

      {success && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid #15803d', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16, color: 'var(--green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16, color: 'var(--red)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* PASO 1: CHECK-IN */}
      {!activeUsage && (
        <div className="pilot-action-card">
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={20} color="#fff" />
            </div>
            Tomar un vehículo
          </div>
          {vehicles.length === 0 ? (
            <div className="empty-state">No hay vehículos disponibles</div>
          ) : (
            <form onSubmit={handleCheckIn}>
              <div className="form-group">
                <label style={{ fontSize: 15 }}>Vehículo *</label>
                <select value={selectedVehicle} onChange={e => {
                  setSelectedVehicle(e.target.value);
                  const v = vehicles.find(x => x.id === e.target.value);
                  if (v) setKmStart(String(v.current_km));
                }} required style={{ fontSize: 16, padding: '14px' }}>
                  <option value="">— Selecciona —</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} — {[v.brand, v.model].filter(Boolean).join(' ')} ({TYPE_LABELS[v.type]})
                    </option>
                  ))}
                </select>
              </div>
              {selectedV && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{selectedV.plate}</span>
                  <span style={{ color: (selectedV.maintenance_km - selectedV.current_km) <= 500 ? 'var(--yellow)' : 'var(--text3)' }}>
                    {(selectedV.maintenance_km - selectedV.current_km) <= 0 ? '⚠ Mant. vencido' : `${(selectedV.maintenance_km - selectedV.current_km).toLocaleString()} km para mant.`}
                  </span>
                </div>
              )}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}><Gauge size={14} /> Odómetro actual (km) *</label>
                <input type="number" inputMode="numeric" value={kmStart} onChange={e => setKmStart(e.target.value)}
                  required min="0" placeholder="Ej: 45000" style={{ fontSize: 24, fontWeight: 800, padding: '12px 14px' }} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}><MapPin size={14} /> ¿A dónde vas? *</label>
                <textarea value={route} onChange={e => setRoute(e.target.value)} required rows={2}
                  placeholder="Ej: Zona 10, entrega documentos cliente..." style={{ fontSize: 16, resize: 'none' }} />
              </div>
              <button type="submit" className="btn-primary pilot-big-btn" disabled={saving} style={{ fontSize: 17, marginTop: 4 }}>
                <CheckCircle size={20} /> {saving ? 'Procesando...' : 'Confirmar Check-in'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* PASO 2: FOTOS — OPCIONALES */}
      {activeUsage && step === 'photos' && (
        <div className="pilot-action-card active-vehicle">
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={20} color="#fff" />
            </div>
            Fotos del vehículo
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>Opcional</span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 18, lineHeight: 1.5 }}>
            Puedes tomar fotos del <strong style={{ color: '#fff' }}>{activeUsage.plate}</strong> antes de devolverlo. No es obligatorio.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {SIDES.map(s => (
              <PhotoSlot key={s.key} side={s} file={photos[s.key]}
                onFile={file => setPhotos(prev => ({ ...prev, [s.key]: file }))} />
            ))}
          </div>

          {/* Barra progreso */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {SIDES.map(s => (
              <div key={s.key} style={{ flex: 1, height: 4, borderRadius: 99, background: photos[s.key] ? 'var(--green)' : 'var(--border2)', transition: 'background 0.3s' }} />
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginBottom: 16 }}>
            {photosReady > 0 ? `${photosReady} / 4 fotos` : 'Sin fotos — puedes continuar sin ellas'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary pilot-big-btn" onClick={handleUploadPhotos} disabled={uploading} style={{ fontSize: 17 }}>
              <Camera size={20} />
              {uploading ? 'Subiendo...' : photosReady > 0 ? `Subir ${photosReady} foto${photosReady > 1 ? 's' : ''} y continuar` : 'Continuar sin fotos'}
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: CHECK-OUT */}
      {activeUsage && step === 'checkout' && (
        <div>
          <div className="pilot-action-card active-vehicle" style={{ marginBottom: 14 }}>
            <div style={{ color: 'var(--accent2)', fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={14} /> Vehículo activo
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase' }}>Placa</div><div style={{ fontWeight: 900, fontSize: 24, color: '#fff' }}>{activeUsage.plate}</div></div>
              <div><div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase' }}>KM inicial</div><div style={{ fontWeight: 700, fontSize: 18 }}>{activeUsage.km_start?.toLocaleString()}</div></div>
              <div style={{ gridColumn: '1/-1' }}><div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase' }}>Ruta</div><div style={{ color: 'var(--text2)', fontSize: 13 }}>{activeUsage.route}</div></div>
            </div>
          </div>

          <div className="pilot-action-card">
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: '#052e16', border: '1px solid var(--green)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Flag size={20} color="var(--green)" />
              </div>
              Devolver vehículo
            </div>
            <form onSubmit={handleCheckOut}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}><Gauge size={14} /> Odómetro final (km) *</label>
                <input type="number" inputMode="numeric" value={kmEnd} onChange={e => setKmEnd(e.target.value)}
                  required min={parseInt(activeUsage.km_start) + 1}
                  style={{ fontSize: 26, fontWeight: 900, padding: '14px', textAlign: 'center' }} />
                {kmEnd && parseInt(kmEnd) > activeUsage.km_start && (
                  <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, background: (parseInt(kmEnd) - activeUsage.km_start) > 500 ? 'var(--yellow-bg)' : 'var(--green-bg)', color: (parseInt(kmEnd) - activeUsage.km_start) > 500 ? 'var(--yellow)' : 'var(--green)', border: `1px solid ${(parseInt(kmEnd) - activeUsage.km_start) > 500 ? '#78350f' : '#15803d'}` }}>
                    {(parseInt(kmEnd) - activeUsage.km_start) > 500 ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
                    {(parseInt(kmEnd) - activeUsage.km_start).toLocaleString()} km recorridos
                    {(parseInt(kmEnd) - activeUsage.km_start) > 500 && ' — sospechoso'}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary pilot-big-btn" disabled={saving || !kmEnd || parseInt(kmEnd) <= activeUsage.km_start}
                style={{ background: '#16a34a', fontSize: 18, marginTop: 4 }}>
                <Flag size={20} color="#fff" /> {saving ? 'Procesando...' : 'Confirmar entrega'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}