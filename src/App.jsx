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
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">DrugLookup starter</p>
        <h1>Supabase + Netlify 웹앱 기본 프레임워크</h1>
        <p className="description">
          React/Vite 기반 화면과 Supabase 연결 준비가 완료된 상태입니다. Netlify 배포를 위해 빌드 설정도 포함했습니다.
        </p>
        <div className="status-box">{status}</div>
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
