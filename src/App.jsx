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
  const [activeTab, setActiveTab] = useState('search'); 
  
  // ✨ 신규: Control 탭 내부의 필터링 상태 (All, C-II, C-III&IV, C-V)
  const [controlFilter, setControlFilter] = useState('All');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('drugHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [controlledDrugs, setControlledDrugs] = useState([]);
  const [isControlLoading, setIsControlLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setAppHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    if (activeTab === 'control' && controlledDrugs.length === 0) {
      const fetchControlled = async () => {
        setIsControlLoading(true);
        try {
          const { data, error } = await supabase
            .from('drugs')
            .select('*')
            .not('control_drug', 'is', null)
            .order('generic_name', { ascending: true });
          if (error) throw error;
          
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

  // ✨ 신규: 등급에 따라 배지 색상을 자동으로 반환하는 함수
  const getBadgeColors = (controlStr) => {
    if (!controlStr) return {};
    const str = controlStr.toUpperCase();
    if (str.includes('C-III') || str.includes('C-IV')) {
      return { backgroundColor: '#fff0e6', color: '#ff9500', border: '1px solid #ffd6b3' }; // 주황색
    }
    if (str.includes('C-II')) {
      return { backgroundColor: '#ffebeb', color: '#ff3b30', border: '1px solid #ffc6c6' }; // 붉은색
    }
    if (str.includes('C-V')) {
      return { backgroundColor: '#fffbe6', color: '#d48806', border: '1px solid #ffe680' }; // 노란색 (가독성을 위해 약간 진한 노랑)
    }
    return { backgroundColor: '#f2f2f7', color: '#8e8e93', border: '1px solid #e5e5ea' }; // 기본값
  };

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
              {/* ✨ 배지에 동적 색상 적용 */}
              {drug.control_drug && (
                <span style={{ ...styles.listControlBadge, ...getBadgeColors(drug.control_drug) }}>
                  {drug.control_drug}
                </span>
              )}
            </div>
            {drug.brand_name && <span style={styles.listBrand}>{drug.brand_name}</span>}
          </div>
          <span style={styles.chevron}>❯</span>
        </div>
      ))}
    </div>
  );

  // ✨ 신규: 선택된 서브 탭에 맞춰서 약품 목록 필터링
  const filteredControlledDrugs = controlledDrugs.filter((drug) => {
    if (controlFilter === 'All') return true;
    const str = (drug.control_drug || '').toUpperCase();
    if (controlFilter === 'C-II') return str.includes('C-II') && !str.includes('C-III');
    if (controlFilter === 'C-III&IV') return str.includes('C-III') || str.includes('C-IV');
    if (controlFilter === 'C-V') return str.includes('C-V') && !str.includes('C-IV');
    return true;
  });

  return (
    <div style={{ ...styles.dynamicContainer, height: `${appHeight}px` }}>
      
      {/* -------------------- 1. 메인 화면 -------------------- */}
      {currentScreen === 'main' && (
        <div style={styles.flexLayout}>
          
          <div style={styles.topFixedArea}>
            <div style={styles.headerArea}>
              <h1 style={styles.mainTitle}>
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

            {/* ✨ 신규: Control 탭일 때 상단에 표시되는 서브 탭 (iOS Segmented Control 스타일) */}
            {activeTab === 'control' && (
              <div style={styles.segmentedControlContainer}>
                <div style={styles.segmentedControl}>
                  {['All', 'C-II', 'C-III&IV', 'C-V'].map((tab) => (
                    <div 
                      key={tab} 
                      onClick={() => setControlFilter(tab)}
                      style={{ ...styles.segmentBtn, ...(controlFilter === tab ? styles.segmentBtnActive : {}) }}
                    >
                      {tab === 'All' ? '전체' : tab}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.scrollArea}>
            
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

            {activeTab === 'control' && (
              isControlLoading ? (
                <div style={styles.loadingText}>Loading controlled drugs...</div>
              ) : filteredControlledDrugs.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <div style={styles.emptyIcon}>🛡️</div>
                  <p style={styles.emptyText}>No drugs match this filter.</p>
                </div>
              ) : (
                renderDrugList(filteredControlledDrugs)
              )
            )}
          </div>

          <div style={styles.tabBar}>
            <div onClick={() => setActiveTab('search')} style={{ ...styles.tabItem, color: activeTab === 'search' ? '#007aff' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🔍</span>
              <span style={styles.tabLabel}>Search</span>
            </div>
            <div onClick={() => setActiveTab('history')} style={{ ...styles.tabItem, color: activeTab === 'history' ? '#007aff' : '#8e8e93' }}>
              <span style={styles.tabIcon}>🕒</span>
              <span style={styles.tabLabel}>History</span>
            </div>
            <div onClick={() => { setActiveTab('control'); setControlFilter('All'); }} style={{ ...styles.tabItem, color: activeTab === 'control' ? '#ff3b30' : '#8e8e93' }}>
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
                  {/* ✨ 상세화면 배지에도 동적 색상 적용 */}
                  {selectedDrug.control_drug && (
                    <div style={{ ...styles.controlBadge, ...getBadgeColors(selectedDrug.control_drug) }}>
                      {selectedDrug.control_drug}
                    </div>
                  )}
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
  headerArea: { padding: `max(${isSmall ? '16px' : '20px'}, env(safe-area-inset-top)) 20px 12px 20px` },
  mainTitle: { fontSize: isSmall ? '28px' : '32px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: '-0.5px' },
  searchContainer: { padding: `4px 20px ${isSmall ? '12px' : '16px'} 20px`, borderBottom: '1px solid #e5e5ea' },
  searchBarWrapper: { position: 'relative', backgroundColor: '#7676801F', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center' },
  searchIcon: { fontSize: '16px', marginRight: '6px', color: '#8e8e93' },
  searchInput: { flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '17px', outline: 'none', color: '#000' },
  clearButton: { border: 'none', backgroundColor: '#c7c7cc', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // ✨ 신규: Control 화면의 서브 탭 디자인 (iOS 세그먼트 컨트롤 스타일)
  segmentedControlContainer: { padding: '8px 20px 12px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5ea' },
  segmentedControl: { display: 'flex', backgroundColor: '#e4e4e9', borderRadius: '8px', padding: '2px' },
  segmentBtn: { flex: 1, textAlign: 'center', padding: '6px 0', fontSize: '13px', fontWeight: '600', color: '#000', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' },
  segmentBtnActive: { backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' },

  scrollArea: { flex: 1, overflowY: 'auto', backgroundColor: '#ffffff' },
  
  // ✨ 업데이트: 한 화면에 더 많이 보이도록 리스트 위아래 패딩(여백)을 대폭 촘촘하게 축소
  listWrapper: { padding: '0 20px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isSmall ? '8px 0' : '10px 0', borderBottom: '1px solid #e5e5ea', cursor: 'pointer' },
  listItemContent: { display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '12px' },
  listTitleRow: { display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }, // 마진도 4px -> 2px로 축소
  listGeneric: { fontSize: isSmall ? '15px' : '16px', color: '#000', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.25', wordBreak: 'break-word' },
  
  listControlBadge: { fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', marginTop: '2px', overflow: 'hidden', flexShrink: 0 },
  listBrand: { fontSize: isSmall ? '12px' : '13px', color: '#8e8e93', fontWeight: '400' },
  chevron: { fontSize: '14px', color: '#c7c7cc', fontWeight: '600' },
  clearHistoryBtn: { backgroundColor: 'transparent', color: '#ff3b30', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', padding: '8px 16px' },

  tabBar: { flexShrink: 0, height: 'calc(54px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)', borderTop: '1px solid #e5e5ea', backgroundColor: '#f8f8f8', display: 'flex' },
  tabItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'color 0.2s ease' },
  tabIcon: { fontSize: '20px', marginBottom: '2px' },
  tabLabel: { fontSize: '10px', fontWeight: '600' },
  
  emptyContainer: { textAlign: 'center', paddingTop: '80px' },
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
  
  controlBadge: { fontSize: isSmall ? '13px' : '15px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, marginTop: '2px' },
  
  treeWrapper: { display: 'flex', alignItems: 'center', marginTop: '4px' },
  treeLine: { color: '#c7c7cc', fontFamily: 'monospace', fontSize: '18px', marginRight: '8px' },
  
  importantCard: { backgroundColor: '#fff7f7', border: '1px solid #ffdfdf', borderRadius: '16px', padding: isSmall ? '14px 16px' : '18px 20px', margin: isSmall ? '0 16px 12px 16px' : '0 16px 16px 16px' },
  importantHeader: { display: 'flex', alignItems: 'center', marginBottom: isSmall ? '6px' : '8px' },
  importantIcon: { color: '#ff3b30', fontSize: '16px', marginRight: '6px' },
  importantTitle: { fontSize: '12px', color: '#ff3b30', fontWeight: '700', letterSpacing: '0.5px' },
  importantText: { fontSize: isSmall ? '14px' : '16px', color: '#3a3a3c', fontWeight: '500', lineHeight: '1.4' }
});