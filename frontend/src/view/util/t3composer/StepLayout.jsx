import React, { useMemo, useState } from 'react';

import {
  Box, Paper, Stack, Typography, Chip, Button, IconButton, Tooltip,
  TextField, Avatar,
} from '@mui/material';
import AddIcon       from '@mui/icons-material/Add';
import CloseIcon     from '@mui/icons-material/Close';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import LayoutDesigner from './LayoutDesigner';
import { withGridDefaultProps } from './constants';

const ACCENT = '#2563eb';

/**
 * Step 3 — Layout 정리.
 *
 *   · Main UI 1개 + Popup UI N개 (추가/삭제 가능)
 *   · 좌측 탭: Main / Popup-1 / Popup-2 / ... / "+ Popup 추가"
 *   · 우측: 선택된 화면의 LayoutDesigner
 *
 * Props
 *   mainConfig          : Main 화면의 layoutConfig
 *   setMainConfig(cfg)
 *   popups              : [{ name, config }] 배열
 *   setPopups(arr)
 *   activeTab           : 'main' | 'popup-N'  (현재 선택)
 *   setActiveTab(tab)
 */
function StepLayout({ mainConfig, setMainConfig, popups, setPopups, activeTab, setActiveTab }) {

  const handleAddPopup = () => {
    const idx = popups.length + 1;
    const newPopup = {
      name: `Popup ${idx}`,
      config: {
        filterBar: { h: 2, items: [] },
        layers: [{ key: 'L1', x: 0, y: 0, w: 12, h: 10,
                   title: `Popup ${idx} 본문`, componentType: 'GRID',
                   props: withGridDefaultProps('GRID') }],
        cols: 12, rowHeight: 30,
      },
    };
    setPopups([...popups, newPopup]);
    setActiveTab(`popup-${popups.length}`);  // 새로 추가된 popup 인덱스
  };

  const handleRemovePopup = (idx) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`'${popups[idx].name}' 팝업을 삭제하시겠습니까?`)) return;
    const next = popups.filter((_, i) => i !== idx);
    setPopups(next);
    if (activeTab === `popup-${idx}`) setActiveTab('main');
    else if (activeTab.startsWith('popup-')) {
      const cur = parseInt(activeTab.replace('popup-', ''), 10);
      if (cur > idx) setActiveTab(`popup-${cur - 1}`);
    }
  };

  const handleRenamePopup = (idx, name) => {
    const next = popups.map((p, i) => i === idx ? { ...p, name } : p);
    setPopups(next);
  };

  const handleChangePopupConfig = (idx, config) => {
    const next = popups.map((p, i) => i === idx ? { ...p, config } : p);
    setPopups(next);
  };

  // 현재 선택된 화면의 config / setter
  const activeContext = useMemo(() => {
    if (activeTab === 'main') {
      return { kind: 'main', name: 'Main UI', config: mainConfig, setConfig: setMainConfig };
    }
    const idx = parseInt(activeTab.replace('popup-', ''), 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= popups.length) {
      return { kind: 'main', name: 'Main UI', config: mainConfig, setConfig: setMainConfig };
    }
    const p = popups[idx];
    return {
      kind: 'popup', idx,
      name: p.name,
      config: p.config,
      setConfig: (cfg) => handleChangePopupConfig(idx, cfg),
    };
  }, [activeTab, mainConfig, popups]);

  return (
    <Paper elevation={0} sx={{
      height: '100%',
      display: 'flex', flexDirection: 'column',
      bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2,
      overflow: 'hidden',
    }}>
      {/* Header strip */}
      <Box sx={{
        px: 3, py: 1.5,
        background: `linear-gradient(90deg, ${ACCENT}11 0%, ${ACCENT}04 100%)`,
        borderBottom: '1px solid #e2e8f0',
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
          ③ Layout 정리 — Main UI 와 Popup UI 의 layer 구성을 확정하세요
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Excel 파싱 결과로 만든 초기 레이아웃을 그대로 두거나, 분할/삭제/이동/Head 정보 입력으로 다듬을 수 있습니다.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* ============ LEFT : 화면 목록 ============ */}
        <Paper variant="outlined" elevation={0} sx={{
          width: 230, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #e2e8f0',
          borderRadius: 0, bgcolor: '#fafbff',
        }}>
          <Box sx={{ p: 1, borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" alignItems="center" spacing={0.7}>
              <ScreenShareIcon fontSize="small" sx={{ color: '#475569' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569',
                                                    letterSpacing: 0.5, textTransform: 'uppercase' }}>
                화면 목록
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip label={`${1 + popups.length}`} size="small"
                    sx={{ height: 18, fontSize: 10, fontWeight: 800,
                          bgcolor: ACCENT, color: '#fff' }} />
            </Stack>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 0.7,
                     display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Main */}
            <ScreenItem
              active={activeTab === 'main'}
              icon="🖥️"
              accent="#3b82f6"
              kind="MAIN"
              name="Main UI"
              layerCount={mainConfig?.layers?.length || 0}
              filterCount={mainConfig?.filterBar?.items?.length || 0}
              onClick={() => setActiveTab('main')}
            />

            {/* Popups */}
            {popups.map((p, i) => (
              <ScreenItem
                key={`popup-${i}`}
                active={activeTab === `popup-${i}`}
                icon="🪟"
                accent="#8b5cf6"
                kind="POPUP"
                name={p.name}
                editableName
                onRename={(name) => handleRenamePopup(i, name)}
                layerCount={p.config?.layers?.length || 0}
                filterCount={p.config?.filterBar?.items?.length || 0}
                onClick={() => setActiveTab(`popup-${i}`)}
                onRemove={() => handleRemovePopup(i)}
              />
            ))}

            {/* + Popup 추가 */}
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleAddPopup}
              sx={{ mt: 0.5, justifyContent: 'flex-start',
                    borderStyle: 'dashed', borderColor: '#a78bfa',
                    color: '#7c3aed', fontWeight: 700,
                    '&:hover': { borderColor: '#7c3aed', bgcolor: '#f5f3ff' } }}
            >
              Popup 추가
            </Button>
          </Box>
        </Paper>

        {/* ============ RIGHT : LayoutDesigner ============ */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
                   p: 1.2, gap: 1, bgcolor: '#f1f5f9' }}>
          {/* 활성 화면 헤더 */}
          <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, flexShrink: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 16,
                            bgcolor: activeContext.kind === 'main' ? '#3b82f6' : '#8b5cf6',
                            color: '#fff' }}>
                {activeContext.kind === 'main' ? '🖥️' : '🪟'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700,
                                                      textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {activeContext.kind === 'main' ? 'Main UI' : 'Popup UI'}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a',
                                                        lineHeight: 1.1 }}>
                  {activeContext.name}
                </Typography>
              </Box>
              <Chip
                label={`Layer ${activeContext.config?.layers?.length || 0}`}
                size="small"
                sx={{ fontWeight: 700, fontFamily: 'monospace',
                      bgcolor: '#e0f2fe', color: '#0369a1' }}
              />
              <Chip
                label={`FilterBar ${activeContext.config?.filterBar?.items?.length || 0}`}
                size="small"
                sx={{ fontWeight: 700, fontFamily: 'monospace',
                      bgcolor: '#dbeafe', color: '#1d4ed8' }}
              />
            </Stack>
          </Paper>

          {/* Designer (controlled) */}
          <LayoutDesigner
            value={activeContext.config}
            onChange={activeContext.setConfig}
          />
        </Box>
      </Box>
    </Paper>
  );
}

