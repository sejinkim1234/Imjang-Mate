import { useState, useEffect, useRef } from 'react';
import { Star, Plus, Trash2, Save, MapPin, ChevronUp, ChevronDown, Camera, X, Navigation } from 'lucide-react';
import { usePropertyStore } from '../store/usePropertyStore';

type ItemType = 'star-text' | 'text-only';
type ItemCategory = '단지 외부 (입지)' | '단지 내부 (환경)' | '부동산 (정보)';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  placeholder: string;
  type: ItemType;
  category: ItemCategory;
  score: number;
  note: string;
  isCustom: boolean;
  photos?: string[];
}

const CATEGORIES: ItemCategory[] = ['단지 외부 (입지)', '단지 내부 (환경)', '부동산 (정보)'];

const CATEGORY_DESCRIPTIONS: Record<ItemCategory, string> = {
  '단지 외부 (입지)': "외부 요인은 '입지의 불변성'을 확인하는 단계입니다.",
  '단지 내부 (환경)': "단지 내부는 '거주 쾌적성'과 '관리 수준'을 판단하는 지표입니다.",
  '부동산 (정보)': "부동산 정보는 '투자가치'와 '실제 거래 조건'을 분석하는 단계입니다."
};

const CATEGORY_COLORS: Record<ItemCategory, string> = {
  '단지 외부 (입지)': 'rgba(56, 189, 248, 0.06)', // Blueish
  '단지 내부 (환경)': 'rgba(52, 211, 153, 0.06)', // Greenish
  '부동산 (정보)': 'rgba(167, 139, 250, 0.06)',   // Purplish
};

const CATEGORY_BORDER_COLORS: Record<ItemCategory, string> = {
  '단지 외부 (입지)': 'rgba(56, 189, 248, 0.3)',
  '단지 내부 (환경)': 'rgba(52, 211, 153, 0.3)',
  '부동산 (정보)': 'rgba(167, 139, 250, 0.3)',
};

