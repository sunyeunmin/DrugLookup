import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 설정 (본인의 Supabase URL과 Anon Key로 변경해 주세요)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://znzgptzwbumcbfmnmrfs.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kx5_uc3eHDnzaAQVRD1d6Q_mdKuvc8w';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  // UI 상태 관리: 'search' (검색 메인 및 결과) 또는 'detail' (상세 보기)
  const [currentScreen, setCurrentScreen] = useState('search'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2. 실시간 검색 함수 (2글자 이상 입력 시 작동)
  useEffect(() => {
    const fetchDrugs = async () => {
      const trimmedQuery = searchQuery.trim();
      
      // 2글자 미만일 때는 결과를 초기화
      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // 입력값으로 '시작하는' brand_name 또는 generic_name을 가진 데이터 쿼리
        // 대소문자 구분을 없애기 위해 ilike 사용
        const { data, error } = await supabase
          .from('drugs')
          .select('*')
          .or(`brand_name.ilike.${trimmedQuery}%,generic_name.ilike.${trimmedQuery}%`)
          .order('generic_name', { ascending: true });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error fetching drug data:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // 디바운스 효과를 주기 위해 타이머 설정 (키보드 타이핑이 끝날 때쯤 쿼리 실행)
    const delayDebounceTimer = setTimeout(() => {
      fetchDrugs();
    }, 200);

    return () => clearTimeout(delayDebounceTimer);
  }, [searchQuery]);

  // 약품 클릭 시 상세 화면으로 이동
  const handleSelectDrug = (drug) => {
    setSelectedDrug(drug);
    setCurrentScreen('detail');
  };

  // 상세 화면에서 뒤로 가기
  const handleBack = () => {
    setCurrentScreen('search');
    // 상세 페이지에서 복귀할 때 제목을 깔끔하게 유지하기 위해 초기화하지 않음
  };

  // 검색어 초기화 버튼 엑스 클릭 시
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div style={styles.appContainer}>
      {/* iPhone 16 Frame Wrapper (정밀 목업 스타일) */}
      <div style={styles.iphoneWrapper}>
        
        {/* iOS 상태 바 (Status Bar) */}
        <div style={styles.statusBar}>
          <span style={styles.statusTime}>9:41</span>
          <div style={styles.statusIcons}>
            <span style={{ marginRight: '4px' }}>📶</span>
            <span style={{ marginRight: '4px' }}>🛜</span>
            <span>🔋</span>
          </div>
        </div>

        {/* -------------------- 1. 검색 화면 (Search & Results) -------------------- */}
        {currentScreen === 'search' && (
          <div style={styles.screenContent}>
            <div style={styles.headerArea}>
              <div style={styles.subHeader}>Drug Lookup</div>
              <h1 style={styles.mainTitle}>Drug Lookup</h1>
            </div>

            {/* 검색창 컴포넌트 */}
            <div style={styles.searchBarWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Enter drug name (e.g., 'Ato')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button onClick={handleClearSearch} style={styles.clearButton}>
                  ✕
                </button>
              )}
            </div>

            {/* 메인 콘텐츠 영역 */}
            <div style={styles.mainScrollArea}>
              {searchQuery.trim().length < 2 ? (
                /* 가이드 화면 (첫 번째 스크린 상태) */
                <div style={styles.emptyStateContainer}>
                  <div style={styles.emptyIconWrapper}>
                    {/* 약병과 돋보기 형상화한 미니멀 SVG */}
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#b0b8c1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 3h8v4H6zM4 7h12v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
                      <circle cx="15" cy="15" r="4" fill="#fafafa" stroke="#8b95a1" strokeWidth="1.5" />
                      <line x1="18" y1="18" x2="22" y2="22" stroke="#8b95a1" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <p style={styles.emptyText}>Type at least 2 letters to search.</p>
                </div>
              ) : isLoading ? (
                /* 로딩 상태 */
                <div style={styles.loadingText}>Searching databases...</div>
              ) : searchResults.length > 0 ? (
                /* 검색 결과 목록 (두 번째 스크린 상태) */
                <div style={styles.listContainer}>
                  {searchResults.map((drug) => {
                    // 사용자가 검색한 글자를 기준으로 하이라이팅 처리하기 위한 이름 포맷
                    const displayGeneric = drug.generic_name;
                    const displayBrand = drug.brand_name ? ` (${drug.brand_name})` : '';
                    
                    return (
                      <div
                        key={drug.id}
                        onClick={() => handleSelectDrug(drug)}
                        style={styles.listItem}
                      >
                        <span style={styles.listItemText}>
                          {displayGeneric}{displayBrand}
                        </span>
                        <span style={styles.listItemChevron}>❯</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 검색 결과 없음 */
                <div style={styles.emptyStateContainer}>
                  <p style={styles.emptyText}>No drugs found starting with "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* iOS 하단 탭 바 (Tab Bar) */}
            <div style={styles.tabBar}>
              <div style={{ ...styles.tabItem, color: '#007aff' }}>
                <span style={{ fontSize: '18px', marginBottom: '2px' }}>🔍</span>
                <span style={{ fontSize: '10px', fontWeight: '500' }}>Search</span>
              </div>
              <div style={{ ...styles.tabItem, color: '#8b95a1' }}>
                <span style={{ fontSize: '18px', marginBottom: '2px' }}>🕒</span>
                <span style={{ fontSize: '10px', fontWeight: '500' }}>History</span>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 2. 약품 상세 정보 화면 (Drug Details) -------------------- */}
        {currentScreen === 'detail' && selectedDrug && (
          <div style={styles.screenContent}>
            {/* 상단 네비게이션 바 */}
            <div style={styles.navBar}>
              <button onClick={handleBack} style={styles.backButton}>
                <span style={{ marginRight: '4px', fontSize: '14px' }}>❮</span> Back
              </button>
              <span style={styles.navBarTitle}>
                {selectedDrug.brand_name || selectedDrug.generic_name}
              </span>
              <div style={{ width: '60px' }}></div> {/* 레이아웃 밸런스용 공백 */}
            </div>

            {/* 상세 내용 스크롤 영역 */}
            <div style={{ ...styles.mainScrollArea, padding: '16px' }}>
              <h2 style={styles.detailMainTitle}>
                "{selectedDrug.brand_name || selectedDrug.generic_name}"
              </h2>

              {/* 정보 카드 그리드 레이아웃 */}
              <div style={styles.detailCard}>
                
                {/* Brand Name */}
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>Brand Name</div>
                  <div style={styles.brandNameValue}>
                    {selectedDrug.brand_name || 'N/A'}
                  </div>
                </div>

                {/* Category */}
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>Category</div>
                  <div style={styles.infoValue}>{selectedDrug.category || '-'}</div>
                </div>

                {/* Generic Name */}
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>Generic Name</div>
                  <div style={styles.infoValue}>{selectedDrug.generic_name || '-'}</div>
                </div>

                {/* Classification */}
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>Classification</div>
                  <div style={styles.infoValue}>
                    {selectedDrug.drug_classificati || selectedDrug.drug_classification || '-'}
                  </div>
                </div>

                {/* Indication */}
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>Indication</div>
                  <div style={styles.infoValue}>{selectedDrug.indication || '-'}</div>
                </div>

                {/* Important Info (Remarks 매핑 및 강조 별표 추가) */}
                <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                  <div style={styles.infoLabel}>Important Info</div>
                  <div style={styles.importantInfoValue}>
                    {selectedDrug.remarks ? (
                      <>
                        <span style={{ color: '#ff3b30', marginRight: '4px' }}>★</span>
                        {selectedDrug.remarks}
                      </>
                    ) : (
                      'No specific remarks recorded.'
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 아이폰 하단 홈 인디케이터 (Home Indicator Bar) */}
        <div style={styles.homeIndicatorWrapper}>
          <div style={styles.homeIndicator}></div>
        </div>

      </div>
    </div>
  );
}

// 🎨 디자인 가이드라인 및 사진 피드백을 반영한 파스텔 무드의 모바일 UI 인라인 스타일
const styles = {
  appContainer: {
    display: 'block',
    width: '100%',
    padding: '40px 20px',
    backgroundColor: '#f5f7f9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    minHeight: '100vh',
  },
  iphoneWrapper: {
    display: 'block',
    position: 'relative',
    width: '393px', // iPhone 16 표준 해상도 가로비율 환산
    height: '852px', // iPhone 16 표준 세로비율
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '48px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 12px #1f2937', // 베젤 효과 구현
    overflow: 'hidden',
  },
  statusBar: {
    display: 'table',
    width: '100%',
    height: '44px',
    padding: '14px 24px 0 24px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  statusTime: {
    display: 'table-cell',
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  statusIcons: {
    display: 'table-cell',
    fontSize: '12px',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  screenContent: {
    display: 'block',
    width: '100%',
    height: '764px', // 상태 바와 홈바 공간을 제외한 내부 콘텐츠 영역
    position: 'relative',
  },
  headerArea: {
    padding: '12px 20px 4px 20px',
  },
  subHeader: {
    fontSize: '12px',
    color: '#8b95a1',
    fontWeight: '500',
    marginBottom: '2px',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#191f28',
    margin: '4px 0 12px 0',
  },
  searchBarWrapper: {
    position: 'relative',
    margin: '0 20px 14px 20px',
    backgroundColor: '#f2f4f6',
    borderRadius: '12px',
    padding: '8px 12px',
    display: 'block',
  },
  searchIcon: {
    fontSize: '14px',
    color: '#8b95a1',
    marginRight: '6px',
    verticalAlign: 'middle',
  },
  searchInput: {
    width: '82%',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    outline: 'none',
    color: '#333D4B',
    padding: '2px 0',
    verticalAlign: 'middle',
  },
  clearButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    backgroundColor: '#b0b8c1',
    color: '#ffffff',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    fontSize: '10px',
    cursor: 'pointer',
    lineHeight: '16px',
    padding: 0,
    textAlign: 'center',
  },
  mainScrollArea: {
    height: '610px',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
  emptyStateContainer: {
    paddingTop: '120px',
    textAlign: 'center',
  },
  emptyIconWrapper: {
    marginBottom: '16px',
    opacity: 0.6,
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7684',
    fontWeight: '500',
  },
  loadingText: {
    padding: '40px',
    textAlign: 'center',
    color: '#8b95a1',
    fontSize: '14px',
  },
  listContainer: {
    padding: '0 20px',
  },
  listItem: {
    display: 'table',
    width: '100%',
    padding: '16px 14px',
    borderBottom: '1px solid #f2f4f6',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    transition: 'background-color 0.2s',
    boxSizing: 'border-box',
  },
  listItemText: {
    display: 'table-cell',
    fontSize: '15px',
    color: '#191f28',
    fontWeight: '500',
    textAlign: 'left',
  },
  listItemChevron: {
    display: 'table-cell',
    width: '20px',
    fontSize: '13px',
    color: '#b0b8c1',
    textAlign: 'right',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '56px',
    borderTop: '1px solid #f2f4f6',
    backgroundColor: '#ffffff',
    display: 'table',
  },
  tabItem: {
    display: 'table-cell',
    textAlign: 'center',
    verticalAlign: 'middle',
    cursor: 'pointer',
  },
  navBar: {
    display: 'table',
    width: '100%',
    height: '48px',
    borderBottom: '1px solid #f2f4f6',
    padding: '0 8px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  backButton: {
    display: 'table-cell',
    width: '60px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#007aff',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  navBarTitle: {
    display: 'table-cell',
    fontSize: '16px',
    fontWeight: '600',
    color: '#191f28',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  detailMainTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#191f28',
    margin: '8px 0 20px 0',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e5e8eb',
    padding: '4px 16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  infoRow: {
    padding: '14px 0',
    borderBottom: '1px solid #f2f4f6',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#8b95a1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '15px',
    color: '#333d4b',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  brandNameValue: {
    fontSize: '22px',
    color: '#007aff', // 피드백 이미지의 시그니처 파란색 반영
    fontWeight: '700',
  },
  importantInfoValue: {
    fontSize: '14px',
    color: '#333d4b',
    fontWeight: '600',
    lineHeight: '1.5',
    backgroundColor: '#fff5f5', // 파스텔톤 경고 무드 배경
    padding: '10px 12px',
    borderRadius: '8px',
    marginTop: '6px',
  },
  homeIndicatorWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '34px',
    backgroundColor: '#ffffff',
    display: 'block',
  },
  homeIndicator: {
    width: '140px',
    height: '5px',
    backgroundColor: '#000000',
    borderRadius: '2.5px',
    margin: '18px auto 0 auto',
  }
};
