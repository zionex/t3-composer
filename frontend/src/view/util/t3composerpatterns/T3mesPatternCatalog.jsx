// UI Pattern 메뉴 — T3MES 취합본 카탈로그 (TabPage 단위)
//
// 데이터 출처:
//   - C:\Project\T3MES\*.html → frontend/public/t3mes/ (정적 serve)
//   - _data/t3mes-tabs.json   : 각 HTML 의 TabPage 메타 (scripts/extract-t3mes-tabs.cjs 가 생성)
//
// 흐름:
//   1) 카탈로그 — Section(MES/SCM) → Group → File → TabPage(목록) 트리
//      각 TabPage 가 클릭 가능한 entry. 탭이 없는 HTML 은 file 자체가 entry.
//   2) TabPage 클릭 → 본문 iframe 에 해당 HTML 을 로드 + onLoad 시 contentWindow.switchTab(tabIndex) 호출
//      → iframe 내부의 해당 패널이 활성화된 상태로 보임
//   3) [목록으로] 버튼 / 브라우저 뒤로가기로 카탈로그 복귀
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Avatar,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import OpenInNewIcon  from '@mui/icons-material/OpenInNew';
import SearchIcon     from '@mui/icons-material/Search';
import ClearIcon      from '@mui/icons-material/Clear';
import DashboardIcon  from '@mui/icons-material/Dashboard';

import { ContentInner, WorkArea } from '@wingui/common/imports';

import tabsByFile from './_data/t3mes-tabs.json';
import PressPreview from './PressPreview';

