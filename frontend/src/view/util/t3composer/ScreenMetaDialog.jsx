/**
 * ScreenMetaDialog — ComposerSpec.meta 의 4필드 입력 모달.
 *
 *   props:
 *     open
 *     onClose()
 *     meta            ComposerSpec.meta { title, menuCd, parentMenuCd, menuFilePath, pattern }
 *     onApply(nextMeta)
 *     targetCd        활성 Target — 부모 메뉴 picker 가 이 Target 의 메뉴 트리 표시
 *
 *   디자인:
 *     - 화면 제목 — TextField
 *     - 메뉴 코드 (UI_<DOMAIN>_<NAME>) — TextField + 자동 추론 도움말
 *     - 메뉴 파일 경로 (/<module>/<PascalName>) — TextField
 *     - 부모 메뉴 — chip + [선택] 버튼 → MenuPickerDialog (targetCd 전달)
 *
 *   Plan: docs/superpowers/plans/2026-05-22-composer-canvas-phase2d1.md (Task 2)
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton, Stack, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

import MenuPickerDialog from './MenuPickerDialog';

function ScreenMetaDialog({ open, onClose, meta, onApply, targetCd }) {
  const [title, setTitle] = useState('');
  const [menuCd, setMenuCd] = useState('');
  const [parentMenuCd, setParentMenuCd] = useState('');
  const [parentMenuLabel, setParentMenuLabel] = useState('');  // 표시용
  const [menuFilePath, setMenuFilePath] = useState('');
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);

  // open 시 hydrate
  useEffect(() => {
    if (!open) return;
    setTitle(meta?.title || '');
    setMenuCd(meta?.menuCd || '');
    setParentMenuCd(meta?.parentMenuCd || '');
    setParentMenuLabel(meta?.parentMenuCd || '');
    setMenuFilePath(meta?.menuFilePath || '');
  }, [open, meta]);

  const handleApply = () => {
    onApply({
      ...(meta || {}),
      title: title.trim(),
      menuCd: menuCd.trim(),
      parentMenuCd: parentMenuCd.trim(),
      menuFilePath: menuFilePath.trim(),
    });
    onClose();
  };

  const handleParentSelect = (selectedMenu) => {
    if (!selectedMenu) return;
    setParentMenuCd(selectedMenu.menuCd || selectedMenu.id || '');
    setParentMenuLabel(
      selectedMenu.menuNm
        ? `${selectedMenu.menuCd} (${selectedMenu.menuNm})`
        : (selectedMenu.menuCd || selectedMenu.id || '')
    );
    setMenuPickerOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: '#1e40af', fontWeight: 800 }}>
            📋 화면 메타 — 메뉴 등록
          </Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                화면 제목
              </Typography>
              <TextField
                value={title} onChange={(e) => setTitle(e.target.value)}
                fullWidth size="small"
                placeholder="예: 사용자정보 관리"
                sx={{ mt: 0.5 }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                메뉴 코드 (MENU_CD) — <code style={{ fontSize: 11 }}>UI_&lt;DOMAIN&gt;_&lt;NAME&gt;</code> 형식
              </Typography>
              <TextField
                value={menuCd} onChange={(e) => setMenuCd(e.target.value.toUpperCase())}
                fullWidth size="small"
                placeholder="UI_UT_USER_INFO_MGMT"
                helperText="비워두면 Claude 가 화면 의도에서 추론합니다."
                FormHelperTextProps={{ sx: { fontSize: 10 } }}
                sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                메뉴 파일 경로 (MENU_FILE_PATH) — JSX 컴포넌트 경로
              </Typography>
              <TextField
                value={menuFilePath} onChange={(e) => setMenuFilePath(e.target.value)}
                fullWidth size="small"
                placeholder="/util/UserInfoMgmt"
                helperText="형식: /<module>[/<category>]/<PascalName> (확장자 없이). 비워두면 Claude 가 결정."
                FormHelperTextProps={{ sx: { fontSize: 10 } }}
                sx={{ mt: 0.5, '& input': { fontFamily: 'monospace' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                부모 메뉴 (그룹) — 활성 Target ({targetCd || '미선택'}) 의 메뉴 트리
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
                {parentMenuCd ? (
                  <Chip
                    label={parentMenuLabel || parentMenuCd}
                    onDelete={() => { setParentMenuCd(''); setParentMenuLabel(''); }}
                    sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700, fontFamily: 'monospace' }}
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
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={onClose}>취소</Button>
          <Button onClick={handleApply} variant="contained">적용</Button>
        </DialogActions>
      </Dialog>

      <MenuPickerDialog
        open={menuPickerOpen}
        onClose={() => setMenuPickerOpen(false)}
        onSelect={handleParentSelect}
        selectGroupOnly={true}
        targetCd={targetCd}
      />
    </>
  );
}

export default ScreenMetaDialog;
