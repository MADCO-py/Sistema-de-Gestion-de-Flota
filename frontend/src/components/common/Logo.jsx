import { useState } from 'react';

// SVG logo por defecto — reemplaza frontend/public/logo.png con tu imagen real
const DefaultLogo = ({ size = 48 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 200 200">
    <rect width="200" height="200" rx="32" fill="#1a0000"/>
    <rect x="30" y="95" width="100" height="55" rx="6" fill="#dc2626"/>
    <rect x="108" y="75" width="60" height="75" rx="6" fill="#dc2626"/>
    <rect x="115" y="82" width="45" height="30" rx="4" fill="#0a0000" opacity="0.7"/>
    <circle cx="60" cy="158" r="16" fill="#111"/>
    <circle cx="60" cy="158" r="9" fill="#444"/>
    <circle cx="140" cy="158" r="16" fill="#111"/>
    <circle cx="140" cy="158" r="9" fill="#444"/>
    <line x1="15" y1="108" x2="38" y2="108" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
    <line x1="10" y1="120" x2="33" y2="120" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <line x1="18" y1="132" x2="36" y2="132" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

export default function Logo({ size = 48, style = {} }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) return <div style={{ width: size, height: size, ...style }}><DefaultLogo size={size} /></div>;

  return (
    <img
      src="/logo.png"
      alt="FleetControl Logo"
      width={size}
      height={size}
      onError={() => setImgFailed(true)}
      style={{ objectFit: 'contain', borderRadius: size * 0.15, ...style }}
    />
  );
}
