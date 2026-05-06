import { useState, useEffect, useCallback } from 'react';
import { Camera, Truck, CreditCard, Phone, MapPin, Gauge, X, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import api from '../services/api';

const SIDE_LABELS = { front: 'Frente', back: 'Atrás', left: 'Izquierda', right: 'Derecha' };
const SIDES_ORDER = ['front', 'back', 'left', 'right'];
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// URL pública de foto — sin token porque img no puede enviar headers
const photoUrl = (filename) => `${API_BASE}/uploads/${filename}`;

// ── Visor pantalla completa — solo miniaturas para navegar ───────────────────
function PhotoModal({ photos, initialIndex, onClose }) {
  const [idx, setIdx] = useState(initialIndex);
  const photo = photos[idx];

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!photo) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      minHeight: '100dvh',
      background: 'rgba(0,0,0,0.97)', zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Cerrar */}
      <button onClick={onClose} className="btn-icon"
        style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: '50%', zIndex: 10 }}>
        <X size={22} />
      </button>

      {/* Etiqueta lado */}
      <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', color: 'var(--text2)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {SIDE_LABELS[photo.side]}
      </div>

      {/* Foto grande — click en foto no cierra el modal */}
      <div onClick={e => e.stopPropagation()} style={{ padding: '56px 20px 110px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <img
          src={photoUrl(photo.filename)}
          alt={SIDE_LABELS[photo.side]}
          style={{ maxWidth: '88vw', maxHeight: '68vh', objectFit: 'contain', borderRadius: 14, boxShadow: '0 8px 48px rgba(0,0,0,0.9)', display: 'block' }}
        />
      </div>

      {/* Miniaturas — ÚNICA forma de navegar entre fotos */}
      <div onClick={e => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        {photos.map((p, i) => (
          <button key={p.id || i} onClick={() => setIdx(i)}
            style={{
              padding: 0, background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: 10, overflow: 'hidden', transition: 'all 0.18s',
              width: i === idx ? 76 : 54, height: i === idx ? 76 : 54,
              outline: i === idx ? '3px solid var(--accent)' : '2px solid rgba(255,255,255,0.12)',
              outlineOffset: i === idx ? 2 : 0,
              opacity: i === idx ? 1 : 0.45,
              boxShadow: i === idx ? '0 0 20px rgba(220,38,38,0.45)' : 'none',
              flexShrink: 0,
            }}>
            <img src={photoUrl(p.filename)} alt={SIDE_LABELS[p.side]}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: 8, display: 'flex', gap: 5 }}>
        {photos.map((_, i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', transition: 'background 0.2s', background: i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.25)' }} />
        ))}
      </div>
    </div>
  );
}

