import { usePropertyStore } from '../store/usePropertyStore';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { useNavigate } from 'react-router-dom';
import { Edit3, Trash2 } from 'lucide-react';

const getPropertyStatus = (p: any) => {
  let isFullyRecorded = false;
  let isPartiallyRecorded = false;
  if (p.checklist && p.checklist.length > 0) {
    const starItems = p.checklist.filter((i: any) => i.type === 'star-text');
    const unrecordedStars = starItems.filter((i: any) => i.score === 0);
    if (unrecordedStars.length === 0 && starItems.length > 0) {
      isFullyRecorded = true;
    } else if (unrecordedStars.length < starItems.length) {
      isPartiallyRecorded = true;
    }
  }
  const text = isFullyRecorded ? '기록 완료' : (isPartiallyRecorded ? '기록 중' : '미방문');
  const bg = isFullyRecorded ? 'var(--status-good)' : (isPartiallyRecorded ? 'var(--status-warning)' : 'var(--border-color)');
  const color = isFullyRecorded || isPartiallyRecorded ? 'white' : 'var(--text-secondary)';
  return { text, bg, color };
};

const getDisplayAddress = (addr: string) => {
  if (!addr) return '-';
  const words = addr.split(/[\s()]+/);
  const gu = words.find(w => w.endsWith('구'));
  const dong = words.find(w => w.endsWith('동'));
  return (gu && dong) ? `${gu} ${dong}` : addr.split(' ').slice(1, 3).join(' ') || '-';
};

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
        <Map
          center={{
            lat: properties.length > 0 ? properties[0].location.lat : 37.5665,
            lng: properties.length > 0 ? properties[0].location.lng : 126.9780,
          }}
          style={{ width: '100%', height: '100%' }}
          level={5}
        >
          {properties.map((p) => (
            <MapMarker
              key={p.id}
              position={{ lat: p.location.lat, lng: p.location.lng }}
              onClick={() => {
                setCurrentEditingId(p.id);
                navigate('/checklist');
              }}
            >
              <div style={{ padding: '5px', color: '#000', fontSize: '12px' }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>{p.name}</strong>
                {p.type} / {p.totalHouseholds}세대
              </div>
            </MapMarker>
          ))}
        </Map>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <strong style={{ fontSize: '1.1rem' }}>{p.name}</strong>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '2px 6px', background: getPropertyStatus(p).bg, color: getPropertyStatus(p).color, borderRadius: '6px' }}>
                  {getPropertyStatus(p).text}
                </span>
                {p.isFavorite && <span style={{ color: 'var(--status-favorite)', fontSize: '1.2rem' }}>❤️</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            
            <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.85rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', flex: 1, minWidth: '70px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>주소</span>
                <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getDisplayAddress(p.address)}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', flex: 1, minWidth: '70px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>연식</span>
                <strong>{p.builtYear ? `${p.builtYear}년` : '-'}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', flex: 1, minWidth: '70px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>세대수</span>
                <strong>{p.totalHouseholds ? `${p.totalHouseholds}세대` : '-'}</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', flex: 1, minWidth: '70px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>세대당 주차</span>
                <strong>{p.parkingSpots && p.totalHouseholds ? `${(p.parkingSpots / p.totalHouseholds).toFixed(2)}대` : '-'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
