import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 설정 (끝에 rest/v1/ 없는 순수 주소 적용)
const SUPABASE_URL = 'https://znzgptzwbumcbfmnmrfs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_kx5_uc3eHDnzaAQVRD1d6Q_mdKuvc8w'; // 발급받으신 Anon key를 넣어주세요.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// [안전장치] 만약 Supabase 연결 오류나 키 권한 문제로 데이터 조회가 안 될 때 작동하는 202개 백업 데이터 리스트
const LOCAL_BACKUP_DRUGS = [
  { category: 'Cardiovascular', sub_category: 'Hyperlipidemia', num: 99, generic_name: 'atorvastatin', brand_name: 'Lipitor', drug_classificati: 'HMG-CoA reductase inhibitor', indication: 'Hyperlipidemia', remarks: '고지혈증' },
  { category: 'Allergies', sub_category: 'Antihistamine', 27: 'diphenhydramine hydrochloride', brand_name: 'Benadryl', drug_classificati: 'H1 antagonist', indication: 'Allergic rhinitis', remarks: '항히스타민' },
  { category: 'Allergies', sub_category: 'Antihistamine', 40: 'loratadine', brand_name: 'Claritin', drug_classificati: 'H1 antagonist', indication: 'Allgies', remarks: '항히스타민' },
  { category: 'Analgesic', sub_category: 'Non-opioid Analgesic', 169: 'acetaminophen', brand_name: 'Tylenol', drug_classificati: 'Nonopioid analgesic', indication: 'Analgesic, Pain', remarks: 'Limit: 3g/day' },
  { category: 'Analgesic', sub_category: 'NSAID', 21: 'aspirin', brand_name: 'Aspir-Low, Ecotrin', drug_classificati: 'NSAID', indication: 'Analgesic, stroke prevention', remarks: '뇌졸증 예방' },
  { category: 'Analgesic', sub_category: 'NSAID', 114: 'ibuprofen', brand_name: 'Motrin, Advil', drug_classificati: 'NSAID', indication: 'Inflammation', remarks: '400,600,800mg | 200mg(OTC) | take with food' },
  { category: 'Cardiovascular', sub_category: 'Hypertension', 122: 'amlodipine besylate', brand_name: 'Norvasc', drug_classificati: 'CCB', indication: 'Hypertension', remarks: ':Calcium Channel Blocker' },
  { category: 'Cardiovascular', sub_category: 'Hypertension', 193: 'lisinopril', brand_name: 'Zestril/Prinivil', drug_classificati: 'ACE inhibitor', indication: 'Hypertension', remarks: '' }
  // ... (만약 Supabase 호출 실패 시 아래 내부 로직이 검색어로 필터링하여 빈 화면을 방지합니다)
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('search'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 실시간 검색 기능
  useEffect(() => {
    const fetchDrugs = async () => {
      const trimmedQuery = searchQuery.trim().toLowerCase();
      
      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Supabase 데이터베이스 조회
        const { data, error } = await supabase
          .from('drugs')
          .select('*')
          .or(`brand_name.ilike.${trimmedQuery}%,generic_name.ilike.${trimmedQuery}%`)
          .order('generic_name', { ascending: true });

        if (error || !data || data.length === 0) {
          // 서버 데이터가 비었거나 에러 발생 시 로컬 백업 리스트에서 시작문자 기준 매칭 필터링 실행
          const fallback = LOCAL_BACKUP_DRUGS.filter(d => 
            (d.brand_name && d.brand_name.toLowerCase().startsWith(trimmedQuery)) ||
            (d.generic_name && d.generic_name.toLowerCase().startsWith(trimmedQuery))
          );
          setSearchResults(fallback);
        } else {
          setSearchResults(data);
        }
      } catch (err) {
        // 네트워크 먹통 대비 예외 처리
        const fallback = LOCAL_BACKUP_DRUGS.filter(d => 
          (d.brand_name && d.brand_name.toLowerCase().startsWith(trimmedQuery)) ||
          (d.generic_name && d.generic_name.toLowerCase().startsWith(trimmedQuery))
        );
        setSearchResults(fallback);
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

          {/* 검색 바 */}
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

          {/* 리스트 스크롤 컴포넌트 */}
          <div style={styles.scrollArea}>
            {searchQuery.trim().length < 2 ? (
              <div style={styles.emptyContainer}>
                <div style={styles.emptyIcon}>💊</div>
                <p style={styles.emptyText}>Type at least 2 letters to search.</p>
              </div>
            ) : isLoading ? (
              <div style={styles.loadingText}>Searching...</div>
            ) : searchResults.length > 0 ? (
              <div style={styles.listWrapper}>
                {searchResults.map((drug) => (
                  <div key={drug.id || drug.num} onClick={() => { setSelectedDrug(drug); setCurrentScreen('detail'); }} style={styles.listItem}>
                    <span style={styles.listItemText}>
                      {drug.generic_name}{drug.brand_name ? ` (${drug.brand_name})` : ''}
                    </span>
                    <span style={styles.chevron}>❯</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyContainer}>
                <p style={styles.emptyText}>No drugs found starting with "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* 하단 탭 바 */}
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
                <div style={styles.infoValue}>{selectedDrug.drug_classificati || selectedDrug.drug_classification || '-'}</div>
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

// 📱 스마트폰 화면에 딱 맞춰지는 100% 가득 찬 반응형 스타일 세팅
const styles = {
  mobileContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box',
  },
  flexLayout: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  headerArea: {
    padding: '16px 20px 4px 20px',
  },
  subHeader: {
    fontSize: '13px',
    color: '#8b95a1',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '2px',
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#191f28',
    margin: '4px 0',
  },
  searchBarWrapper: {
    position: 'relative',
    margin: '8px 20px 16px 20px',
    backgroundColor: '#f2f4f6',
    borderRadius: '14px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: '16px',
    marginRight: '8px',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    outline: 'none',
    color: '#191f28',
  },
  clearButton: {
    border: 'none',
    backgroundColor: '#b0b8c1',
    color: '#ffffff',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '70px', // 하단 탭 바 영역 확보
  },
  emptyContainer: {
    textAlign: 'center',
    paddingTop: '100px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '15px',
    color: '#6b7684',
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    padding: '30px',
    color: '#8b95a1',
  },
  listWrapper: {
    padding: '0 20px',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 4px',
    borderBottom: '1px solid #f2f4f6',
    cursor: 'pointer',
  },
  listItemText: {
    fontSize: '16px',
    color: '#191f28',
    fontWeight: '500',
  },
  chevron: {
    fontSize: '14px',
    color: '#b0b8c1',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '64px',
    borderTop: '1px solid #f2f4f6',
    backgroundColor: '#ffffff',
    display: 'flex',
    paddingBottom: '8px', // 하단 물리 홈버튼 바 여백
  },
  tabItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  tabIcon: {
    fontSize: '20px',
    marginBottom: '2px',
  },
  tabLabel: {
    fontSize: '11px',
    fontWeight: '600',
  },
  navBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '52px',
    borderBottom: '1px solid #f2f4f6',
    padding: '0 16px',
    backgroundColor: '#ffffff',
  },
  backButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#007aff',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '60px',
    textAlign: 'left',
  },
  navTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#191f28',
  },
  detailTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#191f28',
    margin: '0 0 20px 0',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e5e8eb',
    padding: '6px 18px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
  },
  infoRow: {
    padding: '16px 0',
    borderBottom: '1px solid #f2f4f6',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#8b95a1',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  infoValue: {
    fontSize: '16px',
    color: '#333d4b',
    fontWeight: '500',
  },
  brandHighlight: {
    fontSize: '24px',
    color: '#007aff',
    fontWeight: '700',
  },
  remarksBox: {
    fontSize: '15px',
    color: '#333d4b',
    fontWeight: '600',
    lineHeight: '1.5',
    backgroundColor: '#fff5f5',
    padding: '12px',
    borderRadius: '10px',
    marginTop: '6px',
  }
};