/** 화면 목록 한 항목 */
function ScreenItem({ active, icon, accent, kind, name, layerCount, filterCount,
                      onClick, onRemove, onRename, editableName }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        p: 0.9,
        borderRadius: 1.5,
        borderColor: active ? accent : 'rgba(0,0,0,0.1)',
        borderWidth: active ? 2 : 1,
        bgcolor: active ? `${accent}10` : '#fff',
        boxShadow: active ? `0 2px 8px ${accent}33` : 'none',
        transition: 'all 0.15s',
        '&:hover': { borderColor: accent, bgcolor: `${accent}08` },
        position: 'relative',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.7}>
        <Box sx={{ fontSize: 16 }}>{icon}</Box>
        <Chip label={kind} size="small"
              sx={{ height: 16, fontSize: 9, fontFamily: 'monospace', fontWeight: 800,
                    bgcolor: accent, color: '#fff', '& .MuiChip-label': { px: 0.6 } }} />
        {onRemove && (
          <Tooltip title="이 팝업 삭제">
            <IconButton size="small" sx={{ ml: 'auto !important', p: 0.2, color: '#94a3b8',
                                            '&:hover': { color: '#dc2626' } }}
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {editableName ? (
        <TextField
          value={name}
          onChange={(e) => onRename?.(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          variant="standard"
          size="small"
          fullWidth
          InputProps={{ disableUnderline: true,
                        sx: { fontSize: 13, fontWeight: 700, color: '#0f172a', mt: 0.3 } }}
        />
      ) : (
        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a', mt: 0.3 }}>
          {name}
        </Typography>
      )}
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.3 }}>
        <Chip label={`L ${layerCount}`} size="small"
              sx={{ height: 16, fontSize: 9, fontWeight: 700,
                    bgcolor: 'rgba(0,0,0,0.05)', color: '#475569',
                    '& .MuiChip-label': { px: 0.5 } }} />
        <Chip label={`F ${filterCount}`} size="small"
              sx={{ height: 16, fontSize: 9, fontWeight: 700,
                    bgcolor: filterCount > 0 ? '#dbeafe' : 'rgba(0,0,0,0.05)',
                    color: filterCount > 0 ? '#1d4ed8' : '#94a3b8',
                    '& .MuiChip-label': { px: 0.5 } }} />
      </Stack>
    </Paper>
  );
}

export default StepLayout;
