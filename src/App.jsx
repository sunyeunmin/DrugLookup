import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 설정
const SUPABASE_URL = 'https://znzgptzwbumcbfmnmrfs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kx5_uc3eHDnzaAQVRD1d6Q_mdKuvc8w'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  // 화면 및 탭 상태 관리
  const [currentScreen, setCurrentScreen] = useState('main'); // 'main' 또는 'detail'
  const [activeTab, setActiveTab] = useState('search'); // 'search' 또는 'history'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 검색 기록 상태 관리 (앱을 껐다 켜도 유지되도록 localStorage 사용)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('drugHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // 약품 선택 시 상세 화면으로 이동 및 History 저장 로직
  const handleDrugSelect = (drug) => {
    setSelectedDrug(drug);
    setCurrentScreen('detail');

    setHistory((prevHistory) => {
      // 중복 방지를 위해 기존 기록에서 제거 후 맨 앞에 추가
      const filtered = prevHistory.filter(item => item.id !== drug.id);
      const newHistory = [drug, ...filtered].slice(0, 50); // 최근 50개까지만 저장
      localStorage.setItem('drugHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // 실시간 검색 쿼리 로직
  useEffect(() => {
    const fetchDrugs = async () => {
      const trimmedQuery = searchQuery.trim();
      
      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        setErrorMessage('');
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      
      try {
        const { data, error } = await supabase
          .from('drugs')
          .select('*')
          .or(`brand_name.ilike.${trimmedQuery}%,generic_name.ilike.${trimmedQuery}%`)
          .order('generic_name', { ascending: true });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Database fetch error:', err.message);
        setErrorMessage('데이터베이스 연결 실패. RLS 설정 또는 키를 확인하세요.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceTimer = setTimeout(() => {
      fetchDrugs();
    }, 150);

    return () => clearTimeout(delayDebounceTimer);
  }, [searchQuery]);

  return (
    <div style={styles.mobileContainer}>
      
      {/* -------------------- 1. 메인 화면 (Search & History 탭) -------------------- */}
      {currentScreen === 'main' && (
        <div style={styles.flexLayout}>
          
          <div style={styles.headerArea}>
            <h1 style={styles.mainTitle}>{activeTab === 'search' ? 'Drug Lookup' : 'Recent History'}</h1>
          </div>

          {/* Search 탭일 때만 검색창 표시 */}
          {activeTab === 'search' && (
            <div style={styles.searchContainer}>
              <div style={styles.searchBarWrapper}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Enter drug name (e.g., 'val')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} style={styles.clearButton}>✕</button>
                )}
              </div>
            </div>
          )}

          {/* 스크롤 영역 (Search 결과 또는 History 목록) */}
          <div style={styles.scrollArea}>
            
            {/* Search 탭 컨텐츠 */}
            {activeTab === 'search' && (
              <>
                {errorMessage && <div style={styles.errorText}>{errorMessage}</div>}
                {searchQuery.trim().length < 2 ? (
                  <div style={styles.emptyContainer}>
                    <div style={styles.emptyIcon}>💊</div>
                    <p style={styles.emptyText}>Type at least 2 letters to search.</p>
                  </div>
                ) : isLoading ? (
                  <div style={styles.loadingText}>Searching databases...</div>
                ) : searchResults.length > 0 ? (
                  <div style={styles.listWrapper}>
                    {searchResults.map((drug) => (
                      <div key={drug.id} onClick={() => handleDrugSelect(drug)} style={styles.listItem}>
                        <div style={styles.listItemContent}>
                          <div style={styles.listTitleRow}>
                            <span style={styles.listGeneric}>{drug.generic_name}</span>
                            {drug.control_drug && <span style={styles.listControlBadge}>{drug.control_drug}</span>}
                          </div>
                          {drug.brand_name && <span style={styles.listBrand}>{drug.brand_name}</span>}
                        </div>
                        <span style={styles.chevron}>❯</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  !errorMessage && (
                    <div style={styles.emptyContainer}>
                      <p style={styles.emptyText}>No drugs found starting with "{searchQuery}"</p>
                    </div>
                  )
                )}
              </>
            )}

            {/* History 탭 컨텐츠 */}
            {activeTab === 'history' && (
              history.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>🕒</div>
                  <p style={styles.emptyText}>No recent history.</p>
                </div>
              ) : (
                <div style={styles.listWrapper}>
                  {history.map((drug, index) => (
                    <div key={`${drug.id}-${index}`} onClick={() => handleDrugSelect(drug)} style={styles.listItem}>
                      <div style={styles.listItemContent}>
                        <div style={styles.listTitleRow}>
                          <span style={styles.listGeneric}>{drug.generic_name}</span>
                          {drug.control_drug && <span style={styles.listControlBadge}>{drug.control_drug}</span>}
                        </div>
                        {drug.brand_name && <span style={styles.listBrand}>{drug.brand_name}</span>}
                      </div>
                      <span style={styles.chevron}>❯</span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <button onClick={() => { setHistory([]); localStorage.removeItem('drugHistory'); }} style={styles.clearHistoryBtn}>
                      Clear All History
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* 하단 탭 바 */}
          <div style={styles.tabBar}>
            <div onClick={() => setActiveTab('search')} style={{ ...styles.tabItem, color: activeTab === 'search' ? '#007aff' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🔍</span>
              <span style={styles.tabLabel}>Search</span>
            </div>
            <div onClick={() => setActiveTab('history')} style={{ ...styles.tabItem, color: activeTab === 'history' ? '#007aff' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🕒</span>
              <span style={styles.tabLabel}>History</span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. 약품 상세 정보 화면 (프리미엄 UI) -------------------- */}
      {currentScreen === 'detail' && selectedDrug && (
        <div style={styles.flexLayout}>
          
          <div style={styles.detailNavBar}>
            <button onClick={() => setCurrentScreen('main')} style={styles.navBackButton}>
              <span style={{ fontSize: '20px', marginRight: '4px' }}>‹</span> Back
            </button>
          </div>

          <div style={styles.detailScrollArea}>
            
            <div style={styles.detailTitleArea}>
              <h2 style={styles.detailMainTitle}>
                "{selectedDrug.brand_name || selectedDrug.generic_name}"
              </h2>
            </div>
            
            <div style={styles.premiumCard}>
              <div style={styles.cardRow}>
                <div style={styles.label}>Brand Name</div>
                <div style={styles.brandNameWrapper}>
                  <div style={styles.brandNameText}>{selectedDrug.brand_name || 'N/A'}</div>
                  {selectedDrug.control_drug && (
                    <div style={styles.controlBadge}>
                      {selectedDrug.control_drug}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ ...styles.cardRow, borderBottom: 'none', paddingBottom: 0 }}>
                <div style={styles.label}>Generic Name</div>
                <div style={styles.genericNameText}>{selectedDrug.generic_name || '-'}</div>
              </div>
            </div>

            <div style={styles.premiumCard}>
              <div style={{ ...styles.cardRow, borderBottom: 'none', paddingBottom: 0 }}>
                <div style={styles.label}>Category</div>
                <div style={styles.valueText}>{selectedDrug.category || '-'}</div>
                {selectedDrug.sub_category && (
                  <div style={styles.treeWrapper}>
                    <span style={styles.treeLine}>└─</span>
                    <span style={styles.valueText}>{selectedDrug.sub_category}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.premiumCard}>
              <div style={styles.cardRow}>
                <div style={styles.label}>Classification</div>
                <div style={styles.valueText}>{selectedDrug.drug_classification || selectedDrug.drug_classificati || '-'}</div>
              </div>
              <div style={{ ...styles.cardRow, borderBottom: 'none', paddingBottom: 0 }}>
                <div style={styles.label}>Indication</div>
                <div style={styles.valueText}>{selectedDrug.indication || '-'}</div>
              </div>
            </div>

            <div style={styles.importantCard}>
              <div style={styles.importantHeader}>
                <span style={styles.importantIcon}>★</span>
                <span style={styles.importantTitle}>IMPORTANT INFO</span>
              </div>
              <div style={styles.importantText}>
                {selectedDrug.remarks || 'No specific remarks recorded.'}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 스타일링
const styles = {
  mobileContainer: { width: '100vw', height: '100vh', backgroundColor: '#F2F2F7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden', position: 'relative', boxSizing: 'border-box' },
  flexLayout: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%' },
  
  // 검색창 배경 일체감 수정 (어색한 회색 띠 제거)
  headerArea: { padding: '24px 20px 12px 20px', backgroundColor: '#ffffff' },
  mainTitle: { fontSize: '34px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: '-0.5px' },
  searchContainer: { backgroundColor: '#ffffff', padding: '4px 20px 16px 20px', borderBottom: '1px solid #e5e5ea' },
  searchBarWrapper: { position: 'relative', backgroundColor: '#7676801F', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center' },
  searchIcon: { fontSize: '16px', marginRight: '6px', color: '#8e8e93' },
  searchInput: { flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '17px', outline: 'none', color: '#000' },
  clearButton: { border: 'none', backgroundColor: '#c7c7cc', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  scrollArea: { flex: 1, overflowY: 'auto', paddingBottom: '70px', backgroundColor: '#ffffff' },
  
  listWrapper: { padding: '0 20px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #e5e5ea', cursor: 'pointer' },
  listItemContent: { display: 'flex', flexDirection: 'column' },
  listTitleRow: { display: 'flex', alignItems: 'center', marginBottom: '4px' },
  listGeneric: { fontSize: '17px', color: '#000', fontWeight: '500' },
  listControlBadge: { backgroundColor: '#ffebeb', color: '#ff3b30', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', overflow: 'hidden' },
  listBrand: { fontSize: '14px', color: '#8e8e93', fontWeight: '400' },
  chevron: { fontSize: '16px', color: '#c7c7cc', fontWeight: '600' },
  
  // History 삭제 버튼
  clearHistoryBtn: { backgroundColor: 'transparent', color: '#ff3b30', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', padding: '8px 16px' },

  tabBar: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '64px', borderTop: '1px solid #e5e5ea', backgroundColor: '#f8f8f8', display: 'flex', paddingBottom: '8px' },
  tabItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  tabIcon: { fontSize: '20px', marginBottom: '2px' },
  tabLabel: { fontSize: '10px', fontWeight: '600' },
  
  emptyContainer: { textAlign: 'center', paddingTop: '100px' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px', opacity: 0.3 },
  emptyText: { fontSize: '16px', color: '#8e8e93', fontWeight: '500' },
  loadingText: { textAlign: 'center', padding: '30px', color: '#8e8e93' },
  errorText: { padding: '14px', margin: '10px 20px', backgroundColor: '#ffebeb', color: '#ff3b30', borderRadius: '12px', fontSize: '14px', fontWeight: '500', textAlign: 'center' },

  detailNavBar: { display: 'flex', alignItems: 'center', height: '56px', padding: '0 10px', backgroundColor: '#F2F2F7' },
  navBackButton: { border: 'none', backgroundColor: 'transparent', color: '#007aff', fontSize: '17px', fontWeight: '400', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' },
  detailScrollArea: { flex: 1, overflowY: 'auto', paddingBottom: '40px' },
  detailTitleArea: { padding: '4px 20px 16px 20px' },
  detailMainTitle: { fontSize: '34px', fontWeight: '800', color: '#000', margin: 0, letterSpacing: '-0.5px' },
  premiumCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px 20px', margin: '0 16px 16px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  cardRow: { paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #f2f2f7' },
  label: { fontSize: '12px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  valueText: { fontSize: '17px', color: '#1c1c1e', fontWeight: '500', lineHeight: '1.4' },
  brandNameWrapper: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brandNameText: { fontSize: '24px', color: '#007aff', fontWeight: '700', letterSpacing: '-0.3px' },
  genericNameText: { fontSize: '22px', color: '#34c759', fontWeight: '700', letterSpacing: '-0.3px' },
  controlBadge: { backgroundColor: '#ffebeb', color: '#ff3b30', fontSize: '15px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', overflow: 'hidden' },
  treeWrapper: { display: 'flex', alignItems: 'center', marginTop: '4px' },
  treeLine: { color: '#c7c7cc', fontFamily: 'monospace', fontSize: '18px', marginRight: '8px' },
  importantCard: { backgroundColor: '#fff7f7', border: '1px solid #ffdfdf', borderRadius: '16px', padding: '18px 20px', margin: '0 16px 16px 16px' },
  importantHeader: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
  importantIcon: { color: '#ff3b30', fontSize: '16px', marginRight: '6px' },
  importantTitle: { fontSize: '12px', color: '#ff3b30', fontWeight: '700', letterSpacing: '0.5px' },
  importantText: { fontSize: '16px', color: '#3a3a3c', fontWeight: '500', lineHeight: '1.5' }
};