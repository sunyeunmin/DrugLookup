import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 설정 (주소 뒤에 rest/v1/ 제거된 상태 유지)
const SUPABASE_URL = 'https://znzgptzwbumcbfmnmrfs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kx5_uc3eHDnzaAQVRD1d6Q_mdKuvc8w'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('search'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2. 실시간 Supabase 테이블 쿼리 로직
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
        // 테이블에서 brand_name이나 generic_name이 입력값으로 시작되는 행 실시간 조회
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
      
      {/* -------------------- 1. 검색 메인 화면 -------------------- */}
      {currentScreen === 'search' && (
        <div style={styles.flexLayout}>
          <div style={styles.headerArea}>
            <div style={styles.subHeader}>Drug Lookup</div>
            <h1 style={styles.mainTitle}>Drug Lookup</h1>
          </div>

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
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} style={styles.clearButton}>✕</button>
            )}
          </div>

          <div style={styles.scrollArea}>
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
                  <div key={drug.id} onClick={() => { setSelectedDrug(drug); setCurrentScreen('detail'); }} style={styles.listItem}>
                    <span style={styles.listItemText}>
                      {drug.generic_name}{drug.brand_name ? ` (${drug.brand_name})` : ''}
                    </span>
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
          </div>

          <div style={styles.tabBar}>
            <div style={{ ...styles.tabItem, color: '#007aff' }}>
              <span style={styles.tabIcon}>🔍</span>
              <span style={styles.tabLabel}>Search</span>
            </div>
            <div style={{ ...styles.tabItem, color: '#8b95a1' }}>
              <span style={styles.tabIcon}>🕒</span>
              <span style={styles.tabLabel}>History</span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- 2. 약품 상세 정보 화면 -------------------- */}
      {currentScreen === 'detail' && selectedDrug && (
        <div style={styles.flexLayout}>
          <div style={styles.navBar}>
            <button onClick={() => setCurrentScreen('search')} style={styles.backButton}>❮ Back</button>
            <span style={styles.navTitle}>{selectedDrug.brand_name || selectedDrug.generic_name}</span>
            <div style={{ width: '60px' }}></div>
          </div>

          <div style={{ ...styles.scrollArea, padding: '20px 16px' }}>
            <h2 style={styles.detailTitle}>"{selectedDrug.brand_name || selectedDrug.generic_name}"</h2>
            
            <div style={styles.detailCard}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Brand Name</div>
                <div style={styles.brandHighlight}>{selectedDrug.brand_name || 'N/A'}</div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Category</div>
                <div style={styles.infoValue}>{selectedDrug.category || '-'}</div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Generic Name</div>
                <div style={styles.infoValue}>{selectedDrug.generic_name || '-'}</div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Classification</div>
                <div style={styles.infoValue}>{selectedDrug.drug_classification || selectedDrug.drug_classificati || '-'}</div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Indication</div>
                <div style={styles.infoValue}>{selectedDrug.indication || '-'}</div>
              </div>
              <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
                <div style={styles.infoLabel}>Important Info</div>
                <div style={styles.remarksBox}>
                  <span style={{ color: '#ff3b30', marginRight: '4px' }}>★</span>
                  {selectedDrug.remarks || 'No specific remarks recorded.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  mobileContainer: { width: '100vw', height: '100vh', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden', position: 'relative', boxSizing: 'border-box' },
  flexLayout: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%' },
  headerArea: { padding: '16px 20px 4px 20px' },
  subHeader: { fontSize: '13px', color: '#8b95a1', fontWeight: '500', textAlign: 'center', marginBottom: '2px' },
  mainTitle: { fontSize: '32px', fontWeight: '800', color: '#191f28', margin: '4px 0' },
  searchBarWrapper: { position: 'relative', margin: '8px 20px 16px 20px', backgroundColor: '#f2f4f6', borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'center' },
  searchIcon: { fontSize: '16px', marginRight: '8px' },
  searchInput: { flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '16px', outline: 'none', color: '#191f28' },
  clearButton: { border: 'none', backgroundColor: '#b0b8c1', color: '#ffffff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingBottom: '70px' },
  emptyContainer: { textAlign: 'center', paddingTop: '100px' },
  emptyIcon: { fontSize: '48px', marginBottom: '12px', opacity: 0.5 },
  emptyText: { fontSize: '15px', color: '#6b7684', fontWeight: '500' },
  loadingText: { textAlign: 'center', padding: '30px', color: '#8b95a1' },
  errorText: { padding: '14px', margin: '10px 20px', backgroundColor: '#fff5f5', color: '#ff3b30', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textAlign: 'center' },
  listWrapper: { padding: '0 20px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 4px', borderBottom: '1px solid #f2f4f6', cursor: 'pointer' },
  listItemText: { fontSize: '16px', color: '#191f28', fontWeight: '500' },
  chevron: { fontSize: '14px', color: '#b0b8c1' },
  tabBar: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: '64px', borderTop: '1px solid #f2f4f6', backgroundColor: '#ffffff', display: 'flex', paddingBottom: '8px' },
  tabItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  tabIcon: { fontSize: '20px', marginBottom: '2px' },
  tabLabel: { fontSize: '11px', fontWeight: '600' },
  navBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px', borderBottom: '1px solid #f2f4f6', padding: '0 16px', backgroundColor: '#ffffff' },
  backButton: { border: 'none', backgroundColor: 'transparent', color: '#007aff', fontSize: '16px', fontWeight: '500', cursor: 'pointer', width: '60px', textAlign: 'left' },
  navTitle: { fontSize: '17px', fontWeight: '600', color: '#191f28' },
  detailTitle: { fontSize: '28px', fontWeight: '700', color: '#191f28', margin: '0 0 20px 0' },
  detailCard: { backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #e5e8eb', padding: '6px 18px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)' },
  infoRow: { padding: '16px 0', borderBottom: '1px solid #f2f4f6' },
  infoLabel: { fontSize: '12px', color: '#8b95a1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
  infoValue: { fontSize: '16px', color: '#333d4b', fontWeight: '500' },
  brandHighlight: { fontSize: '24px', color: '#007aff', fontWeight: '700' },
  remarksBox: { fontSize: '15px', color: '#333d4b', fontWeight: '600', lineHeight: '1.5', backgroundColor: '#fff5f5', padding: '12px', borderRadius: '10px', marginTop: '6px' }
};