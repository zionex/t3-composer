import React, { useEffect, useState } from 'react';

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Button,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';

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
 * 아티팩트 목록 + 선택된 아티팩트 상세 미리보기 패널.
 */
function ArtifactPanel({ sessionId, refreshKey }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  // history=true 면 supersede 된 이전 버전(DISCARDED) 까지 보여줌
  const [includeHistory, setIncludeHistory] = useState(false);
  const [supersededCount, setSupersededCount] = useState(0);
  const [cleaning, setCleaning] = useState(false);

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

  return (
    <Box sx={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* 좌측 목록 */}
      <Box sx={{ width: 280, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              아티팩트 ({items.length})
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
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {items.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                아직 생성된 파일이 없습니다. Claude 가 응답하면 파일이 여기에 나타납니다.
              </Typography>
            </Box>
          )}
          <List dense>
            {items.map((a) => {
              const meta = typeMeta(a.artifactType);
              const isSuperseded = a.status === 'DISCARDED';
              return (
                <ListItemButton
                  key={a.id}
                  selected={selected?.id === a.id}
                  onClick={() => handleSelect(a.id)}
                  sx={{
                    py: 0.8,
                    opacity: isSuperseded ? 0.55 : 1,
                    bgcolor: isSuperseded ? '#f8fafc' : undefined,
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Chip
                          label={meta.label}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            bgcolor: `${meta.color}22`,
                            color: meta.color,
                            fontWeight: 600,
                          }}
                        />
                        {isSuperseded && (
                          <Chip
                            label={`v${a.versionNo || '?'} 이전`}
                            size="small"
                            sx={{
                              height: 16, fontSize: 9, fontFamily: 'monospace',
                              bgcolor: '#e2e8f0', color: '#64748b',
                            }}
                          />
                        )}
                        {!isSuperseded && a.versionNo > 1 && (
                          <Chip
                            label={`v${a.versionNo}`}
                            size="small"
                            sx={{
                              height: 16, fontSize: 9, fontFamily: 'monospace',
                              bgcolor: '#dcfce7', color: '#15803d',
                            }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: isSuperseded ? 'line-through' : 'none',
                          }}
                        >
                          {a.fileName || a.filePath}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {a.filePath}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Box>

      {/* 우측 미리보기 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selected ? (
          <>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
              sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}
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
