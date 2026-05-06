import React, { useEffect, useState } from 'react';
import { Box, TextField, Stack, Typography, MenuItem, Alert, Button, Paper, Chip } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';

import MenuPickerDialog from '../MenuPickerDialog';
import StepDataInspector from '../StepDataInspector';

const PARENT_MENUS = [
  { value: 'MENU_UTIL', label: 'MENU_UTIL — 유틸' },
  { value: 'MENU_DP',   label: 'MENU_DP — 수요계획' },
  { value: 'MENU_MP',   label: 'MENU_MP — 마스터플랜' },
  { value: 'MENU_FP',   label: 'MENU_FP — 공장계획' },
  { value: 'MENU_BF',   label: 'MENU_BF — 베이스라인' },
  { value: 'MENU_IM',   label: 'MENU_IM — 재고관리' },
  { value: 'MENU_RP',   label: 'MENU_RP — 보충계획' },
  { value: 'MENU_SA',   label: 'MENU_SA — 판매집계' },
  { value: 'MENU_AD',   label: 'MENU_AD — 관리자' },
];

const MENU_CD_PATTERN = /^UI_(AD|BF|CM|DP|DPD|FO|FP|IM|MP|RP|SA|SALES|SO|UT)_[A-Z][A-Z0-9_]*$/;

/**
 * Step2 — 화면 전체 기본 속성.
 * menuCd 가 정해지면 langKey 기본값을 동기화. menuFilePath 는 screenId 기반 자동 제안.
 */
