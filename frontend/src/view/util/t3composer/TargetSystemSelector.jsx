// =============================================================================
// TargetSystemSelector — Composer Landing 헤더에 노출되는 Target 전환 dropdown.
// 사용자가 선택한 Target 은 localStorage 영속화 + zustand store 에 반영되어
// Phase 3 의 chat / wizard 호출에 자동 전달된다.
// =============================================================================
import React, { useEffect } from 'react';

import {
  Box, Chip, CircularProgress, Menu, MenuItem,
  Tooltip, Typography, Stack, IconButton,
} from '@mui/material';
import LanguageIcon       from '@mui/icons-material/Language';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import StorageIcon        from '@mui/icons-material/Storage';

import { useTargetStore, getCurrentTarget } from './targetStore';
import TargetDbConnectionDialog from './TargetDbConnectionDialog';

export default function TargetSystemSelector({ darkMode = true }) {
  const targets         = useTargetStore((s) => s.targets);
  const loading         = useTargetStore((s) => s.loading);
  const loaded          = useTargetStore((s) => s.loaded);
  const currentTargetCd = useTargetStore((s) => s.currentTargetCd);
  const loadTargets     = useTargetStore((s) => s.loadTargets);
  const setCurrentTarget= useTargetStore((s) => s.setCurrentTarget);

  const [anchorEl, setAnchorEl]         = React.useState(null);
  const [dbDialogTarget, setDbDialogTarget] = React.useState(null);

  useEffect(() => {
    if (!loaded && !loading) loadTargets();
  }, [loaded, loading, loadTargets]);

  const current = getCurrentTarget();
  const label   = current?.targetName || (loading ? '로딩중...' : 'Target 선택');

  // 다크 hero 헤더용 색상 (T3Composer landing) vs 일반용
  const onDark = darkMode;
  const bg     = onDark ? 'rgba(255,255,255,0.18)' : 'rgba(67,56,202,0.08)';
  const border = onDark ? 'rgba(255,255,255,0.32)' : 'rgba(67,56,202,0.32)';
  const color  = onDark ? '#fff' : '#4338ca';
  const hover  = onDark ? 'rgba(255,255,255,0.28)' : 'rgba(67,56,202,0.14)';

  return (
    <>
      <Tooltip title={current
        ? `Target: ${current.targetName} (${current.dbType} · ${current.gridLibrary})`
        : 'Target System 선택'}>
        <Chip
          size="small"
          clickable
          disabled={loading || targets.length === 0}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          icon={loading
            ? <CircularProgress size={12} sx={{ ml: 0.6, color: color + '!important' }} />
            : <LanguageIcon sx={{ fontSize: 14, color: color + '!important' }} />}
          label={label}
          deleteIcon={<ExpandMoreIcon sx={{ fontSize: 14 }} />}
          onDelete={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            height: 24,
            fontSize: 11.5,
            fontWeight: 700,
            bgcolor: bg,
            border: `1px solid ${border}`,
            color,
            backdropFilter: 'blur(8px)',
            '& .MuiChip-deleteIcon': { color: color + '!important', mr: 0.3 },
            '&:hover': { bgcolor: hover },
          }}
        />
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 280, mt: 0.5 } }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: 1 }}>
            TARGET SYSTEM
          </Typography>
        </Box>
        {targets.map((t) => {
          const active = t.targetCd === currentTargetCd;
          const dbConfigured = !!t.dbUrl;
          return (
            <MenuItem
              key={t.targetCd}
              onClick={() => { setCurrentTarget(t.targetCd); setAnchorEl(null); }}
              selected={active}
              sx={{ alignItems: 'flex-start', py: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={0.7}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {t.targetName}
                    </Typography>
                    {active && <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />}
                    {dbConfigured && (
                      <Tooltip title={`운영 DB 연결됨: ${t.dbUrl}`}>
                        <StorageIcon sx={{ fontSize: 12, color: '#0ea5e9' }} />
                      </Tooltip>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {t.dbType} · {t.gridLibrary} · {t.frontendStack}
                    {t.cssFramework ? ` · ${t.cssFramework}` : ''}
                  </Typography>
                </Box>
                <Tooltip title="운영 DB 접속 정보 설정">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setDbDialogTarget(t.targetCd); setAnchorEl(null); }}
                    sx={{ ml: 1 }}
                  >
                    <StorageIcon fontSize="small" sx={{ color: dbConfigured ? '#0ea5e9' : '#94a3b8' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </MenuItem>
          );
        })}
        {targets.length === 0 && !loading && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              등록된 Target 이 없습니다
            </Typography>
          </Box>
        )}
      </Menu>

      <TargetDbConnectionDialog
        open={!!dbDialogTarget}
        targetCd={dbDialogTarget}
        onClose={() => setDbDialogTarget(null)}
        onSaved={() => loadTargets()}
      />
    </>
  );
}
