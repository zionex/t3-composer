/**
 * MetaStep — ③ 메타·메뉴 단계.
 *   spec.meta 직접 갱신 (Phase 2E-1 에서 ScreenMetaDialog popup 의 본문을 inline form 으로 추출,
 *   Phase 2E-3 에서 ScreenMetaDialog 파일 자체 삭제).
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2e1.md (Task 5)
 */
import React, { useState } from 'react';
import {
  Box, TextField, Typography, Stack, Chip, Button,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import MenuPickerDialog from './MenuPickerDialog';

function MetaStep({ spec, onChange, targetCd }) {
  const meta = spec?.meta || {};
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [parentMenuLabel, setParentMenuLabel] = useState(meta.parentMenuCd || '');

  const update = (patch) => {
    onChange({ ...spec, meta: { ...meta, ...patch } });
  };

  const handleParentSelect = (selectedMenu) => {
    if (!selectedMenu) return;
    const cd = selectedMenu.menuCd || selectedMenu.id || '';
    update({ parentMenuCd: cd });
    setParentMenuLabel(selectedMenu.menuNm
      ? `${cd} (${selectedMenu.menuNm})`
      : cd);
    setMenuPickerOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800, mb: 0.5 }}>
        ③ 메타·메뉴
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
        화면의 식별 정보와 메뉴 등록 위치를 입력합니다. 빈 값은 Claude 가 추론합니다.
      </Typography>

      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            화면 제목
          </Typography>
          <TextField
            value={meta.title || ''}
            onChange={(e) => update({ title: e.target.value })}
            fullWidth size="small"
            placeholder="예: 사용자정보 관리"
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            메뉴 코드 (MENU_CD) — <code style={{ fontSize: 11 }}>UI_&lt;DOMAIN&gt;_&lt;NAME&gt;</code>
          </Typography>
          <TextField
            value={meta.menuCd || ''}
            onChange={(e) => update({ menuCd: e.target.value.toUpperCase() })}
            fullWidth size="small"
            placeholder="UI_UT_USER_INFO_MGMT"
            helperText="비워두면 Claude 가 화면 의도에서 추론."
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            메뉴 파일 경로 (MENU_FILE_PATH)
          </Typography>
          <TextField
            value={meta.menuFilePath || ''}
            onChange={(e) => update({ menuFilePath: e.target.value })}
            fullWidth size="small"
            placeholder="/util/UserInfoMgmt"
            helperText="형식: /<module>[/<category>]/<PascalName> (확장자 없이)."
            FormHelperTextProps={{ sx: { fontSize: 10 } }}
            sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
            부모 메뉴 (그룹) — 활성 Target ({targetCd || '미선택'}) 의 메뉴 트리
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
            {meta.parentMenuCd ? (
              <Chip
                label={parentMenuLabel || meta.parentMenuCd}
                onDelete={() => { update({ parentMenuCd: '' }); setParentMenuLabel(''); }}
                sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700,
                       fontFamily: 'monospace' }}
              />
            ) : (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                미선택 — Claude 가 화면 의도에서 추론
              </Typography>
            )}
            <Button
              size="small" variant="outlined"
              startIcon={<AccountTreeIcon fontSize="small" />}
              onClick={() => setMenuPickerOpen(true)}
              disabled={!targetCd}
            >
              메뉴 선택
            </Button>
          </Stack>
        </Box>
      </Stack>

      <MenuPickerDialog
        open={menuPickerOpen}
        onClose={() => setMenuPickerOpen(false)}
        onSelect={handleParentSelect}
        selectGroupOnly={true}
        targetCd={targetCd}
      />
    </Box>
  );
}

export default MetaStep;