function Step2Overview({ value, moduleCode, onChange }) {
  // screenId 변경 시 menuFilePath 자동 제안
  useEffect(() => {
    if (value.screenId && !value.menuFilePath) {
      const module = (moduleCode || 'UT').toLowerCase();
      onChange({ ...value, menuFilePath: `/${module}/${value.screenId}` });
    }
  }, [value.screenId]); // eslint-disable-line

  // menuCd 변경 시 langKey 동기화 (사용자가 수동 변경하지 않았을 때)
  useEffect(() => {
    if (value.menuCd && (!value.langKey || value.langKey === value.menuCd)) {
      onChange({ ...value, langKey: value.menuCd });
    }
  }, [value.menuCd]); // eslint-disable-line

  const set = (patch) => onChange({ ...value, ...patch });

  const menuCdValid = !value.menuCd || MENU_CD_PATTERN.test(value.menuCd);

  // ── 기존 메뉴 참조 picker (Tree) ────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [refMenu, setRefMenu]       = useState(null);   // { menuCd, menuPath, menuFilePath, parentMenuCd, ... }

  const handlePickReferenceMenu = (m) => {
    if (!m) return;
    // 선택된 메뉴의 부모 그룹 코드 추출 — menuPath 의 첫 세그먼트 또는 ancestorPath 의 첫 토큰
    // 안전하게 parentId 가 root 그룹 노드면 그 menuCd 로 매핑.
    setRefMenu({
      menuCd: m.menuCd,
      menuNm: m.menuNm,
      menuPath: m.menuPath,
      menuFilePath: m.menuFilePath,
      parentId: m.parentId,
      ancestorPath: m.ancestorPath,
      isGroup: m.isGroup,
    });
    setPickerOpen(false);
  };

  /**
   * "이 메뉴의 값으로 비어있는 항목 채우기" — 사용자가 명시적으로 확인 후 적용.
   * 기존에 입력한 값은 보존하고, 빈 항목만 참조 메뉴 값으로 채운다.
   */
  const applyReferenceToEmpty = () => {
    if (!refMenu) return;
    const patch = {};
    if (!value.menuCd && refMenu.menuCd)             patch.menuCd       = refMenu.menuCd;
    if (!value.menuFilePath && refMenu.menuFilePath) patch.menuFilePath = refMenu.menuFilePath;
    if (!value.langKey && refMenu.menuCd)            patch.langKey      = refMenu.menuCd;
    if (!value.screenName && refMenu.menuNm)         patch.screenName   = refMenu.menuNm;
    // parentMenuCd 는 menuPath 의 첫 세그먼트 또는 menuFilePath 의 첫 세그먼트로 추정
    if (!value.parentMenuCd && refMenu.menuFilePath) {
      const seg = refMenu.menuFilePath.split('/').filter(Boolean)[0];
      const map = { util:'MENU_UTIL', system:'MENU_AD', demandplan:'MENU_DP', masterplan:'MENU_MP',
                    factoryplan:'MENU_FP', baselineforecast:'MENU_BF', inventory:'MENU_IM',
                    replenishmentplan:'MENU_RP', sales:'MENU_SA' };
      if (seg && map[seg]) patch.parentMenuCd = map[seg];
    }
    if (Object.keys(patch).length > 0) set(patch);
  };

  return (
    <Box>
      <StepDataInspector
        title="Step 2 — Overview 전체 데이터 (AI 분석 결과)"
        data={value}
        summary={[
          ...(value?.menuCd ? [{ label: value.menuCd }] : []),
          ...(value?.parentMenuCd ? [{ label: value.parentMenuCd }] : []),
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        메뉴 등록에 필요한 기본 속성을 입력합니다. <code>MENU_CD</code> 형식은 <b>UI_&lt;DOMAIN&gt;_&lt;NAME&gt;</b>.
      </Typography>

      {/* 기존 메뉴 참조 picker — Tree 에서 메뉴를 골라 그 값을 입력 항목의 참조값으로 사용 */}
      <Paper variant="outlined" sx={{ p: 1.2, mb: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <AccountTreeIcon fontSize="small" sx={{ color: '#64748b' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
            기존 메뉴 참조 (선택 사항)
          </Typography>
          <Button size="small" variant="outlined"
                  onClick={() => setPickerOpen(true)}
                  startIcon={<AccountTreeIcon fontSize="small" />}>
            메뉴 트리에서 선택
          </Button>
          {refMenu && (
            <>
              <Chip
                size="small"
                label={`${refMenu.menuCd}${refMenu.menuNm ? ' · ' + refMenu.menuNm : ''}`}
                onDelete={() => setRefMenu(null)}
                sx={{ bgcolor: '#dbeafe', color: '#1e40af' }}
              />
              <Button size="small" variant="contained"
                      onClick={applyReferenceToEmpty}
                      startIcon={<ContentPasteGoIcon fontSize="small" />}>
                비어있는 항목에 적용
              </Button>
            </>
          )}
        </Stack>
        {refMenu && (
          <Stack spacing={0.3} sx={{ mt: 1, pl: 1 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#475569' }}>
              MENU_PATH      : {refMenu.menuPath || '(없음)'}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#475569' }}>
              MENU_FILE_PATH : {refMenu.menuFilePath || '(없음)'}
            </Typography>
            {refMenu.ancestorPath && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                위치: {refMenu.ancestorPath}
              </Typography>
            )}
          </Stack>
        )}
        {!refMenu && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            어떤 항목을 입력할지 모를 때, 비슷한 기존 메뉴를 트리에서 선택해 그 값을 참고하거나
            "비어있는 항목에 적용" 으로 빠르게 채울 수 있습니다 (기존 입력값은 덮어쓰지 않음).
          </Typography>
        )}
      </Paper>

      <MenuPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickReferenceMenu}
        selectGroupOnly={false}
      />

      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small" label="Screen ID (PascalCase)" value={value.screenId}
            onChange={(e) => set({ screenId: e.target.value })}
            placeholder="UserInfoMgmt"
            sx={{ flex: 1 }} required
          />
          <TextField
            size="small" label="Screen Name (한글)" value={value.screenName}
            onChange={(e) => set({ screenName: e.target.value })}
            placeholder="사용자정보 관리"
            sx={{ flex: 1 }} required
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            size="small" label="MENU_CD" value={value.menuCd}
            onChange={(e) => set({ menuCd: e.target.value })}
            placeholder="UI_UT_USER_INFO_MGMT"
            error={!menuCdValid}
            helperText={menuCdValid ? 'UI_<DOMAIN>_<NAME>' : 'UI_<DOMAIN>_<NAME> 형식이 아님'}
            sx={{ flex: 1 }} required
          />
          <TextField
            size="small" select label="Parent Menu" value={value.parentMenuCd}
            onChange={(e) => set({ parentMenuCd: e.target.value })}
            sx={{ flex: 1 }} required
          >
            {PARENT_MENUS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            size="small" label="MENU_FILE_PATH" value={value.menuFilePath}
            onChange={(e) => set({ menuFilePath: e.target.value })}
            placeholder="/util/UserInfoMgmt"
            helperText="/<module>[/<category>]/<PascalComponentName> · lowercase(마지막)/PascalCase(마지막) 중복 금지"
            sx={{ flex: 1 }} required
          />
          <TextField
            size="small" label="LANG_KEY (i18n)" value={value.langKey}
            onChange={(e) => set({ langKey: e.target.value })}
            placeholder="UI_UT_USER_INFO_MGMT"
            helperText="기본값 = MENU_CD · TB_AD_LANG_PACK 에 4언어 등록"
            sx={{ flex: 1 }}
          />
        </Stack>

        <TextField
          size="small" label="설명 (선택)" value={value.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="이 화면이 하는 일 · 주요 사용자 · 비즈니스 가치 등"
          multiline rows={2}
        />

        {!value.parentMenuCd && (
          <Alert severity="info">
            Parent Menu 를 선택해야 다음 단계로 진행할 수 있습니다.
          </Alert>
        )}
      </Stack>
    </Box>
  );
}

export default Step2Overview;
