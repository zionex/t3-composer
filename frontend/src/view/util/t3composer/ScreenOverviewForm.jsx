import React, { useState } from 'react';

import {
  Box,
  TextField,
  Typography,
  Stack,
  IconButton,
  Button,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import StorageIcon from '@mui/icons-material/Storage';
import HubIcon from '@mui/icons-material/Hub';
import ClearIcon from '@mui/icons-material/Clear';

import MenuPickerDialog from './MenuPickerDialog';
import TablePickerDialog from './TablePickerDialog';
import OntologyPickerDialog from './OntologyPickerDialog';

const CATEGORY_COLOR = {
  VIEW:    '#5281b3',
  QA:      '#2a9d8f',
  PROCESS: '#fa7d5b',
  ENTITY:  '#ffb100',
};

/**
 * Step 3 — 화면 개요.
 *
 * 입력 보조:
 *  - 부모 메뉴 코드: MenuPickerDialog 팝업 (TB_AD_MENU 트리)
 *  - 메뉴 경로: 부모 선택 시 자동 제안
 *  - 참조 테이블: TablePickerDialog (sys.tables) + OntologyPickerDialog (4 탭) 병행
 *
 * 수집 결과는 Claude 에 구조화된 JSON 스펙으로 전달되어 토큰을 절약.
 */
function ScreenOverviewForm({ module, value, onChange }) {
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [ontologyDialogOpen, setOntologyDialogOpen] = useState(false);

  const nextIdHint = `UI_${module?.code || 'XX'}_${String(Math.floor(Math.random() * 900) + 100)}`;

  const update = (patch) => onChange({ ...value, ...patch });

  const handleMenuPicked = (menu) => {
    // 부모 메뉴 코드 + 경로 자동 제안
    const base = menu.menuPath || '';
    const suggestPath = base
      ? base.replace(/\/+$/, '') + '/' + (value.screenId ? value.screenId.toLowerCase().replace(/^ui_/, '') : '')
      : `/${(module?.code || 'module').toLowerCase()}/...`;
    update({
      parentMenuCd: menu.menuCd,
      menuPath: value.menuPath ? value.menuPath : suggestPath,
    });
  };

  const handleTablesPicked = (names) => {
    // 기존 텍스트에 누적 (중복 제거)
    const current = parseTables(value.tables);
    const merged = Array.from(new Set([...current, ...names]));
    update({ tables: merged.join(', ') });
  };

  const handleOntologyPicked = (refs) => {
    // 선택된 온톨로지는 별도 필드로 보관 (ontologyRefs)
    const prev = Array.isArray(value.ontologyRefs) ? value.ontologyRefs : [];
    const merged = dedupRefs([...prev, ...refs]);
    update({ ontologyRefs: merged });
  };

  const removeOntologyRef = (ref) => {
    const prev = Array.isArray(value.ontologyRefs) ? value.ontologyRefs : [];
    update({ ontologyRefs: prev.filter((r) => !(r.category === ref.category && String(r.key) === String(ref.key))) });
  };

  // ---- 조회 조건 ----
  const addSearchCond = () => {
    update({
      searchConditions: [
        ...(value.searchConditions || []),
        { name: '', langKey: '', type: 'Text', required: false, defaultValue: '' },
      ],
    });
  };
  const updateSearchCond = (idx, patch) => {
    const list = [...(value.searchConditions || [])];
    list[idx] = { ...list[idx], ...patch };
    update({ searchConditions: list });
  };
  const removeSearchCond = (idx) => {
    const list = [...(value.searchConditions || [])];
    list.splice(idx, 1);
    update({ searchConditions: list });
  };

  return (
    <>
      <Stack spacing={3}>
        {/* 기본 정보 */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            기본 정보
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="화면 ID"
                placeholder={nextIdHint}
                value={value.screenId || ''}
                onChange={(e) => update({ screenId: e.target.value.toUpperCase() })}
                helperText={`권장 형식: UI_${module?.code || 'XX'}_NNN`}
              />
              <TextField
                fullWidth
                size="small"
                label="화면명 (표시)"
                value={value.screenName || ''}
                onChange={(e) => update({ screenName: e.target.value })}
                helperText="예: 수요 입력 · 실적 조회"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="다국어 키 (옵션)"
                value={value.langKey || ''}
                onChange={(e) => update({ langKey: e.target.value })}
                helperText="TB_AD_LANG_PACK.LANG_KEY — 비우면 화면 ID 사용"
              />
              {/* 부모 메뉴 코드 + Picker */}
              <TextField
                fullWidth
                size="small"
                label="부모 메뉴 코드"
                placeholder={`MENU_${module?.code || 'XX'}_...`}
                value={value.parentMenuCd || ''}
                onChange={(e) => update({ parentMenuCd: e.target.value.toUpperCase() })}
                helperText="TB_AD_MENU 에서 선택 · 버튼으로 트리 팝업"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="메뉴 트리에서 선택">
                        <IconButton size="small" onClick={() => setMenuDialogOpen(true)}>
                          <FolderOpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {value.parentMenuCd && (
                        <IconButton size="small" onClick={() => update({ parentMenuCd: '' })}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
            <TextField
              fullWidth
              size="small"
              label="메뉴 경로"
              placeholder={`/${(module?.code || 'module').toLowerCase()}/...`}
              value={value.menuPath || ''}
              onChange={(e) => update({ menuPath: e.target.value })}
              helperText="부모 메뉴 선택 시 자동 제안 (수정 가능)"
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              label="화면 설명"
              placeholder="이 화면의 업무 목적, 주요 기능, 사용 시나리오를 설명하세요."
              value={value.description || ''}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Stack>
        </Paper>

        {/* 조회 조건 */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              조회 조건
            </Typography>
            <Button startIcon={<AddIcon fontSize="small" />} size="small" onClick={addSearchCond}>
              조건 추가
            </Button>
          </Stack>
          {(value.searchConditions || []).length === 0 && (
            <Typography variant="caption" color="text.secondary">
              조회 조건이 없습니다. 필요 시 "조건 추가" 를 눌러 입력하세요.
            </Typography>
          )}
          <Stack spacing={1}>
            {(value.searchConditions || []).map((c, idx) => (
              <Stack key={idx} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                <TextField
                  size="small"
                  label="이름"
                  placeholder="품목"
                  value={c.name || ''}
                  onChange={(e) => updateSearchCond(idx, { name: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="다국어 키"
                  placeholder="ITEM_CD"
                  value={c.langKey || ''}
                  onChange={(e) => updateSearchCond(idx, { langKey: e.target.value })}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={c.type || 'Text'}
                    label="Type"
                    onChange={(e) => updateSearchCond(idx, { type: e.target.value })}
                  >
                    <MenuItem value="Text">Text</MenuItem>
                    <MenuItem value="Number">Number</MenuItem>
                    <MenuItem value="Select">Select (Single)</MenuItem>
                    <MenuItem value="MultiSelect">Select (Multi)</MenuItem>
                    <MenuItem value="Date">Date</MenuItem>
                    <MenuItem value="DateRange">DateRange</MenuItem>
                    <MenuItem value="Popup">Popup</MenuItem>
                    <MenuItem value="Check">Check</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="기본값"
                  value={c.defaultValue || ''}
                  onChange={(e) => updateSearchCond(idx, { defaultValue: e.target.value })}
                  sx={{ width: { md: 120 } }}
                />
                <Chip
                  label={c.required ? '필수' : '선택'}
                  size="small"
                  color={c.required ? 'primary' : 'default'}
                  onClick={() => updateSearchCond(idx, { required: !c.required })}
                  sx={{ cursor: 'pointer' }}
                />
                <IconButton size="small" color="error" onClick={() => removeSearchCond(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* 참조 테이블 + 온톨로지 */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              참조 테이블 / 온톨로지
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                startIcon={<StorageIcon fontSize="small" />}
                onClick={() => setTableDialogOpen(true)}
                variant="outlined"
              >
                DB 테이블
              </Button>
              <Button
                size="small"
                startIcon={<HubIcon fontSize="small" />}
                onClick={() => setOntologyDialogOpen(true)}
                variant="outlined"
                color="warning"
              >
                온톨로지
              </Button>
            </Stack>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            화면이 사용할 주요 테이블 + 온톨로지 참조. Claude 에 구조화 스펙으로 전달됩니다.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            size="small"
            placeholder={`예: ${(module?.commonTables || []).slice(0, 3).join(', ')}`}
            value={value.tables || ''}
            onChange={(e) => update({ tables: e.target.value })}
            helperText="직접 입력 또는 DB 테이블 버튼으로 다중 선택"
          />

          {/* 선택된 온톨로지 칩 */}
          {Array.isArray(value.ontologyRefs) && value.ontologyRefs.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                선택된 온톨로지 ({value.ontologyRefs.length})
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {value.ontologyRefs.map((r) => {
                  const color = CATEGORY_COLOR[r.category] || '#888';
                  return (
                    <Chip
                      key={`${r.category}_${r.key}`}
                      size="small"
                      label={
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={r.category}
                            size="small"
                            sx={{ height: 14, fontSize: 9, bgcolor: `${color}22`, color, fontWeight: 600 }}
                          />
                          <span style={{ fontSize: 11 }}>{r.title}</span>
                        </Stack>
                      }
                      onDelete={() => removeOntologyRef(r)}
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            </>
          )}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.disabled">
            {module?.code} 모듈 공통 테이블: {(module?.commonTables || []).join(', ')}
          </Typography>
        </Paper>
      </Stack>

      {/* Pickers */}
      <MenuPickerDialog
        open={menuDialogOpen}
        onClose={() => setMenuDialogOpen(false)}
        onSelect={handleMenuPicked}
        selectGroupOnly={true}
      />
      <TablePickerDialog
        open={tableDialogOpen}
        onClose={() => setTableDialogOpen(false)}
        onSelect={handleTablesPicked}
        initialSelected={parseTables(value.tables)}
      />
      <OntologyPickerDialog
        open={ontologyDialogOpen}
        onClose={() => setOntologyDialogOpen(false)}
        onSelect={handleOntologyPicked}
      />
    </>
  );
}

// ---- helpers ----

function parseTables(text) {
  if (!text) return [];
  return text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

function dedupRefs(refs) {
  const seen = new Set();
  const out = [];
  for (const r of refs) {
    const k = `${r.category}_${r.key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export default ScreenOverviewForm;