// ── Grid 2x2 de fotos ─────────────────────────────────────────────────────────
function PhotoGrid({ photos, onPhotoClick }) {
  const orderedPhotos = SIDES_ORDER.map(s => photos.find(p => p.side === s));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {orderedPhotos.map((photo, i) => {
        const side = SIDES_ORDER[i];
        // índice real en el array de fotos existentes (para el modal)
        const realIdx = photos.findIndex(p => p.side === side);
        return photo ? (
          <div key={side} onClick={() => realIdx !== -1 && onPhotoClick(realIdx)}
            style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', aspectRatio: '4/3', background: 'var(--bg3)' }}>
            <img
              src={photoUrl(photo.filename)}
              alt={SIDE_LABELS[side]}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
            />
            {/* Fallback si imagen falla */}
            <div style={{ display: 'none', position: 'absolute', inset: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg3)' }}>
              <Camera size={20} color="var(--text3)" />
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Error al cargar</div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.78))', padding: '20px 8px 7px', fontSize: 11, color: '#fff', fontWeight: 600, textAlign: 'center', pointerEvents: 'none' }}>
              {SIDE_LABELS[side]}
            </div>
          </div>
        ) : (
          <div key={side} style={{ aspectRatio: '4/3', borderRadius: 10, background: 'var(--bg3)', border: '1px dashed var(--border2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Camera size={18} color="var(--text3)" />
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{SIDE_LABELS[side]}</div>
            <div style={{ fontSize: 10, color: 'var(--red)' }}>Sin foto</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Lista izquierda ───────────────────────────────────────────────────────────
function UsageList({ records, selected, onSelect }) {
  if (records.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Sin registros</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {records.map(r => {
        const isSelected = selected?.usage_id === r.usage_id;
        const photoCount = (r.photos || []).length;
        return (
          <div key={r.usage_id} onClick={() => onSelect(r)} style={{
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
            background: isSelected ? 'var(--accent-light)' : 'var(--bg2)',
            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: isSelected ? '#fff' : 'var(--text)' }}>{r.plate}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={10} /> {r.pilot_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  {new Date(r.checkin_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <span className={`badge ${photoCount === 4 ? 'badge-green' : photoCount > 0 ? 'badge-yellow' : 'badge-red'}`}
                style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <Camera size={9} /> {photoCount}/4
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Detalle derecho ───────────────────────────────────────────────────────────
function UsageDetail({ record }) {
  const [modalIdx, setModalIdx] = useState(null);
  const photos = (record.photos || []).filter(p => p && p.side && p.filename);
  const kmTraveled = record.km_end != null ? record.km_end - record.km_start : null;

  return (
    <div>
      {/* Header vehículo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: 16, background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ width: 48, height: 48, background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Truck size={24} color="var(--accent2)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#fff' }}>{record.plate}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{[record.brand, record.model].filter(Boolean).join(' ') || 'Vehículo'}</div>
        </div>
        {record.status === 'active'
          ? <span className="badge badge-yellow" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> En uso</span>
          : record.km_suspicious
            ? <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> Sospechoso</span>
            : <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Normal</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Datos izquierda */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Piloto</div>
          <div style={{ background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14, overflow: 'hidden' }}>
            {[
              { icon: <User size={13} />, label: 'Nombre', value: record.pilot_name },
              { icon: <CreditCard size={13} />, label: 'DPI', value: record.pilot_dpi || '—', mono: true },
              { icon: <Phone size={13} />, label: 'Teléfono', value: record.pilot_phone || '—' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 55, flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, fontFamily: item.mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8 }}>Viaje</div>
          <div style={{ background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[
              { icon: <MapPin size={13} />, label: 'Ruta', value: record.route },
              { icon: <Gauge size={13} />, label: 'KM inicio', value: `${record.km_start?.toLocaleString()} km` },
              { icon: <Gauge size={13} />, label: 'KM final', value: record.km_end != null ? `${record.km_end.toLocaleString()} km` : '—' },
              { icon: <Gauge size={13} />, label: 'Recorrido', value: kmTraveled != null ? `${kmTraveled.toLocaleString()} km` : '—' },
              { icon: <Clock size={13} />, label: 'Check-in', value: new Date(record.checkin_at).toLocaleString('es') },
              { icon: <Clock size={13} />, label: 'Check-out', value: record.checkout_at ? new Date(record.checkout_at).toLocaleString('es') : '—' },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 55, flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fotos derecha */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Fotos del vehículo</span>
            <span style={{ color: photos.length === 4 ? 'var(--green)' : photos.length > 0 ? 'var(--yellow)' : 'var(--red)', fontSize: 12, textTransform: 'none', fontWeight: 700 }}>
              {photos.length}/4
            </span>
          </div>
          {photos.length === 0 ? (
            <div style={{ background: 'var(--bg2)', borderRadius: 10, border: '1px dashed var(--border2)', padding: '32px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              <Camera size={28} style={{ marginBottom: 8, opacity: 0.35, display: 'block', margin: '0 auto 8px' }} />
              Sin fotos registradas
            </div>
          ) : (
            <>
              <PhotoGrid photos={photos} onPhotoClick={setModalIdx} />
              <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8 }}>
                Clic en una foto para ampliar
              </div>
            </>
          )}
        </div>
      </div>

      {modalIdx !== null && photos.length > 0 && (
        <PhotoModal photos={photos} initialIndex={modalIdx} onClose={() => setModalIdx(null)} />
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function VehiclePhotos() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/vehicles').then(r => setVehicles(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    setSelectedRecord(null);
    const url = selectedVehicle ? `/reports/vehicle-photos?vehicle_id=${selectedVehicle}` : '/reports/vehicle-photos';
    api.get(url).then(r => {
      setRecords(r.data);
      if (r.data.length > 0) setSelectedRecord(r.data[0]);
    }).finally(() => setLoading(false));
  }, [selectedVehicle]);

  const totalPhotos = records.reduce((a, r) => a + (r.photos?.length || 0), 0);
  const complete = records.filter(r => (r.photos?.length || 0) === 4).length;
  const noPhotos = records.filter(r => (r.photos?.length || 0) === 0).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Registro fotográfico</h1>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Registros totales', value: records.length, color: 'var(--text)' },
          { label: 'Con 4 fotos', value: complete, color: 'var(--green)' },
          { label: 'Sin fotos', value: noPhotos, color: noPhotos > 0 ? 'var(--red)' : 'var(--text)' },
          { label: 'Total fotos', value: totalPhotos, color: 'var(--accent2)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 24 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Truck size={15} color="var(--text3)" />
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="">Todos los vehículos</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {[v.brand, v.model].filter(Boolean).join(' ')}</option>)}
        </select>
        {selectedVehicle && <button className="btn-secondary btn-sm" onClick={() => setSelectedVehicle('')}>Ver todos</button>}
      </div>

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Lista izquierda — sticky al hacer scroll */}
          <div className="card" style={{ padding: 12, maxHeight: '78vh', overflowY: 'auto', position: 'sticky', top: 70 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, padding: '0 2px' }}>
              {records.length} registros
            </div>
            <UsageList records={records} selected={selectedRecord} onSelect={setSelectedRecord} />
          </div>

          {/* Detalle derecho */}
          <div className="card" style={{ padding: 20, maxHeight: '78vh', overflowY: 'auto' }}>
            {selectedRecord ? (
              <UsageDetail record={selectedRecord} />
            ) : (
              <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', gap: 12 }}>
                <Camera size={40} style={{ opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>Selecciona un registro de la lista</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
