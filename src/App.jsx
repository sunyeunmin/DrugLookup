import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 설정
const SUPABASE_URL = 'https://znzgptzwbumcbfmnmrfs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kx5_uc3eHDnzaAQVRD1d6Q_mdKuvc8w'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [appHeight, setAppHeight] = useState(window.innerHeight);
  const isSmallScreen = appHeight < 715; 

  const [currentScreen, setCurrentScreen] = useState('main'); 
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'history', 'control'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 히스토리 상태 관리
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('drugHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // ✨ 신규: Control 탭용 상태 관리
  const [controlledDrugs, setControlledDrugs] = useState([]);
  const [isControlLoading, setIsControlLoading] = useState(false);

  // 화면 높이 재계산
  useEffect(() => {
    const handleResize = () => setAppHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 약품 클릭 시 상세화면 이동 및 History 저장
  const handleDrugSelect = (drug) => {
    setSelectedDrug(drug);
    setCurrentScreen('detail');
    setHistory((prevHistory) => {
      const filtered = prevHistory.filter(item => item.id !== drug.id);
      const newHistory = [drug, ...filtered].slice(0, 50); 
      localStorage.setItem('drugHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // 🔍 검색 로직
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
        setErrorMessage('데이터베이스 연결 실패. RLS 설정 또는 키를 확인하세요.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    const delayDebounceTimer = setTimeout(() => fetchDrugs(), 150);
    return () => clearTimeout(delayDebounceTimer);
  }, [searchQuery]);

  // ✨ 신규: Control 탭 클릭 시 규제 약물만 불러오는 로직
  useEffect(() => {
    if (activeTab === 'control' && controlledDrugs.length === 0) {
      const fetchControlled = async () => {
        setIsControlLoading(true);
        try {
          const { data, error } = await supabase
            .from('drugs')
            .select('*')
            .not('control_drug', 'is', null) // DB에서 null이 아닌 것만 가져오기
            .order('generic_name', { ascending: true });
          if (error) throw error;
          
          // 가져온 데이터 중 빈 문자열('')인 데이터 한 번 더 걸러내기
          const validControlled = (data || []).filter(d => d.control_drug && d.control_drug.trim() !== '');
          setControlledDrugs(validControlled);
        } catch (err) {
          console.error('Controlled drugs fetch error:', err.message);
        } finally {
          setIsControlLoading(false);
        }
      };
      fetchControlled();
    }
  }, [activeTab]);

  const styles = getStyles(isSmallScreen);

  // ✨ 반복되는 리스트 아이템 디자인을 하나의 함수로 깔끔하게 정리 (검색, 히스토리, 컨트롤 탭 모두 사용)
  const renderDrugList = (drugsList) => (
    <div style={styles.listWrapper}>
      {drugsList.map((drug, index) => (
        <div key={`${drug.id}-${index}`} onClick={() => handleDrugSelect(drug)} style={styles.listItem}>
          <div style={styles.listItemContent}>
            <div style={styles.listTitleRow}>
              <span style={{ 
                ...styles.listGeneric,
                ...(drug.generic_name.length > 40 ? { fontSize: isSmallScreen ? '13px' : '14px' } :
                    drug.generic_name.length > 25 ? { fontSize: isSmallScreen ? '14px' : '15px' } : {})
               }}>
                {drug.generic_name}
              </span>
              {drug.control_drug && <span style={styles.listControlBadge}>{drug.control_drug}</span>}
            </div>
            {drug.brand_name && <span style={styles.listBrand}>{drug.brand_name}</span>}
          </div>
          <span style={styles.chevron}>❯</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ ...styles.dynamicContainer, height: `${appHeight}px` }}>
      
      {/* -------------------- 1. 메인 화면 -------------------- */}
      {currentScreen === 'main' && (
        <div style={styles.flexLayout}>
          
          <div style={styles.topFixedArea}>
            <div style={styles.headerArea}>
              <h1 style={styles.mainTitle}>
                {/* 탭에 따라 타이틀 자동 변경 */}
                {activeTab === 'search' ? 'Drug Lookup' : activeTab === 'history' ? 'Recent History' : 'Controlled Drugs'}
              </h1>
            </div>

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
          </div>

          <div style={styles.scrollArea}>
            
            {/* 1-1. Search 탭 화면 */}
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
                  renderDrugList(searchResults)
                ) : (
                  !errorMessage && (
                    <div style={styles.emptyContainer}>
                      <p style={styles.emptyText}>No drugs found starting with "{searchQuery}"</p>
                    </div>
                  )
                )}
              </>
            )}

            {/* 1-2. History 탭 화면 */}
            {activeTab === 'history' && (
              history.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>🕒</div>
                  <p style={styles.emptyText}>No recent history.</p>
                </div>
              ) : (
                <>
                  {renderDrugList(history)}
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <button onClick={() => { setHistory([]); localStorage.removeItem('drugHistory'); }} style={styles.clearHistoryBtn}>
                      Clear All History
                    </button>
                  </div>
                </>
              )
            )}

            {/* 1-3. ✨ 신규: Control 탭 화면 */}
            {activeTab === 'control' && (
              isControlLoading ? (
                <div style={styles.loadingText}>Loading controlled drugs...</div>
              ) : controlledDrugs.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>🛡️</div>
                  <p style={styles.emptyText}>No controlled drugs found.</p>
                </div>
              ) : (
                renderDrugList(controlledDrugs)
              )
            )}
          </div>

          {/* ✨ 신규: 3개의 버튼으로 나뉜 하단 탭 바 */}
          <div style={styles.tabBar}>
            <div onClick={() => setActiveTab('search')} style={{ ...styles.tabItem, color: activeTab === 'search' ? '#007aff' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🔍</span>
              <span style={styles.tabLabel}>Search</span>
            </div>
            <div onClick={() => setActiveTab('history')} style={{ ...styles.tabItem, color: activeTab === 'history' ? '#007aff' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🕒</span>
              <span style={styles.tabLabel}>History</span>
            </div>
            <div onClick={() => setActiveTab('control')} style={{ ...styles.tabItem, color: activeTab === 'control' ? '#ff3b30' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🛡️</span>
              <span style={styles.tabLabel}>Control</span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. 약품 상세 화면 -------------------- */}
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
                  {selectedDrug.control_drug && <div style={styles.controlBadge}>{selectedDrug.control_drug}</div>}
                </div>
              </div>
              <div style={{ ...styles.cardRow, borderBottom: 'none', paddingBottom: 0 }}>
                <div style={styles.label}>Generic Name</div>
                <div style={{ 
                  ...styles.genericNameText,
                  ...(selectedDrug.generic_name.length > 40 ? { fontSize: isSmallScreen ? '16px' : '17px' } :
                      selectedDrug.generic_name.length > 25 ? { fontSize: isSmallScreen ? '17px' : '19px' } : {})
                 }}>
                  {selectedDrug.generic_name || '-'}
                </div>
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

            {selectedDrug.remarks && selectedDrug.remarks.trim() !== '' && (
              <div style={styles.importantCard}>
                <div style={styles.importantHeader}>
                  <span style={styles.importantIcon}>★</span>
                  <span style={styles.importantTitle}>IMPORTANT INFO</span>
                </div>
                <div style={styles.importantText}>{selectedDrug.remarks}</div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 스타일링
const getStyles = (isSmall) => ({
  dynamicContainer: { width: '100vw', backgroundColor: '#F2F2F7', overflow: 'hidden', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  flexLayout: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%' },
  
  topFixedArea: { flexShrink: 0, backgroundColor: '#ffffff' },
  headerArea: { padding: `max(${isSmall ? '16px' : '24px'}, env(safe-area-inset-top)) 20px ${isSmall ? '8px' : '12px'} 20px` },
  mainTitle: { fontSize: isSmall ? '28px' : '34px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: '-0.5px' },
  searchContainer: { padding: `4px 20px ${isSmall ? '12px' : '16px'} 20px`, borderBottom: '1px solid #e5e5ea' },
  searchBarWrapper: { position: 'relative', backgroundColor: '#7676801F', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center' },
  searchIcon: { fontSize: '16px', marginRight: '6px', color: '#8e8e93' },
  searchInput: { flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '17px', outline: 'none', color: '#000' },
  clearButton: { border: 'none', backgroundColor: '#c7c7cc', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  scrollArea: { flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' },
  
  listWrapper: { padding: '0 20px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isSmall ? '12px 0' : '16px 0', borderBottom: '1px solid #e5e5ea', cursor: 'pointer' },
  listItemContent: { display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '12px' },
  listTitleRow: { display: 'flex', alignItems: 'flex-start', marginBottom: '4px' },
  listGeneric: { fontSize: isSmall ? '16px' : '17px', color: '#000', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', wordBreak: 'break-word' },
  listControlBadge: { backgroundColor: '#ffebeb', color: '#ff3b30', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', marginTop: '2px', overflow: 'hidden', flexShrink: 0 },
  listBrand: { fontSize: isSmall ? '13px' : '14px', color: '#8e8e93', fontWeight: '400' },
  chevron: { fontSize: '16px', color: '#c7c7cc', fontWeight: '600' },
  clearHistoryBtn: { backgroundColor: 'transparent', color: '#ff3b30', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', padding: '8px 16px' },

  tabBar: { flexShrink: 0, height: 'calc(54px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)', borderTop: '1px solid #e5e5ea', backgroundColor: '#f8f8f8', display: 'flex' },
  tabItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'color 0.2s ease' },
  tabIcon: { fontSize: '20px', marginBottom: '2px' },
  tabLabel: { fontSize: '10px', fontWeight: '600' },
  
  emptyContainer: { textAlign: 'center', paddingTop: '100px' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px', opacity: 0.3 },
  emptyText: { fontSize: '16px', color: '#8e8e93', fontWeight: '500' },
  loadingText: { textAlign: 'center', padding: '30px', color: '#8e8e93' },
  errorText: { padding: '14px', margin: '10px 20px', backgroundColor: '#ffebeb', color: '#ff3b30', borderRadius: '12px', fontSize: '14px', fontWeight: '500', textAlign: 'center' },

  detailNavBar: { flexShrink: 0, display: 'flex', alignItems: 'center', height: 'calc(44px + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)', paddingRight: '10px', paddingLeft: '10px', backgroundColor: '#F2F2F7' },
  navBackButton: { border: 'none', backgroundColor: 'transparent', color: '#007aff', fontSize: '17px', fontWeight: '400', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' },
  
  detailScrollArea: { flex: 1, overflowY: 'auto', paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))' },
  
  detailTitleArea: { padding: `4px 20px ${isSmall ? '12px' : '16px'} 20px` },
  detailMainTitle: { fontSize: isSmall ? '28px' : '34px', fontWeight: '800', color: '#000', margin: 0, letterSpacing: '-0.5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  
  premiumCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: isSmall ? '12px 16px' : '16px 20px', margin: isSmall ? '0 16px 12px 16px' : '0 16px 16px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
  cardRow: { paddingBottom: isSmall ? '10px' : '16px', marginBottom: isSmall ? '10px' : '16px', borderBottom: '1px solid #f2f2f7' },
  label: { fontSize: isSmall ? '11px' : '12px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: isSmall ? '4px' : '6px' },
  valueText: { fontSize: isSmall ? '15px' : '17px', color: '#1c1c1e', fontWeight: '500', lineHeight: '1.3' },
  
  brandNameWrapper: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandNameText: { fontSize: isSmall ? '20px' : '24px', color: '#007aff', fontWeight: '700', letterSpacing: '-0.3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', marginRight: '8px' },
  genericNameText: { fontSize: isSmall ? '18px' : '22px', color: '#34c759', fontWeight: '700', letterSpacing: '-0.3px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', wordBreak: 'break-word' },
  
  controlBadge: { backgroundColor: '#ffebeb', color: '#ff3b30', fontSize: isSmall ? '13px' : '15px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, marginTop: '2px' },
  
  treeWrapper: { display: 'flex', alignItems: 'center', marginTop: '4px' },
  treeLine: { color: '#c7c7cc', fontFamily: 'monospace', fontSize: '18px', marginRight: '8px' },
  
  importantCard: { backgroundColor: '#fff7f7', border: '1px solid #ffdfdf', borderRadius: '16px', padding: isSmall ? '14px 16px' : '18px 20px', margin: isSmall ? '0 16px 12px 16px' : '0 16px 16px 16px' },
  importantHeader: { display: 'flex', alignItems: 'center', marginBottom: isSmall ? '6px' : '8px' },
  importantIcon: { color: '#ff3b30', fontSize: '16px', marginRight: '6px' },
  importantTitle: { fontSize: '12px', color: '#ff3b30', fontWeight: '700', letterSpacing: '0.5px' },
  importantText: { fontSize: isSmall ? '14px' : '16px', color: '#3a3a3c', fontWeight: '500', lineHeight: '1.4' }
});