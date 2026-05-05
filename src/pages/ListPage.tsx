import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePropertyStore } from '../store/usePropertyStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import { Download, Building, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export function ListPage() {
  const navigate = useNavigate();
  const properties = usePropertyStore((state) => state.properties);
  const setCurrentEditingId = usePropertyStore((state) => state.setCurrentEditingId);
  const moveProperty = usePropertyStore((state) => state.moveProperty);
  const removeProperty = usePropertyStore((state) => state.removeProperty);

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

  // 그래프 색상 팔레트
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

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
        p.status === 'recorded' ? '기록완료' : '미방문'
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

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>임장 대시보드</h1>
        <button onClick={handleExportCSV} className="btn" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
          <Download size={18} /> 엑셀 다운로드
        </button>
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
                margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 15]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 13, fontWeight: 'bold' }} width={100} />
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
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '2px 6px', background: p.status === 'recorded' ? 'var(--status-good)' : 'var(--border-color)', color: p.status === 'recorded' ? 'white' : 'var(--text-secondary)', borderRadius: '6px' }}>
                      {p.status === 'recorded' ? '기록 완료' : '미방문'}
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
                    <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address.split(' ').slice(1, 3).join(' ') || '-'}</strong>
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
                
                {/* 요약 코멘트 (체크리스트의 메모 중 첫 번째 것 등) */}
                {p.checklist && p.checklist.filter(i => i.note.trim().length > 0).length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '10px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    💬 "{p.checklist.filter(i => i.note.trim().length > 0)[0].note.substring(0, 50)}{p.checklist.filter(i => i.note.trim().length > 0)[0].note.length > 50 ? '...' : ''}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