// ─────────────────────────────────────────
// Section/Group/File 메타 (T3MES index.html 구조)
// ─────────────────────────────────────────
const SECTIONS = [
  // ─── SCM 우선 (사용자 지정: SCM 을 제일 먼저, 그 안에서 Master Plan 이 첫 번째 그룹) ───
  {
    section: 'SCM',
    sectionLabel: 'SCM (Supply Chain Management)',
    icon: '🌐', color: '#9d72ff',
    groups: [
      { title: 'Master Plan (MP)', titleEn: 'Master Plan (MP)', icon: '📊', color: '#9d72ff', items: [
        { label: 'MP 컨트롤 보드',                labelEn: 'MP Control Board',                       file: 'scm_mp_1_controlboard_ui_patterns.html' },
        { label: '수급/생산 계획 패턴',           labelEn: 'Supply & Production Plan Patterns',      file: 'scm_mp_2_plan_ui_patterns.html' },
        { label: '계획 대비 실적 모니터링',       labelEn: 'Plan vs Actual Monitoring',              file: 'scm_mp_3_monitoring_ui_patterns.html' },
      ]},
      { title: 'S&OP', titleEn: 'S&OP', icon: '📈', color: '#ffb347', items: [
        { label: 'S&OP 통합 화면',                labelEn: 'S&OP Integrated Screen',                 file: 'scm_snop_1_ui_patterns.html' },
        // 분석 차트 / KPI 대시보드 — 사용자 요청으로 목록 제외
      ]},
    ],
  },
  {
    section: 'MES',
    sectionLabel: 'MES (Manufacturing Execution System)',
    icon: '🏭', color: '#4794fe',
    groups: [
      { title: '영업관리 (Sales)', titleEn: 'Sales Management', icon: '💼', color: '#4d9fff', items: [
        { label: '수주/오더 등록 패턴',          labelEn: 'Order Entry Patterns',                    file: 'mes_sales_1_order_ui_patterns.html' },
        { label: '출하/실적 처리 패턴',           labelEn: 'Shipping & Result Patterns',              file: 'mes_sales_2_result_ui_patterns.html' },
        { label: '영업 현황 모니터링',           labelEn: 'Sales Status Monitoring',                 file: 'mes_sales_3_monitoring_ui_patterns.html' },
      ]},
      { title: '생산관리 (Production)', titleEn: 'Production Management', icon: '⚙️', color: '#00e5ff', items: [
        { label: '작업지시 패턴',                labelEn: 'Work Order Patterns',                     file: 'mes_production_1_order_ui_patterns.html' },
        { label: '생산실적 등록 패턴',            labelEn: 'Production Result Entry Patterns',        file: 'mes_production_2_result_ui_patterns.html' },
        { label: '생산 현황 모니터링',            labelEn: 'Production Status Monitoring',            file: 'mes_production_3_monitoring_ui_patterns.html' },
      ]},
      { title: '구매관리 (MRP)', titleEn: 'Purchasing (MRP)', icon: '🛒', color: '#00d68f', items: [
        { label: '발주/구매요청 패턴',            labelEn: 'PO / Purchase Request Patterns',          file: 'mes_mrp_1_order_ui_patterns.html' },
        { label: '입고/구매실적 패턴',            labelEn: 'GR / Purchase Result Patterns',           file: 'mes_mrp_2_result_ui_patterns.html' },
        { label: '구매 현황 모니터링',            labelEn: 'Purchase Status Monitoring',              file: 'mes_mrp_3_monitoring_ui_patterns.html' },
      ]},
      { title: '자재 및 Lot 관리', titleEn: 'Material & Lot Management', icon: '📦', color: '#ffb347', items: [
        { label: '재고 조회 패턴',                labelEn: 'Stock Browse Patterns',                   file: 'mes_stock_1_retrive_ui_patterns.html' },
        { label: '재고 조정/이동 패턴',           labelEn: 'Stock Adjustment / Move Patterns',        file: 'mes_stock_2_modify_ui_patterns.html' },
        { label: '재고 현황 모니터링',            labelEn: 'Stock Status Monitoring',                 file: 'mes_stock_3_monitoring_ui_patterns.html' },
        { label: 'Lot 관리 및 추적',              labelEn: 'Lot Management & Tracking',               file: 'mes_lot_manage_ui_patterns.html' },
      ]},
      { title: '품질관리 (QC)', titleEn: 'Quality Control (QC)', icon: '🔬', color: '#f43f5e', items: [
        { label: '품질 검사 및 등록',             labelEn: 'Quality Inspection & Entry',              file: 'mes_qc_1_operation_ui_patterns.html' },
        { label: '품질 현황 모니터링',            labelEn: 'Quality Status Monitoring',               file: 'mes_qc_2_operation_monitoring_patterns.html' },
      ]},
      { title: 'Tracking', titleEn: 'Tracking', icon: '📍', color: '#9d72ff', items: [
        { label: '오더 트래킹',                  labelEn: 'Order Tracking',                          file: 'mes_tracking_1_order_ui_patterns.html' },
        { label: '물류/재고 트래킹',              labelEn: 'Logistics / Stock Tracking',              file: 'mes_tracking_2_stock_ui_patterns.html' },
      ]},
      { title: 'Route & WIP', titleEn: 'Route & WIP', icon: '🛣️', color: '#94a3b8', items: [
        { label: '라우트 레이아웃',               labelEn: 'Route Layout',                            file: 'mes_route_1_layout.html' },
        { label: '재공품 라우팅',                 labelEn: 'WIP Routing',                             file: 'mes_route_2_wip.html' },
        { label: '재공품 3D 모니터링',            labelEn: 'WIP 3D Monitoring',                       file: 'mes_route_3_wip_3d.html' },
        { label: '라우트 시뮬레이션',             labelEn: 'Route Simulation',                        file: 'mes_route_4_wip_simulation.html' },
        { label: '라우트 3D 시뮬레이션',          labelEn: 'Route 3D Simulation',                     file: 'mes_route_5_wip_simulation_3d.html' },
      ]},
      { title: '기준정보 (Master Data)', titleEn: 'Master Data', icon: '📁', color: '#94a3b8', items: [
        { label: '마스터 데이터 관리',            labelEn: 'Master Data Management',                  file: 'mes_master_1_ui_patterns.html' },
      ]},
    ],
  },
];

