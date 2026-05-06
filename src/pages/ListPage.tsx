import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePropertyStore } from '../store/usePropertyStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Download, Building, Trash2, ChevronUp, ChevronDown, Upload, FileSpreadsheet } from 'lucide-react';

export const getPropertyStatus = (p: any) => {
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

export const getDisplayAddress = (addr: string) => {
  if (!addr) return '-';
  const words = addr.split(/[\s()]+/);
  const gu = words.find(w => w.endsWith('구'));
  const dong = words.find(w => w.endsWith('동'));
  return (gu && dong) ? `${gu} ${dong}` : addr.split(' ').slice(1, 3).join(' ') || '-';
};

export function ListPage() {
  const navigate = useNavigate();
  const properties = usePropertyStore((state) => state.properties);
  const setCurrentEditingId = usePropertyStore((state) => state.setCurrentEditingId);
  const moveProperty = usePropertyStore((state) => state.moveProperty);
  const removeProperty = usePropertyStore((state) => state.removeProperty);
  const addProperty = usePropertyStore((state) => state.addProperty);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 차트용 데이터 가공 (단지별 종합 점수 및 카테고리별 점수)
  const chartData = useMemo(() => {
    const categories = ['단지 외부 (입지)', '단지 내부 (환경)', '부동산 (정보)'];
    
    const data = properties.map(p => {
      const dataPoint: any = { name: p.name, total: 0 };
      
      if (!p.checklist || p.checklist.length === 0) {
        categories.forEach(cat => dataPoint[cat] = 0);
        return dataPoint;
      }
      
      let totalScore = 0;
      categories.forEach(category => {
        const items = p.checklist!.filter(i => i.category === category && i.type === 'star-text' && i.score > 0);
        const avg = items.length > 0 ? items.reduce((sum, i) => sum + i.score, 0) / items.length : 0;
        const roundedAvg = Number(avg.toFixed(1));
        dataPoint[category] = roundedAvg;
        totalScore += roundedAvg;
      });
      
      dataPoint.total = Number(totalScore.toFixed(1));
      return dataPoint;
    });

    // 종합 점수(total) 기준으로 내림차순 정렬 (1등이 맨 위로 오게)
    return data.sort((a, b) => b.total - a.total);
  }, [properties]);

  const handleExportCSV = () => {
    if (properties.length === 0) {
      alert('기록된 데이터가 없습니다.');
      return;
    }

    // 1. 모든 단지에서 쓰인 고유한 체크리스트 항목 제목 추출 (커스텀 항목 포함)
    const headerSet = new Set<string>();
    const headerMeta = new Map<string, 'star-text' | 'text-only'>();
    
    properties.forEach(p => {
      if (p.checklist) {
        p.checklist.forEach(item => {
          headerSet.add(item.title);
          headerMeta.set(item.title, item.type);
        });
      }
    });
    
    const uniqueTitles = Array.from(headerSet);

    // 2. CSV 헤더 구성
    const csvHeaderRow = ['임장날짜', '단지명', '주소', '준공년도', '세대수', '주차수', '평형', '상태'];
    uniqueTitles.forEach(title => {
      const type = headerMeta.get(title);
      if (type === 'star-text') {
        csvHeaderRow.push(`"${title} (점수)"`);
      }
      csvHeaderRow.push(`"${title} (메모)"`);
    });
    
    let csvContent = csvHeaderRow.join(',') + '\n';
    
    // 3. 데이터 행 추가
    properties.forEach(p => {
      const row = [
        p.visitDate ? `"${p.visitDate}"` : '미입력',
        `"${p.name}"`,
        `"${p.address}"`,
        p.builtYear,
        p.totalHouseholds,
        p.parkingSpots || 0,
        `"${p.type}"`,
        getPropertyStatus(p).text.replace(' ', '')
      ];
      
      uniqueTitles.forEach(title => {
        const item = p.checklist?.find(i => i.title === title);
        const type = headerMeta.get(title);
        
        if (type === 'star-text') {
          row.push(item ? item.score : 0);
        }
        
        // 메모 내용의 따옴표(")를 CSV 표준에 맞게("") 치환
        const note = item ? item.note.replace(/"/g, '""') : '';
        row.push(`"${note}"`); // 줄바꿈이 있어도 따옴표로 감싸면 한 셀에 들어감
      });
      
      csvContent += row.join(',') + "\n";
    });

    // 한글 깨짐 방지를 위한 BOM 추가
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `임장기록_상세데이터_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const DEFAULT_CHECKLIST_TITLES = [
    { title: '대중교통 접근성 및 경사도', type: 'star-text', category: '단지 외부 (입지)' },
    { title: '초등학교 및 학군', type: 'star-text', category: '단지 외부 (입지)' },
    { title: '선호상권', type: 'star-text', category: '단지 외부 (입지)' },
    { title: '주요 유해시설', type: 'star-text', category: '단지 외부 (입지)' },
    { title: '동간 거리 및 일조량', type: 'star-text', category: '단지 내부 (환경)' },
    { title: '조경 및 커뮤니티', type: 'star-text', category: '단지 내부 (환경)' },
    { title: '주차 편의성', type: 'star-text', category: '단지 내부 (환경)' },
    { title: '관리 상태', type: 'star-text', category: '단지 내부 (환경)' },
    { title: '급매 여부', type: 'text-only', category: '부동산 (정보)' },
    { title: '전세가율 및 수요', type: 'star-text', category: '부동산 (정보)' },
    { title: '수리 상태', type: 'star-text', category: '부동산 (정보)' },
  ];

  const handleDownloadTemplate = () => {
    const csvHeaderRow = ['임장날짜', '단지명', '주소', '준공년도', '세대수', '주차수', '평형', '상태'];
    const sampleRow = ['2024-05-06', '래미안 원베일리', '서울특별시 서초구 반포동', '2023', '2990', '4000', '84㎡', '기록완료'];
    
    DEFAULT_CHECKLIST_TITLES.forEach(item => {
      if (item.type === 'star-text') {
        csvHeaderRow.push(`"${item.title} (점수)"`);
        sampleRow.push('4');
      }
      csvHeaderRow.push(`"${item.title} (메모)"`);
      sampleRow.push('"여기에는 상세 메모를 작성하시면 됩니다."');
    });
    
    const csvContent = csvHeaderRow.join(',') + '\n' + sampleRow.join(',') + '\n';
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `임장기록_업로드양식.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    // Remove BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    const result: string[][] = [];
    for (let i = 0; i < lines.length; i++) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"' && lines[i][j+1] === '"' && inQuotes) {
          current += '"';
          j++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current);
      result.push(row);
    }
    return result;
  };

  const handleUploadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(buffer);
      
      let text = '';
      const isUtf8BOM = uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF;
      
      if (isUtf8BOM) {
        text = new TextDecoder('utf-8').decode(uint8Array);
      } else {
        try {
          // Attempt to decode as UTF-8 strictly
          text = new TextDecoder('utf-8', { fatal: true }).decode(uint8Array);
        } catch (err) {
          // If UTF-8 fails (e.g., standard Excel CSV save in Korea), decode as EUC-KR (CP949)
          text = new TextDecoder('euc-kr').decode(uint8Array);
        }
      }

      const rows = parseCSV(text);
      if (rows.length < 2) {
        alert('데이터가 없거나 잘못된 양식입니다.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      const headerMap = new Map<string, { title: string, type: string, scoreIdx?: number, noteIdx?: number, category: string }>();
      for (let c = 8; c < rows[0].length; c++) {
        let colName = rows[0][c].replace(/"/g, '').trim();
        if (colName.endsWith(' (점수)')) {
          const title = colName.replace(' (점수)', '');
          if (!headerMap.has(title)) {
            const defaultItem = DEFAULT_CHECKLIST_TITLES.find(d => d.title === title);
            headerMap.set(title, { title, type: 'star-text', category: defaultItem?.category || '단지 외부 (입지)' });
          }
          headerMap.get(title)!.scoreIdx = c;
        } else if (colName.endsWith(' (메모)')) {
          const title = colName.replace(' (메모)', '');
          if (!headerMap.has(title)) {
            const defaultItem = DEFAULT_CHECKLIST_TITLES.find(d => d.title === title);
            headerMap.set(title, { title, type: 'text-only', category: defaultItem?.category || '단지 외부 (입지)' });
          }
          headerMap.get(title)!.noteIdx = c;
        }
      }
      
      let addedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 8) continue;

        const visitDate = row[0].replace(/"/g, '').trim();
        const name = row[1].replace(/"/g, '').trim();
        const address = row[2].replace(/"/g, '').trim();
        const builtYear = parseInt(row[3].replace(/"/g, '').trim(), 10) || 0;
        const totalHouseholds = parseInt(row[4].replace(/"/g, '').trim(), 10) || 0;
        const parkingSpots = parseInt(row[5].replace(/"/g, '').trim(), 10) || 0;
        const type = row[6].replace(/"/g, '').trim();
        const statusStr = row[7].replace(/"/g, '').trim();
        
        if (!name) continue;

        const checklist = Array.from(headerMap.values()).map(info => {
          let score = info.scoreIdx !== undefined ? Number(row[info.scoreIdx]?.replace(/"/g, '').trim()) : 0;
          if (isNaN(score)) score = 0;
          let note = info.noteIdx !== undefined ? row[info.noteIdx]?.replace(/"/g, '').trim() : '';
          if (!note) note = '';
          return {
            id: `uploaded-chk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: info.title,
            description: '',
            placeholder: '',
            type: info.type as any,
            category: info.category as any,
            score,
            note,
            isCustom: !DEFAULT_CHECKLIST_TITLES.some(d => d.title === info.title)
          };
        });

        const newProperty: any = {
          id: `uploaded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isFavorite: false,
          status: statusStr.includes('기록') ? 'recorded' : 'unvisited',
          location: { lat: 37.5665, lng: 126.9780 },
          name,
          address,
          builtYear,
          totalHouseholds,
          parkingSpots,
          type,
          visitDate: visitDate === '미입력' ? undefined : visitDate,
          checklist
        };
        
        addProperty(newProperty);
        addedCount++;
      }
      
      alert(`${addedCount}개의 단지가 성공적으로 업로드되었습니다.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>임장 대시보드</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadTemplate} className="btn" style={{ padding: '8px 12px', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <FileSpreadsheet size={16} /> 양식 다운로드
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ padding: '8px 12px', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Upload size={16} /> 엑셀 업로드
          </button>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleUploadCSV} 
            style={{ display: 'none' }} 
          />
          <button onClick={handleExportCSV} className="btn" style={{ padding: '8px 12px', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Download size={16} /> 상세 데이터 다운로드
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '-0.5rem' }}>
        기록된 임장 데이터를 한눈에 비교하고 분석하세요.
      </p>

      {/* 종합 점수 랭킹 바 차트 (누적 막대) */}
      <div className="glass-panel" style={{ padding: '1.5rem', height: Math.max(300, properties.length * 50 + 100) + 'px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', textAlign: 'center' }}>🏆 아파트 종합 점수 랭킹 (Total Score)</h3>
        
        {properties.length > 0 ? (
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 15]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 'bold' }} width={90} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: number, name: string) => [`${value}점`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="단지 외부 (입지)" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                <Bar dataKey="단지 내부 (환경)" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                <Bar dataKey="부동산 (정보)" stackId="a" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            비교할 임장 기록이 없습니다.
          </div>
        )}
      </div>

      {/* 리스트 테이블 뷰 */}
      <div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>단지 목록 ({properties.length}개)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {properties.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              아직 등록된 단지가 없습니다.<br/>체크리스트 탭에서 아파트를 기록해보세요.
            </div>
          ) : (
            properties.map((p, index) => (
              <div 
                key={p.id} 
                onClick={() => {
                  setCurrentEditingId(p.id);
                  navigate('/checklist');
                }}
                className="glass-panel" 
                style={{ cursor: 'pointer', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: p.isFavorite ? '4px solid var(--status-favorite)' : '4px solid var(--border-color)', transition: 'transform 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <Building size={18} color="var(--accent-primary)" />
                    <strong style={{ fontSize: '1.1rem' }}>{p.name}</strong>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '2px 6px', background: getPropertyStatus(p).bg, color: getPropertyStatus(p).color, borderRadius: '6px' }}>
                      {getPropertyStatus(p).text}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveProperty(p.id, 'up'); }} 
                      disabled={index === 0} 
                      style={{ background: 'var(--bg-secondary)', border: 'none', color: index === 0 ? 'var(--border-color)' : 'var(--text-primary)', cursor: index === 0 ? 'default' : 'pointer', padding: '6px', borderRadius: '4px' }}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveProperty(p.id, 'down'); }} 
                      disabled={index === properties.length - 1} 
                      style={{ background: 'var(--bg-secondary)', border: 'none', color: index === properties.length - 1 ? 'var(--border-color)' : 'var(--text-primary)', cursor: index === properties.length - 1 ? 'default' : 'pointer', padding: '6px', borderRadius: '4px' }}
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if(window.confirm(`'${p.name}' 단지 기록을 완전히 삭제하시겠습니까?`)) {
                          removeProperty(p.id);
                        }
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--status-bad)', cursor: 'pointer', padding: '6px', marginLeft: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.85rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
