import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
)

function App() {
  const status = useMemo(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return 'Supabase 환경변수를 설정하면 DB 연결 준비가 완료됩니다.'
    }

    return `Supabase 클라이언트가 준비되었습니다: ${import.meta.env.VITE_SUPABASE_URL}`
  }, [])

  return (
    // 💡 모바일 화면에서 잘리지 않도록 겉 껍데기를 유연한 flex 구조로 변경하고 가로 스크롤을 방지합니다.
    <main className="app-shell" style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px', // 모바일 좌우 여백 확보
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* 💡 카드가 아이폰 16 너비를 넘어가지 않도록 max-width와 너비 100%를 지정합니다. */}
      <section className="card" style={{
        width: '100%',
        maxWidth: '400px', // 아이폰 너비 안쪽으로 예쁘게 모이도록 제한
        margin: '0 auto',
        boxSizing: 'border-box',
        wordBreak: 'break-all' // 긴 Supabase URL이 화면 밖으로 삐져나가지 않게 강제 줄바꿈
      }}>
        <p className="eyebrow">DrugLookup starter</p>
        <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', wordBreak: 'keep-all' }}>
          Supabase + Netlify 웹앱 기본 프레임워크
        </h1>
        <p className="description">
          React/Vite 기반 화면과 Supabase 연결 준비가 완료된 상태입니다. Netlify 배포를 위해 빌드 설정도 포함했습니다.
        </p>
        
        {/* URL 텍스트가 담기는 박스도 너비 제한 및 줄바꿈 처리 */}
        <div className="status-box" style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
          {status}
        </div>
        
        <ul className="checklist">
          <li>Vite React 프로젝트 생성 완료</li>
          <li>Supabase JS 클라이언트 설치 완료</li>
          <li>Netlify 배포 설정 파일 추가 완료</li>
        </ul>
      </section>
    </main>
  )
}

export default App