// SECTIONS + tabsByFile 합쳐서 entry 평탄 배열 만들기.
// entry = {
//   section, sectionLabel, sectionColor,
//   group,   groupColor,
//   file,    fileLabel,
//   tabIndex,            // null 이면 단일 파일 entry (탭 없음)
//   tabLabel,            // null 이면 fileLabel 사용
// }
function buildEntries() {
  const out = [];
  for (const sec of SECTIONS) {
    for (const g of sec.groups) {
      for (const item of g.items) {
        const tabs = tabsByFile[item.file] || [];
        const base = {
          section:      sec.section,
          sectionLabel: sec.sectionLabel,
          sectionColor: sec.color,
          group:        g.title,
          groupEn:      g.titleEn || g.title,
          groupColor:   g.color,
          file:         item.file,
          fileLabel:    item.label,
          fileLabelEn:  item.labelEn || item.label,
        };
        if (tabs.length === 0) {
          // 탭 없는 단일 페이지 — 원본 HTML 그대로
          out.push({
            ...base, tabIndex: null, tabLabel: null,
            srcUrl: `/t3mes/${item.file}`, liteUrl: null,
          });
        } else {
          for (const t of tabs) {
            // 분리된 독립 HTML(full) / 경량 조각(lite) 경로 — t3mes-tabs.json 이 제공
            // layers — split 스크립트가 lite HTML 파싱으로 추출 (있을 때만 전파)
            const entry = {
              ...base, tabIndex: t.index, tabLabel: t.label,
              srcUrl:  t.full ? `/${t.full}` : `/t3mes/${item.file}`,
              liteUrl: t.lite ? `/${t.lite}` : null,
            };
            if (Array.isArray(t.layers) && t.layers.length > 0) {
              entry.layers = t.layers;
            }
            out.push(entry);
          }
        }
      }
    }
  }
  return out;
}

// Composer 자연어 생성 모드의 'UI Pattern 선택' POPUP 이 재사용 (UiPatternPickerDialog)
export const ALL_ENTRIES = buildEntries();

// group title (Korean) → titleEn 매핑 — 그룹 chip 필터 영어 표시용
const groupEnByKo = (() => {
  const map = {};
  for (const sec of SECTIONS) {
    for (const g of sec.groups) {
      map[g.title] = g.titleEn || g.title;
    }
  }
  return map;
})();