const DEFAULT_ITEMS: ChecklistItem[] = [
  // 단지 외부 (입지)
  { id: 'default-ext-1', title: '대중교통 접근성 및 경사도', description: '단순 거리뿐만 아니라 실제 도보 시 언덕이나 육교 유무를 기록합니다.', placeholder: '예: 지하철역 도보 10분, 단지 입구부터 오르막길 심함', type: 'star-text', category: '단지 외부 (입지)', score: 0, note: '', isCustom: false },
  { id: 'default-ext-2', title: '초등학교 및 학군', description: '통학로의 안전성(큰 도로 유무)과 주변 학원가 형성 수준을 평가합니다.', placeholder: '예: 횡단보도 없이 단지 내에서 초등학교로 바로 연결됨', type: 'star-text', category: '단지 외부 (입지)', score: 0, note: '', isCustom: false },
  { id: 'default-ext-3', title: '선호상권', description: '마트, 은행, 병원 등 실생활 밀착형 상가의 접근성을 기록합니다.', placeholder: '예: 도보 5분 거리에 대형 마트 및 병원 밀집, 상가 공실 없음', type: 'star-text', category: '단지 외부 (입지)', score: 0, note: '', isCustom: false },
  { id: 'default-ext-4', title: '주요 유해시설', description: '소음(철도, 비행기)이나 냄새, 인근 노후 지역 등 거주 환경 저해 요소를 체크합니다.', placeholder: '예: 단지 뒤쪽으로 기차길 있어 창문 열면 소음 있음', type: 'star-text', category: '단지 외부 (입지)', score: 0, note: '', isCustom: false },

  // 단지 내부 (환경)
  { id: 'default-int-1', title: '동간 거리 및 일조량', description: '동간 간섭으로 인한 사생활 침해 여부와 저층부 채광 상태를 확인합니다.', placeholder: '예: 동향이라 오후 채광 부족, 앞 동과 너무 가까워 커튼 필수', type: 'star-text', category: '단지 내부 (환경)', score: 0, note: '', isCustom: false },
  { id: 'default-int-2', title: '조경 및 커뮤니티', description: '단지 내 산책로 관리 상태와 헬스장, 도서관 등 커뮤니티 활성화 정도를 평가합니다.', placeholder: '예: 지상 차 없는 공원형 단지, 조경 관리가 매우 잘 되어 있음', type: 'star-text', category: '단지 내부 (환경)', score: 0, note: '', isCustom: false },
  { id: 'default-int-3', title: '주차 편의성', description: '지하주차장 연결 여부, 세대당 주차 대수, 늦은 시간 주차 난이도를 기록합니다.', placeholder: '예: 전동 지하 2층까지 연결됨, 밤 10시 이후 이중주차 심함', type: 'star-text', category: '단지 내부 (환경)', score: 0, note: '', isCustom: false },
  { id: 'default-int-4', title: '관리 상태', description: '공동현관 보안, 도색 상태, 엘리베이터 노후도 등을 체크합니다. (팁: 공용 부위의 에너지 효율 시설인 LED 교체나 단열 상태를 함께 보시면 유지 관리비 예측에 도움이 됩니다.)', placeholder: '예: 올해 엘리베이터 전면 교체 완료, 현관 보안 철저함', type: 'star-text', category: '단지 내부 (환경)', score: 0, note: '', isCustom: false },

  // 부동산 (정보)
  { id: 'default-real-1', title: '급매 여부', description: '가격이 저렴한 구체적인 사유(층/향, 집주인 사정 등)를 기록하여 협상 카드로 활용합니다.', placeholder: '예: 집주인 해외 발령으로 인한 급매, 잔금일정 1달 내 조건', type: 'text-only', category: '부동산 (정보)', score: 0, note: '', isCustom: false },
  { id: 'default-real-2', title: '전세가율 및 수요', description: '투자금 규모와 임차 수요의 탄탄함을 평가합니다.', placeholder: '예: 전세가율 70%로 투자금 1억 필요, 갭투자 수요 많음', type: 'star-text', category: '부동산 (정보)', score: 0, note: '', isCustom: false },
  { id: 'default-real-3', title: '수리 상태', description: '샷시 포함 올수리 여부 등 향후 추가 비용 발생 가능성을 점수화합니다.', placeholder: '예: 10년 전 기본 수리, 입주 시 화장실 및 샷시 전면 교체 필요', type: 'star-text', category: '부동산 (정보)', score: 0, note: '', isCustom: false },
];

