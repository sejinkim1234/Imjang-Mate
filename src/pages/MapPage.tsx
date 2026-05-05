import { usePropertyStore } from '../store/usePropertyStore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { Edit3, Trash2 } from 'lucide-react';

// Leaflet 기본 마커 아이콘 수정
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export function MapPage() {
  const navigate = useNavigate();
  const properties = usePropertyStore((state) => state.properties);
  const setCurrentEditingId = usePropertyStore((state) => state.setCurrentEditingId);
  const removeProperty = usePropertyStore((state) => state.removeProperty);

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <h1 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>임장 지도</h1>
      
      {/* 지도 영역 */}
      <div style={{ height: '40vh', minHeight: '300px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)', marginBottom: '1.5rem', zIndex: 1 }}>
        <MapContainer 
          center={[
            properties.length > 0 ? properties[0].location.lat : 37.5665,
            properties.length > 0 ? properties[0].location.lng : 126.9780
          ]} 
          zoom={13} 
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {properties.map(p => (
            <Marker 
              key={p.id} 
              position={[p.location.lat, p.location.lng]}
              eventHandlers={{
                click: () => {
                  setCurrentEditingId(p.id);
                  navigate('/checklist');
                }
              }}
            >
              <Popup>
                <strong>{p.name}</strong><br/>
                {p.type} / {p.totalHouseholds}세대<br/>
                <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>클릭 시 체크리스트로 이동</span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* 리스트 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>주변 단지 ({properties.length}개)</h3>
        {properties.map(p => (
          <div 
            key={p.id} 
            onClick={() => {
              setCurrentEditingId(p.id);
              navigate('/checklist');
            }}
            className="glass-panel" 
            style={{ cursor: 'pointer', padding: '1rem', marginBottom: '1rem', transition: 'transform 0.2s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{p.name}</strong>
                {p.isFavorite && <span style={{ color: 'var(--status-favorite)', fontSize: '1.2rem' }}>❤️</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: p.status === 'recorded' ? 'var(--status-good)' : 'var(--border-color)', color: p.status === 'recorded' ? 'white' : 'var(--text-secondary)', borderRadius: '8px' }}>
                  {p.status === 'recorded' ? '기록 완료' : '미방문'}
                </span>
                <Edit3 size={16} color="var(--text-secondary)" />
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(window.confirm(`'${p.name}' 단지 기록을 완전히 삭제하시겠습니까?`)) {
                      removeProperty(p.id);
                    }
                  }} 
                  style={{ background: 'none', border: 'none', color: 'var(--status-bad)', cursor: 'pointer', padding: '4px', marginLeft: '2px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{p.address}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
              <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '8px' }}>{p.type}</span>
              <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '8px' }}>{p.totalHouseholds}세대</span>
              {p.parkingSpots && p.totalHouseholds ? (
                <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  세대당 {(p.parkingSpots / p.totalHouseholds).toFixed(2)}대
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
