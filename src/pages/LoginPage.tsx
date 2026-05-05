import { useState } from 'react';
import { usePropertyStore } from '../store/usePropertyStore';

export function LoginPage() {
  const [code, setCode] = useState('');
  const setFamilyCode = usePropertyStore((state) => state.setFamilyCode);

  const handleCreateCode = () => {
    // 임시: 랜덤 6자리 문자열 생성
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFamilyCode(newCode);
    alert(`가족 공유 코드가 생성되었습니다: ${newCode}\n이 코드를 가족들에게 알려주세요!`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      alert('올바른 공유 코드를 입력해주세요.');
      return;
    }
    setFamilyCode(code.trim().toUpperCase());
    alert(`${code.trim().toUpperCase()} 공유 코드로 입장했습니다!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', background: 'var(--bg-primary)' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="text-gradient" style={{ marginBottom: '1rem', fontSize: '2rem' }}>Antigravity</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          가족과 함께 임장 기록을 실시간으로 공유해보세요.
        </p>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input
              type="text"
              placeholder="가족 공유 코드 입력 (예: A1B2C3)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                textAlign: 'center',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}>
            입장하기
          </button>
        </form>

        <div style={{ margin: '2rem 0', position: 'relative' }}>
          <hr style={{ borderTop: '1px solid var(--border-color)', opacity: 0.5 }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--glass-bg)', padding: '0 10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            또는 처음이신가요?
          </span>
        </div>

        <button onClick={handleCreateCode} className="btn" style={{ width: '100%', padding: '14px', border: '2px solid var(--accent-primary)', color: 'var(--accent-primary)', background: 'transparent', fontWeight: 600 }}>
          새로운 가족 공유 코드 만들기
        </button>
      </div>
    </div>
  );
}