export function ChecklistPage() {
  const properties = usePropertyStore((state) => state.properties);
  const currentEditingId = usePropertyStore((state) => state.currentEditingId);
  const setCurrentEditingId = usePropertyStore((state) => state.setCurrentEditingId);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(currentEditingId || '');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBuiltYear, setNewBuiltYear] = useState('');
  const [newHouseholds, setNewHouseholds] = useState('');
  const [newParking, setNewParking] = useState('');
  const [newType, setNewType] = useState('84㎡');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_ITEMS);

  // 선택된 아파트가 바뀔 때마다 기존 체크리스트 데이터 불러오기
  useEffect(() => {
    if (selectedPropertyId && selectedPropertyId !== 'custom') {
      const property = properties.find(p => p.id === selectedPropertyId);
      if (property && property.checklist && property.checklist.length > 0) {
        setItems(property.checklist);
      } else {
        setItems(DEFAULT_ITEMS); // 기록이 없으면 기본값
      }
      setCurrentEditingId(selectedPropertyId);
    } else if (selectedPropertyId === 'custom') {
      setItems(DEFAULT_ITEMS);
      setCurrentEditingId(null);
    }
  }, [selectedPropertyId, properties, setCurrentEditingId]);

  // 페이지 마운트 시 (목록에서 클릭하고 넘어왔을 때)
  useEffect(() => {
    if (currentEditingId && currentEditingId !== selectedPropertyId) {
      setSelectedPropertyId(currentEditingId);
    }
  }, [currentEditingId]);


  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<ItemType>('star-text');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('단지 외부 (입지)');

  const handleScoreChange = (id: string, score: number) => {
    setItems(items.map(item => item.id === id ? { ...item, score } : item));
  };

  const handleNoteChange = (id: string, note: string) => {
    setItems(items.map(item => item.id === id ? { ...item, note } : item));
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handlePhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Image compression logic to prevent localStorage quota exceeded
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 800; // Max width or height

        if (width > height && width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Compress as JPEG with 60% quality

        setItems(prevItems => prevItems.map(item => {
          if (item.id === id) {
            return { ...item, photos: [...(item.photos || []), compressedDataUrl] };
          }
          return item;
        }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    // Reset file input value so the same file can be uploaded again if removed
    e.target.value = '';
  };

  const handleRemovePhoto = (id: string, photoIndex: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id && item.photos) {
        return { ...item, photos: item.photos.filter((_, idx) => idx !== photoIndex) };
      }
      return item;
    }));
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex(i => i.id === id);
    if (itemIndex < 0) return;
    const item = items[itemIndex];
    
    const categoryItems = items.filter(i => i.category === item.category);
    const catIndex = categoryItems.findIndex(i => i.id === id);
    
    if (direction === 'up' && catIndex > 0) {
      const swapTarget = categoryItems[catIndex - 1];
      const targetIndex = items.findIndex(i => i.id === swapTarget.id);
      
      const newItems = [...items];
      newItems[itemIndex] = swapTarget;
      newItems[targetIndex] = item;
      setItems(newItems);
    } else if (direction === 'down' && catIndex < categoryItems.length - 1) {
      const swapTarget = categoryItems[catIndex + 1];
      const targetIndex = items.findIndex(i => i.id === swapTarget.id);
      
      const newItems = [...items];
      newItems[itemIndex] = swapTarget;
      newItems[targetIndex] = item;
      setItems(newItems);
    }
  };

  const handleAddCustomItem = () => {
    if (!newItemTitle.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      title: newItemTitle,
      description: '사용자 추가 항목입니다.',
      placeholder: '자유롭게 세부 내용을 메모하세요...',
      type: newItemType,
      category: newItemCategory,
      score: 0,
      note: '',
      isCustom: true
    };
    setItems([...items, newItem]);
    setNewItemTitle('');
  };

  const handleRemoveCustomItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleGetGPS = () => {
    if (!navigator.geolocation) { alert('이 브라우저에서는 GPS를 지원하지 않습니다.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(pos.coords.latitude.toFixed(6));
        setNewLng(pos.coords.longitude.toFixed(6));
        setGpsLoading(false);
      },
      () => { alert('위치 정보를 가져올 수 없습니다. 위치 권한을 허용해 주세요.'); setGpsLoading(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleGetCoordsFromAddress = async () => {
    if (!newAddress.trim()) {
      alert('주소를 먼저 입력해주세요!');
      return;
    }
    setGpsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setNewLat(parseFloat(data[0].lat).toFixed(6));
        setNewLng(parseFloat(data[0].lon).toFixed(6)); // OSM returns 'lon'
        setGpsLoading(false);
      } else {
        alert('해당 주소의 위치를 찾을 수 없습니다. (예: 서울특별시 송파구 잠실동 19)');
        setGpsLoading(false);
      }
    } catch (e) {
      alert('주소 검색 중 오류가 발생했습니다.');
      setGpsLoading(false);
    }
  };

  const handleRegisterNew = () => {
    if (!newName.trim()) { alert('아파트 이름을 입력해주세요!'); return; }
    const newPropertyId = `prop-${Date.now()}`;
    const newProperty = {
      id: newPropertyId,
      isFavorite: false,
      status: 'recorded' as const,
      location: { lat: Number(newLat) || 37.5665, lng: Number(newLng) || 126.9780 },
      name: newName,
      address: newAddress || '주소 미입력',
      builtYear: Number(newBuiltYear) || new Date().getFullYear(),
      totalHouseholds: Number(newHouseholds) || 0,
      parkingSpots: Number(newParking) || 0,
      type: newType || '미정',
      checklist: DEFAULT_ITEMS
    };
    usePropertyStore.getState().addProperty(newProperty as any);
    setSelectedPropertyId(newPropertyId);
    setShowNewForm(false);
    setNewName(''); setNewAddress(''); setNewBuiltYear(''); setNewHouseholds(''); setNewParking(''); setNewLat(''); setNewLng('');
    alert(`[${newName}] 단지가 등록되었습니다!`);
  };

  const handleSave = () => {
    const targetProperty = properties.find(p => p.id === selectedPropertyId);
    if (!targetProperty) {
      alert('기록할 아파트(단지명)를 먼저 선택하거나 등록해주세요!');
      return;
    }
    usePropertyStore.getState().updateProperty(selectedPropertyId, { checklist: items, status: 'recorded' });
    alert(`[${targetProperty.name}] 임장 기록이 성공적으로 저장되었습니다!`);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>스마트 임장 체크리스트</h1>
        <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <Save size={18} /> 저장
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid var(--accent-primary)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
          <MapPin size={20} />
          <strong style={{ fontSize: '1.05rem' }}>어떤 아파트를 기록하시나요?</strong>
        </div>
        
        {/* 아파트 선택 또는 새로 등록 */}
        <select 
          value={selectedPropertyId} 
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
        >
          <option value="">기록할 단지를 선택하세요</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <button 
          onClick={() => setShowNewForm(!showNewForm)} 
          className="btn" 
          style={{ width: '100%', padding: '12px', background: showNewForm ? 'var(--status-bad)' : 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {showNewForm ? <><X size={18}/> 등록 취소</> : <><Plus size={18}/> 새 단지 등록</>}
        </button>

        {showNewForm && (
          <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '2px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', margin: 0 }}>📝 새 단지 정보 입력</h4>
            <input type="text" placeholder="아파트 이름 *" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }} />
            <input type="text" placeholder="주소 (예: 서울시 송파구 잠실동)" value={newAddress} onChange={e => setNewAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <input type="number" placeholder="준공년도" value={newBuiltYear} onChange={e => setNewBuiltYear(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="평형 (예: 84㎡)" value={newType} onChange={e => setNewType(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <input type="number" placeholder="총 세대수" value={newHouseholds} onChange={e => setNewHouseholds(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              <input type="number" placeholder="총 주차면수" value={newParking} onChange={e => setNewParking(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleGetGPS} disabled={gpsLoading} className="btn" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <Navigation size={14}/> GPS 현재위치
              </button>
              <button onClick={handleGetCoordsFromAddress} disabled={gpsLoading} className="btn" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <MapPin size={14}/> 주소로 좌표 찾기
              </button>
              <span style={{ fontSize: '0.8rem', color: newLat ? 'var(--status-good)' : 'var(--text-secondary)', width: '100%' }}>
                {newLat ? `✅ 핀 위치: ${newLat}, ${newLng}` : '위치 미설정 (지도 핀 표시용)'}
              </span>
            </div>
            <button onClick={handleRegisterNew} className="btn btn-primary" style={{ padding: '12px', width: '100%', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Plus size={18}/> 단지 등록하고 체크리스트 작성 시작
            </button>
          </div>
        )}

        {/* 단지 기본 정보 및 임장 날짜 수정 폼 */}
        {selectedPropertyId && selectedPropertyId !== 'custom' && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>단지 기본 정보 수정</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>임장 날짜</label>
                <input 
                  type="date" 
                  value={properties.find(p => p.id === selectedPropertyId)?.visitDate || ''} 
                  onChange={(e) => usePropertyStore.getState().updateProperty(selectedPropertyId, { visitDate: e.target.value })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>준공년도</label>
                <input 
                  type="number" 
                  value={properties.find(p => p.id === selectedPropertyId)?.builtYear || ''} 
                  onChange={(e) => usePropertyStore.getState().updateProperty(selectedPropertyId, { builtYear: Number(e.target.value) })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>총 세대수</label>
                <input 
                  type="number" 
                  value={properties.find(p => p.id === selectedPropertyId)?.totalHouseholds || ''} 
                  onChange={(e) => usePropertyStore.getState().updateProperty(selectedPropertyId, { totalHouseholds: Number(e.target.value) })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  총 주차 대수
                  {properties.find(p => p.id === selectedPropertyId)?.parkingSpots && properties.find(p => p.id === selectedPropertyId)?.totalHouseholds ? 
                    <strong style={{ color: 'var(--accent-primary)', marginLeft: '4px' }}>
                      (세대당 {((properties.find(p => p.id === selectedPropertyId)?.parkingSpots || 0) / (properties.find(p => p.id === selectedPropertyId)?.totalHouseholds || 1)).toFixed(2)}대)
                    </strong> : ''}
                </label>
                <input 
                  type="number" 
                  value={properties.find(p => p.id === selectedPropertyId)?.parkingSpots || ''} 
                  onChange={(e) => usePropertyStore.getState().updateProperty(selectedPropertyId, { parkingSpots: Number(e.target.value) })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {CATEGORIES.map(category => {
        const categoryItems = items.filter(item => item.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ borderBottom: `2px solid ${CATEGORY_BORDER_COLORS[category]}`, paddingBottom: '0.8rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                {category}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {CATEGORY_DESCRIPTIONS[category]}
              </p>
            </div>
            
            {categoryItems.map((item, index) => (
              <div key={item.id} className="glass-panel" style={{ 
                padding: '1.2rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                background: CATEGORY_COLORS[category],
                border: `1px solid ${CATEGORY_BORDER_COLORS[category]}`
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item.title}</strong>
                  
                  {/* 별점 영역을 제목과 같은 라인으로 배치 */}
                  {item.type === 'star-text' && (
                    <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleScoreChange(item.id, star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: star <= item.score ? 'var(--status-warning)' : 'var(--border-color)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                        >
                          <Star fill={star <= item.score ? 'currentColor' : 'none'} size={24} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', flex: 1, paddingRight: '1rem' }}>
                    {item.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={() => handleMoveItem(item.id, 'up')} disabled={index === 0} style={{ background: 'var(--bg-secondary)', border: 'none', color: index === 0 ? 'var(--border-color)' : 'var(--text-primary)', cursor: index === 0 ? 'default' : 'pointer', padding: '6px', borderRadius: '4px' }}>
                      <ChevronUp size={16} />
                    </button>
                    <button onClick={() => handleMoveItem(item.id, 'down')} disabled={index === categoryItems.length - 1} style={{ background: 'var(--bg-secondary)', border: 'none', color: index === categoryItems.length - 1 ? 'var(--border-color)' : 'var(--text-primary)', cursor: index === categoryItems.length - 1 ? 'default' : 'pointer', padding: '6px', borderRadius: '4px' }}>
                      <ChevronDown size={16} />
                    </button>
                    {item.isCustom && (
                      <button onClick={() => handleRemoveCustomItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--status-bad)', cursor: 'pointer', padding: '6px', marginLeft: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  placeholder={item.placeholder}
                  value={item.note}
                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                  style={{ width: '100%', minHeight: item.type === 'text-only' ? '100px' : '70px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem' }}
                />

                {/* 첨부된 사진 미리보기 영역 */}
                {item.photos && item.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {item.photos.map((photoUrl, photoIdx) => (
                      <div key={photoIdx} style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={photoUrl} alt="첨부 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          onClick={() => handleRemovePhoto(item.id, photoIdx)}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 사진 첨부 버튼 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" // 모바일에서 기본적으로 후면 카메라 띄우기
                    ref={(el) => fileInputRefs.current[item.id] = el}
                    onChange={(e) => handlePhotoUpload(item.id, e)}
                    style={{ display: 'none' }} 
                  />
                  <button 
                    onClick={() => fileInputRefs.current[item.id]?.click()}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    <Camera size={16} /> 현장 사진 촬영/추가
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="glass-panel" style={{ padding: '1.2rem', border: '2px dashed var(--border-color)', background: 'transparent', marginTop: '1rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>나만의 체크 항목 추가하기</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <select 
            value={newItemCategory} 
            onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}에 추가</option>)}
          </select>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={newItemType === 'star-text'} onChange={() => setNewItemType('star-text')} />
              <span style={{ fontSize: '0.9rem' }}>⭐ 별점 + 서술형</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={newItemType === 'text-only'} onChange={() => setNewItemType('text-only')} />
              <span style={{ fontSize: '0.9rem' }}>📝 서술형만</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="새 항목 제목 입력..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomItem()}
              style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
            />
            <button onClick={handleAddCustomItem} className="btn btn-primary" style={{ padding: '0 16px' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--glass-shadow)' }}>
        <Save size={20} /> 임장 기록 최종 저장하기
      </button>
    </div>
  );
}
