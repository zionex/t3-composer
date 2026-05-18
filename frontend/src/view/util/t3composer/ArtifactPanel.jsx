import React, { useEffect, useState } from 'react';

import {
  Box,
  Collapse,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Button,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { listArtifacts, getArtifact, cleanupSupersededArtifacts } from './api';

const TYPE_LABEL = {
  SCREEN_JSX:        { label: 'JSX',        color: '#5281b3' },
  JAVA_CONTROLLER:   { label: 'Controller', color: '#2a9d8f' },
  JAVA_SERVICE:      { label: 'Service',    color: '#2a9d8f' },
  JAVA_REPOSITORY:   { label: 'Repository', color: '#2a9d8f' },
  JAVA_ENTITY:       { label: 'Entity',     color: '#2a9d8f' },
  SQL_DDL:           { label: 'DDL',        color: '#fa7d5b' },
  SQL_SP:            { label: 'SP',         color: '#fa7d5b' },
  MENU_SQL:          { label: 'Menu SQL',   color: '#ffb100' },
  MENUS_JS_PATCH:    { label: 'menus.js',   color: '#ffb100' },
  DESIGN_DOC_UPLOAD: { label: '설계서',     color: '#bface2' },
  SOURCE_SNAPSHOT:   { label: '소스',       color: '#a7afa2' },
  OTHER:             { label: '기타',       color: '#a7afa2' },
};

function typeMeta(t) {
  return TYPE_LABEL[t] || TYPE_LABEL.OTHER;
}

/**
 * Tree 그룹 정의 — 산출물을 컨설턴트 친화적 폴더 구조로.
 *   📂 화면 (JSX)
 *   📂 백엔드 (Java)
 *   📂 SQL (DDL · SP)
 *   📂 메뉴 등록 (MENU_SQL · menus.js)
 *   📂 기타
 */
const ARTIFACT_GROUPS = [
  { key: 'screen',  label: '화면',       icon: '🖥', accent: '#5281b3',
    types: ['SCREEN_JSX'] },
  { key: 'backend', label: '백엔드',    icon: '⚙️', accent: '#2a9d8f',
    types: ['JAVA_ENTITY', 'JAVA_REPOSITORY', 'JAVA_SERVICE', 'JAVA_CONTROLLER'] },
  { key: 'sql',     label: 'SQL',        icon: '🗄', accent: '#fa7d5b',
    types: ['SQL_DDL', 'SQL_SP'] },
  { key: 'menu',    label: '메뉴 등록',  icon: '📋', accent: '#ffb100',
    types: ['MENU_SQL', 'MENUS_JS_PATCH'] },
  { key: 'other',   label: '기타',       icon: '📎', accent: '#a7afa2',
    types: ['DESIGN_DOC_UPLOAD', 'SOURCE_SNAPSHOT', 'OTHER'] },
];

function groupArtifacts(items) {
  const map = {};
  ARTIFACT_GROUPS.forEach((g) => { map[g.key] = []; });
  items.forEach((a) => {
    const grp = ARTIFACT_GROUPS.find((g) => g.types.includes(a.artifactType));
    const key = grp ? grp.key : 'other';
    map[key].push(a);
  });
  return map;
}

/**
 * 산출물 목록 + 선택된 산출물 상세 미리보기 패널.
 */
function ArtifactPanel({ sessionId, refreshKey }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  // history=true 면 supersede 된 이전 버전(DISCARDED) 까지 보여줌
  const [includeHistory, setIncludeHistory] = useState(false);
  const [supersededCount, setSupersededCount] = useState(0);
  const [cleaning, setCleaning] = useState(false);
  // Tree 펼침 상태 — group key 별 boolean. 기본 모두 펼침.
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(ARTIFACT_GROUPS.map((g) => [g.key, true])));
  const toggleGroup = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const reload = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await listArtifacts(sessionId, { history: includeHistory });
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);

      // supersede 된 이전 버전 수 파악 — 현재 보고 있지 않으면 별도로 history=true 로 한 번 조회
      if (!includeHistory) {
        try {
          const all = await listArtifacts(sessionId, { history: true });
          const allData = Array.isArray(all.data) ? all.data : [];
          setSupersededCount(Math.max(0, allData.length - data.length));
        } catch {
          setSupersededCount(0);
        }
      } else {
        // history 모드면 DISCARDED status 인 것만 카운트
        setSupersededCount(data.filter((a) => a.status === 'DISCARDED').length);
      }

      if (data.length > 0 && !selected) {
        handleSelect(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!sessionId || supersededCount === 0) return;
    if (!window.confirm(
      `이전 버전 ${supersededCount}개를 영구 삭제합니다. (DB hard delete · 복원 불가) 진행할까요?`)) return;
    setCleaning(true);
    try {
      await cleanupSupersededArtifacts(sessionId);
      await reload();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Composer] 이전 버전 정리 실패:', e?.message || e);
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, refreshKey, includeHistory]);

  const handleSelect = async (artifactId) => {
    try {
      const res = await getArtifact(artifactId);
      setSelected(res.data);
    } catch (e) {
      // ignore
    }
  };

  const handleCopy = async () => {
    if (!selected?.content) return;
    try {
      await navigator.clipboard.writeText(selected.content);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = selected.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleDownload = () => {
    if (!selected?.content) return;
    const blob = new Blob([selected.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selected.fileName || 'artifact.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const grouped = groupArtifacts(items);

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* Layer 2 — 산출물 Tree */}
      <Box sx={{ width: 320, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', bgcolor: '#fcfcfd' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.2 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
              📁 산출물 ({items.length})
            </Typography>
            {supersededCount > 0 && (
              <Tooltip title={`이전 버전(supersede) ${supersededCount}개 — 클릭해서 표시 토글`}>
                <Chip
                  size="small"
                  icon={<HistoryIcon sx={{ fontSize: 12 }} />}
                  label={includeHistory ? `이전 ${supersededCount}` : `+${supersededCount}`}
                  onClick={() => setIncludeHistory((v) => !v)}
                  sx={{
                    height: 18, fontSize: 10, ml: 0.5,
                    bgcolor: includeHistory ? '#fde68a' : '#e2e8f0',
                    color: includeHistory ? '#92400e' : '#475569',
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.3}>
            {supersededCount > 0 && (
              <Tooltip title={`이전 버전 ${supersededCount}개 영구 삭제 (DB hard delete)`}>
                <span>
                  <IconButton size="small" onClick={handleCleanup} disabled={cleaning}>
                    <CleaningServicesIcon fontSize="small" sx={{ color: '#dc2626' }} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title="새로고침">
              <IconButton size="small" onClick={reload} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', px: 0.5, pb: 1 }}>
          {items.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                아직 생성된 파일이 없습니다. Claude 가 응답하면 파일이 여기에 나타납니다.
              </Typography>
            </Box>
          )}
          {ARTIFACT_GROUPS.map((g) => {
            const list = grouped[g.key] || [];
            if (list.length === 0) return null;
            const isExpanded = expanded[g.key];
            return (
              <Box key={g.key} sx={{ mb: 0.4 }}>
                {/* Group 헤더 */}
                <Box
                  onClick={() => toggleGroup(g.key)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.6,
                    px: 1, py: 0.5, mx: 0.5, borderRadius: 1,
                    cursor: 'pointer', userSelect: 'none',
                    '&:hover': { bgcolor: '#eef2f7' },
                  }}
                >
                  {isExpanded
                    ? <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    : <KeyboardArrowRightIcon sx={{ fontSize: 16, color: '#64748b' }} />}
                  {isExpanded
                    ? <FolderOpenIcon sx={{ fontSize: 18, color: g.accent }} />
                    : <FolderIcon sx={{ fontSize: 18, color: g.accent }} />}
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', flex: 1 }}>
                    {g.label}
                  </Typography>
                  <Chip size="small" label={list.length}
                        sx={{ height: 18, fontSize: 10, bgcolor: `${g.accent}22`, color: g.accent, fontWeight: 700 }} />
                </Box>
                {/* Group 자식 — leaf */}
                <Collapse in={isExpanded} timeout={120}>
                  {list.map((a) => {
                    const meta = typeMeta(a.artifactType);
                    const isSuperseded = a.status === 'DISCARDED';
                    const active = selected?.id === a.id;
                    return (
                      <Box
                        key={a.id}
                        onClick={() => handleSelect(a.id)}
                        sx={{
                          ml: 3.2, mr: 0.5, my: 0.2,
                          px: 1, py: 0.6, borderRadius: 1,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 0.6,
                          bgcolor: active ? `${g.accent}18` : 'transparent',
                          borderLeft: '2px solid',
                          borderColor: active ? g.accent : 'transparent',
                          opacity: isSuperseded ? 0.55 : 1,
                          '&:hover': { bgcolor: active ? `${g.accent}22` : '#f1f5f9' },
                        }}
                      >
                        <InsertDriveFileIcon sx={{ fontSize: 14, color: meta.color, flexShrink: 0 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: active ? 700 : 500,
                            color: active ? g.accent : '#1e293b',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            flex: 1,
                            textDecoration: isSuperseded ? 'line-through' : 'none',
                          }}
                          title={a.filePath}
                        >
                          {a.fileName || a.filePath}
                        </Typography>
                        {!isSuperseded && a.versionNo > 1 && (
                          <Chip label={`v${a.versionNo}`} size="small"
                                sx={{ height: 16, fontSize: 9, fontFamily: 'monospace',
                                      bgcolor: '#dcfce7', color: '#15803d', flexShrink: 0 }} />
                        )}
                        {isSuperseded && (
                          <Chip label="이전" size="small"
                                sx={{ height: 16, fontSize: 9, bgcolor: '#e2e8f0', color: '#64748b', flexShrink: 0 }} />
                        )}
                      </Box>
                    );
                  })}
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 우측 미리보기 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {selected ? (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                  {selected.fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {selected.filePath}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={handleCopy}
                  variant="outlined"
                >
                  복사
                </Button>
                <Button
                  size="small"
                  startIcon={<DownloadIcon fontSize="small" />}
                  onClick={handleDownload}
                  variant="outlined"
                >
                  다운로드
                </Button>
              </Stack>
            </Stack>
            <Box
              component="pre"
              sx={{
                flex: 1,
                overflow: 'auto',
                m: 0,
                p: 2,
                fontSize: 12,
                fontFamily: 'Consolas, Monaco, monospace',
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                whiteSpace: 'pre',
                minHeight: 0,
              }}
            >
              {selected.content}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <Stack alignItems="center" spacing={1.5}>
              <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                좌측에서 파일을 선택하면 여기에 표시됩니다.
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ArtifactPanel;

// ============================================================================
// 신규 — Tree-only / CodeView-only 분리 컴포넌트 (3-Layer + Tab 구조용)
// ============================================================================

/**
 * 산출물 Tree 만 — controlled.
 * props: sessionId, refreshKey, selectedId, onSelect(id)
 */
export function ArtifactTreeView({ sessionId, refreshKey, selectedId, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [supersededCount, setSupersededCount] = useState(0);
  const [cleaning, setCleaning] = useState(false);
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(ARTIFACT_GROUPS.map((g) => [g.key, true])));
  const toggleGroup = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const reload = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await listArtifacts(sessionId, { history: includeHistory });
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
      if (!includeHistory) {
        try {
          const all = await listArtifacts(sessionId, { history: true });
          const allData = Array.isArray(all.data) ? all.data : [];
          setSupersededCount(Math.max(0, allData.length - data.length));
        } catch { setSupersededCount(0); }
      } else {
        setSupersededCount(data.filter((a) => a.status === 'DISCARDED').length);
      }
      // 첫 로드 시 첫 항목 자동 선택
      if (data.length > 0 && !selectedId && onSelect) onSelect(data[0].id);
    } finally { setLoading(false); }
  };

  const handleCleanup = async () => {
    if (!sessionId || supersededCount === 0) return;
    if (!window.confirm(`이전 버전 ${supersededCount}개를 영구 삭제합니다. 진행할까요?`)) return;
    setCleaning(true);
    try { await cleanupSupersededArtifacts(sessionId); await reload(); }
    catch (e) { console.error('[Composer] cleanup 실패:', e?.message); }
    finally { setCleaning(false); }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [sessionId, refreshKey, includeHistory]);

  const grouped = groupArtifacts(items);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, bgcolor: '#fcfcfd' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.2 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
            📁 산출물 ({items.length})
          </Typography>
          {supersededCount > 0 && (
            <Tooltip title={`이전 버전 ${supersededCount}개`}>
              <Chip size="small" icon={<HistoryIcon sx={{ fontSize: 12 }} />}
                    label={includeHistory ? `이전 ${supersededCount}` : `+${supersededCount}`}
                    onClick={() => setIncludeHistory((v) => !v)}
                    sx={{ height: 18, fontSize: 10, ml: 0.5,
                          bgcolor: includeHistory ? '#fde68a' : '#e2e8f0',
                          color: includeHistory ? '#92400e' : '#475569', cursor: 'pointer' }} />
            </Tooltip>
          )}
        </Stack>
        <Stack direction="row" spacing={0.3}>
          {supersededCount > 0 && (
            <Tooltip title={`이전 버전 ${supersededCount}개 영구 삭제`}>
              <span><IconButton size="small" onClick={handleCleanup} disabled={cleaning}>
                <CleaningServicesIcon fontSize="small" sx={{ color: '#dc2626' }} />
              </IconButton></span>
            </Tooltip>
          )}
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={reload} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', px: 0.5, pb: 1 }}>
        {items.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              아직 생성된 파일이 없습니다.
            </Typography>
          </Box>
        )}
        {ARTIFACT_GROUPS.map((g) => {
          const list = grouped[g.key] || [];
          if (list.length === 0) return null;
          const isExpanded = expanded[g.key];
          return (
            <Box key={g.key} sx={{ mb: 0.4 }}>
              <Box
                onClick={() => toggleGroup(g.key)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.6,
                  px: 1, py: 0.5, mx: 0.5, borderRadius: 1,
                  cursor: 'pointer', userSelect: 'none',
                  '&:hover': { bgcolor: '#eef2f7' },
                }}
              >
                {isExpanded
                  ? <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#64748b' }} />
                  : <KeyboardArrowRightIcon sx={{ fontSize: 16, color: '#64748b' }} />}
                {isExpanded
                  ? <FolderOpenIcon sx={{ fontSize: 18, color: g.accent }} />
                  : <FolderIcon sx={{ fontSize: 18, color: g.accent }} />}
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', flex: 1 }}>
                  {g.label}
                </Typography>
                <Chip size="small" label={list.length}
                      sx={{ height: 18, fontSize: 10, bgcolor: `${g.accent}22`, color: g.accent, fontWeight: 700 }} />
              </Box>
              <Collapse in={isExpanded} timeout={120}>
                {list.map((a) => {
                  const meta = typeMeta(a.artifactType);
                  const isSuperseded = a.status === 'DISCARDED';
                  const active = selectedId === a.id;
                  return (
                    <Box
                      key={a.id}
                      onClick={() => onSelect && onSelect(a.id)}
                      sx={{
                        ml: 3.2, mr: 0.5, my: 0.2,
                        px: 1, py: 0.6, borderRadius: 1,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 0.6,
                        bgcolor: active ? `${g.accent}18` : 'transparent',
                        borderLeft: '2px solid',
                        borderColor: active ? g.accent : 'transparent',
                        opacity: isSuperseded ? 0.55 : 1,
                        '&:hover': { bgcolor: active ? `${g.accent}22` : '#f1f5f9' },
                      }}
                    >
                      <InsertDriveFileIcon sx={{ fontSize: 14, color: meta.color, flexShrink: 0 }} />
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: active ? 700 : 500,
                              color: active ? g.accent : '#1e293b',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              flex: 1,
                              textDecoration: isSuperseded ? 'line-through' : 'none' }}
                        title={a.filePath}
                      >
                        {a.fileName || a.filePath}
                      </Typography>
                      {!isSuperseded && a.versionNo > 1 && (
                        <Chip label={`v${a.versionNo}`} size="small"
                              sx={{ height: 16, fontSize: 9, fontFamily: 'monospace',
                                    bgcolor: '#dcfce7', color: '#15803d', flexShrink: 0 }} />
                      )}
                      {isSuperseded && (
                        <Chip label="이전" size="small"
                              sx={{ height: 16, fontSize: 9, bgcolor: '#e2e8f0', color: '#64748b', flexShrink: 0 }} />
                      )}
                    </Box>
                  );
                })}
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * 산출물 코드 미리보기 — controlled (selectedId 만 받음, 자체 fetch).
 */
export function ArtifactCodeView({ selectedId }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState(null);

  useEffect(() => {
    if (!selectedId) { setSelected(null); setErr(null); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const res = await getArtifact(selectedId);
        if (!cancelled) { setSelected(res.data); setLoading(false); }
      } catch (e) {
        if (!cancelled) {
          setSelected(null);
          setLoading(false);
          setErr(e?.response?.data?.message || e?.message || '산출물 소스를 불러오지 못했습니다.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleCopy = async () => {
    if (!selected?.content) return;
    try { await navigator.clipboard.writeText(selected.content); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = selected.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleDownload = () => {
    if (!selected?.content) return;
    const blob = new Blob([selected.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selected.fileName || 'artifact.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Stack alignItems="center" spacing={1.5}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">산출물 소스 불러오는 중...</Typography>
        </Stack>
      </Box>
    );
  }

  if (err) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Stack alignItems="center" spacing={1}>
          <DescriptionIcon sx={{ fontSize: 44, color: 'error.light' }} />
          <Typography variant="body2" color="error">{err}</Typography>
        </Stack>
      </Box>
    );
  }

  if (!selected) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: '#fafafa' }}>
        <Stack alignItems="center" spacing={1.5}>
          <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            산출물 트리에서 파일을 선택하세요.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}
             sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)', bgcolor: '#fff', flexShrink: 0 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {selected.fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {selected.filePath}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Button size="small" startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={handleCopy} variant="outlined">복사</Button>
          <Button size="small" startIcon={<DownloadIcon fontSize="small" />}
                  onClick={handleDownload} variant="outlined">다운로드</Button>
        </Stack>
      </Stack>
      <Box component="pre" sx={{
        flex: 1, overflow: 'auto', m: 0, p: 2,
        fontSize: 12, fontFamily: 'Consolas, Monaco, monospace',
        bgcolor: '#1e1e1e', color: '#d4d4d4',
        whiteSpace: 'pre', minHeight: 0,
      }}>
        {selected.content}
      </Box>
    </Box>
  );
}