function T3mesPatternCatalog() {
  const { t, i18n } = useTranslation('composer');
  const isEn = i18n.language?.startsWith('en');
  const [active, setActive] = useState(null);  // entry
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');  // ALL | MES | SCM
  const [groupFilter, setGroupFilter]     = useState('ALL');  // ALL | <group title>

  // 검색·필터 적용된 entry 들
  const filtered = useMemo(() => {
    let arr = ALL_ENTRIES;
    if (sectionFilter !== 'ALL') arr = arr.filter((e) => e.section === sectionFilter);
    if (groupFilter   !== 'ALL') arr = arr.filter((e) => e.group   === groupFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((e) => {
        const hay = `${e.section} ${e.sectionLabel} ${e.group} ${e.fileLabel} ${e.file} ${e.tabLabel || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    return arr;
  }, [sectionFilter, groupFilter, query]);

  // 화면용 그룹화: section → group → file → entries[]
  const grouped = useMemo(() => {
    const tree = new Map();  // sectionLabel → Map(group → Map(file → entries))
    for (const e of filtered) {
      if (!tree.has(e.section)) tree.set(e.section, {
        section: e.section, sectionLabel: e.sectionLabel, sectionColor: e.sectionColor,
        groups: new Map(),
      });
      const sec = tree.get(e.section);
      if (!sec.groups.has(e.group)) sec.groups.set(e.group, {
        group: e.group, groupColor: e.groupColor, files: new Map(),
      });
      const grp = sec.groups.get(e.group);
      if (!grp.files.has(e.file)) grp.files.set(e.file, {
        file: e.file, fileLabel: e.fileLabel, entries: [],
      });
      grp.files.get(e.file).entries.push(e);
    }
    return Array.from(tree.values()).map((sec) => ({
      ...sec,
      groups: Array.from(sec.groups.values()).map((g) => ({
        ...g, files: Array.from(g.files.values()),
      })),
    }));
  }, [filtered]);

  // 그룹 필터 옵션 — 현재 sectionFilter 기준
  const groupOptions = useMemo(() => {
    const set = new Set();
    for (const e of ALL_ENTRIES) {
      if (sectionFilter !== 'ALL' && e.section !== sectionFilter) continue;
      set.add(e.group);
    }
    return Array.from(set);
  }, [sectionFilter]);

  // 통계
  const stats = useMemo(() => {
    const total = ALL_ENTRIES.length;
    const byMes = ALL_ENTRIES.filter((e) => e.section === 'MES').length;
    const byScm = ALL_ENTRIES.filter((e) => e.section === 'SCM').length;
    const fileCount = new Set(ALL_ENTRIES.map((e) => e.file)).size;
    return { total, byMes, byScm, fileCount };
  }, []);

  const openEntry = useCallback((entry) => {
    window.history.pushState({ t3mesActive: `${entry.file}#${entry.tabIndex ?? '-'}` }, '', '');
    setActive(entry);
  }, []);
  const closeEntry = useCallback(() => {
    if (window.history.state && window.history.state.t3mesActive) {
      window.history.back();
    } else {
      setActive(null);
    }
  }, []);
  useEffect(() => {
    const onPop = () => setActive(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 분리된 full HTML 은 tab-nav 제거 + 해당 탭 자동 활성화를 자체 처리하므로
  // React 쪽에서 iframe 에 추가 조작이 필요 없다.

  const clearFilters = () => { setQuery(''); setSectionFilter('ALL'); setGroupFilter('ALL'); };
  const hasFilter = query.trim() || sectionFilter !== 'ALL' || groupFilter !== 'ALL';

  // ─── 활성 entry 뷰 (iframe) ───
  if (active) {
    return (
      <ContentInner>
        <WorkArea>
          <Box sx={{
            p: 0.75, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0,
            bgcolor: 'rgba(255,255,255,0.62)', color: '#3A4A63',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 14px -10px rgba(58,74,99,0.30), 0 1px 0 rgba(255,255,255,0.7) inset',
          }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                size="small" variant="outlined" startIcon={<ArrowBackIcon />}
                onClick={closeEntry}
              >
                {t('uiPattern.backToList')}
              </Button>
              <Divider orientation="vertical" flexItem />
              <Chip
                size="small"
                label={active.section}
                sx={{
                  height: 20, fontSize: 11, fontWeight: 700,
                  bgcolor: `${active.sectionColor}22`, color: active.sectionColor,
                  border: `1px solid ${active.sectionColor}66`,
                }}
              />
              <Typography variant="caption" sx={{ color: '#6E7E96' }}>
                {isEn ? (active.groupEn || active.group) : active.group}
              </Typography>
              <Box component="span" sx={{ color: '#A6B2C4' }}>›</Box>
              {active.tabLabel ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {active.tabLabel}
                  </Typography>
                  <Chip
                    size="small"
                    label={`#${active.tabIndex + 1}`}
                    sx={{
                      fontFamily: 'monospace', fontSize: 10, height: 18,
                      bgcolor: 'rgba(124,167,224,0.16)', color: '#5683C0',
                      border: '1px solid rgba(124,167,224,0.35)',
                    }}
                  />
                </>
              ) : (
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {isEn ? (active.fileLabelEn || active.fileLabel) : active.fileLabel}
                </Typography>
              )}
              <Chip
                size="small"
                label={active.srcUrl.replace(/^\//, '')}
                sx={{
                  fontFamily: 'monospace', fontSize: 10, height: 18,
                  bgcolor: 'rgba(124,167,224,0.10)', color: '#6E7E96',
                  border: '1px solid rgba(124,167,224,0.28)',
                }}
              />
              <Box sx={{ flex: 1 }} />
              {active.liteUrl && (
                <Tooltip title={t('uiPattern.openLite')}>
                  <Button
                    size="small" variant="outlined"
                    onClick={() => window.open(active.liteUrl, '_blank', 'noopener,noreferrer')}
                    sx={{ fontWeight: 700 }}
                  >
                    lite
                  </Button>
                </Tooltip>
              )}
              <Tooltip title={t('uiPattern.openFull')}>
                <IconButton
                  size="small" sx={{ color: '#5683C0' }}
                  onClick={() => window.open(active.srcUrl, '_blank', 'noopener,noreferrer')}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative', bgcolor: '#1e293b' }}>
            {/*
              분리본 부트스트랩 setTimeout(go, 120ms) 직후 fade-in — 30ms 여유.
              그 사이엔 어두운 placeholder 만 보이고 default(0번) 탭은 안 비침.
            */}
            <iframe
              key={active.srcUrl}
              title={active.tabLabel || active.fileLabel}
              src={active.srcUrl}
              onLoad={(e) => {
                const el = e.currentTarget;
                setTimeout(() => { el.style.opacity = '1'; }, 150);
              }}
              style={{
                width: '100%', height: '100%',
                border: 'none', display: 'block',
                backgroundColor: '#fff',
                opacity: 0,
                transition: 'opacity 50ms ease',
              }}
            />
          </Box>
        </WorkArea>
      </ContentInner>
    );
  }

  // ─── 카탈로그 뷰 ───
  return (
    <ContentInner>
      <WorkArea>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
                   bgcolor: 'transparent', p: 1.2, gap: 1.2 }}>

          {/* Hero — 파스텔 글래스 */}
          <Paper elevation={0} sx={{
            p: 2, borderRadius: 3, flexShrink: 0, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(169,199,238,0.62) 0%, '
                      + 'rgba(143,196,212,0.42) 52%, rgba(157,143,212,0.42) 100%)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,0.65)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px -10px rgba(58,74,99,0.26)',
            color: '#3A4A63',
          }}>
            <Box sx={{ position: 'absolute', top: -40, right: -20, width: 200, height: 200,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.30)' }} />
            <Box sx={{ position: 'absolute', bottom: -50, left: 100, width: 180, height: 180,
                       borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.16)' }} />
            <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.78)', color: '#5683C0',
                            width: 56, height: 56,
                            border: '1px solid rgba(255,255,255,0.85)',
                            boxShadow: '0 4px 12px -4px rgba(58,74,99,0.30)' }}>
                <DashboardIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#3A4A63',
                                               textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>
                  {t('uiPattern.heroTitle')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A6B85', mt: 0.3 }}>
                  {t('uiPattern.heroSubtitle')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {[
                  { label: t('uiPattern.stats.total'),  val: stats.total },
                  { label: 'MES',                       val: stats.byMes },
                  { label: 'SCM',                       val: stats.byScm },
                  { label: t('uiPattern.stats.files'),  val: stats.fileCount },
                ].map((s) => (
                  <Box key={s.label} sx={{
                    minWidth: 86, textAlign: 'center',
                    bgcolor: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.70)',
                    boxShadow: '0 2px 8px -5px rgba(58,74,99,0.22)',
                    borderRadius: 2, px: 1.2, py: 0.8,
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#5A6B85' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2, mt: 0.2,
                                                   color: '#3A4A63' }}>
                      {s.val}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* Toolbar — 파스텔 글래스 */}
          <Paper elevation={0} sx={{
            p: 1, borderRadius: 2.5, flexShrink: 0,
            bgcolor: 'rgba(255,255,255,0.66)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 6px 18px -12px rgba(58,74,99,0.28), 0 1px 0 rgba(255,255,255,0.7) inset',
          }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <ToggleButtonGroup
                value={sectionFilter} exclusive
                onChange={(_, v) => { if (v) { setSectionFilter(v); setGroupFilter('ALL'); } }}
                size="small"
                sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.4, fontWeight: 700 } }}
              >
                <ToggleButton value="ALL">{t('uiPattern.filter.all')}</ToggleButton>
                <ToggleButton value="MES" sx={{ color: '#6BA0B0 !important' }}>MES</ToggleButton>
                <ToggleButton value="SCM" sx={{ color: '#9D8FD4 !important' }}>SCM</ToggleButton>
              </ToggleButtonGroup>
              <Divider orientation="vertical" flexItem />
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                <Chip
                  size="small" label={t('uiPattern.allGroups')}
                  onClick={() => setGroupFilter('ALL')}
                  sx={{
                    height: 26, fontWeight: 700,
                    bgcolor: groupFilter === 'ALL' ? '#5683C0' : 'rgba(124,167,224,0.12)',
                    color:   groupFilter === 'ALL' ? '#fff'    : '#6E7E96',
                    '&:hover': { bgcolor: groupFilter === 'ALL' ? '#5683C0' : 'rgba(124,167,224,0.22)' },
                  }}
                />
                {groupOptions.map((g) => (
                  <Chip
                    key={g} size="small" label={isEn ? (groupEnByKo[g] || g) : g}
                    onClick={() => setGroupFilter(g)}
                    sx={{
                      height: 26, fontWeight: 500,
                      bgcolor: groupFilter === g ? '#7CA7E0' : 'rgba(124,167,224,0.12)',
                      color:   groupFilter === g ? '#fff'    : '#6E7E96',
                      '&:hover': { bgcolor: groupFilter === g ? '#7CA7E0' : 'rgba(124,167,224,0.22)' },
                    }}
                  />
                ))}
              </Stack>
              <Box sx={{ flex: 1 }} />
              <TextField
                size="small"
                placeholder={t('uiPattern.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ minWidth: 280 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuery('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              {hasFilter && (
                <Button size="small" variant="text" onClick={clearFilters}>{t('uiPattern.reset')}</Button>
              )}
              <Chip
                size="small" color="info" variant="outlined"
                label={t('uiPattern.resultCount', { n: filtered.length })}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Paper>

          {/* 본문 — Section → Group → File → TabPage 목록 */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {filtered.length === 0 && (
              <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: '#fff', borderRadius: 2 }}>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  {t('uiPattern.noResults')}
                </Typography>
                <Button size="small" sx={{ mt: 1 }} onClick={clearFilters}>{t('uiPattern.resetFilters')}</Button>
              </Paper>
            )}

            <Stack spacing={2}>
              {grouped.map((sec) => (
                <Box key={sec.section}>
                  {/* Section header */}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{
                    pb: 0.6, mb: 1, borderBottom: `2px solid ${sec.sectionColor}44`,
                  }}>
                    <Typography variant="h6" sx={{
                      fontWeight: 700, color: sec.sectionColor,
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                      {sec.section === 'MES' ? '🏭' : '🌐'} {sec.sectionLabel}
                    </Typography>
                  </Stack>

                  {/* Groups */}
                  <Stack spacing={1.2}>
                    {sec.groups.map((g) => (
                      <Paper key={`${sec.section}_${g.group}`} elevation={0} sx={{
                        p: 1.2, borderRadius: 2, bgcolor: '#fff', border: '1px solid #e2e8f0',
                      }}>
                        {/* Group header */}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Avatar sx={{
                            bgcolor: `${g.groupColor}22`, color: g.groupColor,
                            width: 28, height: 28, fontSize: 14,
                          }}>
                            ◆
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {isEn ? (groupEnByKo[g.group] || g.group) : g.group}
                          </Typography>
                          <Box sx={{ flex: 1 }} />
                          <Chip
                            label={g.files.reduce((acc, f) => acc + f.entries.length, 0)}
                            size="small"
                            sx={{
                              height: 18, fontSize: 10, fontWeight: 600,
                              bgcolor: `${g.groupColor}22`, color: g.groupColor,
                            }}
                          />
                        </Stack>

                        {/* Files */}
                        <Stack spacing={1}>
                          {g.files.map((f) => {
                            // 탭이 없는 파일 (entries 1개 + tabIndex null) — 파일 자체가 클릭 카드
                            const isSinglePage =
                              f.entries.length === 1 && f.entries[0].tabIndex == null;

                            if (isSinglePage) {
                              const entry = f.entries[0];
                              return (
                                <PressPreview
                                  key={f.file}
                                  srcUrl={entry.srcUrl}
                                  onClick={() => openEntry(entry)}
                                  sx={{
                                    display: 'flex', alignItems: 'center', gap: 1,
                                    borderLeft: `3px solid ${g.groupColor}55`,
                                    bgcolor: '#f8fafc', borderRadius: 1,
                                    pl: 1.2, pr: 1, py: 0.8, cursor: 'pointer',
                                    border: '1px solid transparent',
                                    transition: 'all 0.12s ease',
                                    userSelect: 'none',
                                    '&:hover': {
                                      bgcolor: `${g.groupColor}11`,
                                      borderColor: g.groupColor,
                                      transform: 'translateX(2px)',
                                    },
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                    {isEn ? (f.fileLabelEn || f.fileLabel) : f.fileLabel}
                                  </Typography>
                                  <Typography variant="caption" sx={{
                                    fontFamily: 'monospace', color: '#94a3b8', fontSize: 10,
                                  }}>
                                    {f.file}
                                  </Typography>
                                  <Box sx={{ flex: 1 }} />
                                  <Tooltip title={t('uiPattern.openInNewWindow')}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/t3mes/${f.file}`, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </PressPreview>
                              );
                            }

                            // 탭이 있는 파일 — 파일 라벨 header + TabPage 카드 grid
                            return (
                              <Box key={f.file} sx={{
                                borderLeft: `3px solid ${g.groupColor}55`,
                                pl: 1.2, py: 0.6,
                              }}>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.6 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {isEn ? (f.fileLabelEn || f.fileLabel) : f.fileLabel}
                                  </Typography>
                                  <Typography variant="caption" sx={{
                                    fontFamily: 'monospace', color: '#94a3b8', fontSize: 10,
                                  }}>
                                    {f.file}
                                  </Typography>
                                  <Chip
                                    label={`${f.entries.length} TabPage`}
                                    size="small"
                                    sx={{
                                      height: 16, fontSize: 9, fontWeight: 600,
                                      bgcolor: `${g.groupColor}22`, color: g.groupColor,
                                    }}
                                  />
                                  <Box sx={{ flex: 1 }} />
                                  <Tooltip title={t('uiPattern.openInNewWindow')}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/t3mes/${f.file}`, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      <OpenInNewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                                <Box sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                  gap: 0.6,
                                }}>
                                  {f.entries.map((entry) => (
                                    <PressPreview
                                      key={`${entry.file}#${entry.tabIndex ?? '-'}`}
                                      srcUrl={entry.srcUrl}
                                      onClick={() => openEntry(entry)}
                                      sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.6,
                                        bgcolor: '#f8fafc', borderRadius: 1,
                                        px: 1, py: 0.6, cursor: 'pointer',
                                        border: '1px solid transparent',
                                        transition: 'all 0.12s ease',
                                        userSelect: 'none',
                                        '&:hover': {
                                          bgcolor: `${g.groupColor}11`,
                                          borderColor: g.groupColor,
                                          transform: 'translateX(2px)',
                                        },
                                      }}
                                    >
                                      <Chip
                                        label={entry.tabIndex + 1}
                                        size="small"
                                        sx={{
                                          height: 18, minWidth: 28,
                                          fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                                          bgcolor: g.groupColor, color: '#fff',
                                          '& .MuiChip-label': { px: 0.6 },
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 600, color: '#0f172a', flex: 1, minWidth: 0 }}
                                        noWrap
                                        title={entry.tabLabel}
                                      >
                                        {entry.tabLabel}
                                      </Typography>
                                    </PressPreview>
                                  ))}
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </WorkArea>
    </ContentInner>
  );
}

export default T3mesPatternCatalog;
