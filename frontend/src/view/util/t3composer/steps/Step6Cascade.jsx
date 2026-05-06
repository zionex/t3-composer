import React from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, IconButton, Chip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';

import StepDataInspector from '../StepDataInspector';

const REGISTRY_CHILDREN = [
  { value: 'itemCd',     label: 'itemCd · parent=itemLvCd · PopSelectItem' },
  { value: 'accountCd',  label: 'accountCd · parent=salesLvCd · PopSelectAccount' },
  { value: 'locatCd',    label: 'locatCd · parent=locatTpCd · PopLocatMst' },
  { value: 'simulVerCd', label: 'simulVerCd · parent=mainVerCd' },
  { value: 'deptCd',     label: 'deptCd (popup-only) · PopDepartment' },
  { value: 'positionCd', label: 'positionCd (popup-only) · PopPosition' },
];

/**
 * Step6 — 각 Area 의 Column 주종관계 (Field Cascade).
 * 레지스트리(fieldCascade.js) 에 이미 있는 관계는 자동 적용되므로 여기서는
 * 해당 컬럼을 사용 중임을 선언만 한다. 새 관계가 필요하면 레지스트리 등록 요청 안내.
 */
function Step6Cascade({ areas, columns, value, onChange }) {
  const setArea = (areaId, patch) => {
    onChange({ ...value, [areaId]: { ...(value[areaId] || { rules: [] }), ...patch } });
  };

  const addRule = (areaId) => {
    const current = value[areaId] || { rules: [] };
    setArea(areaId, { rules: [...current.rules, { child: '', parent: '', filterParam: '', popup: '' }] });
  };

  const updateRule = (areaId, idx, patch) => {
    const current = value[areaId] || { rules: [] };
    const next = current.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    setArea(areaId, { rules: next });
  };

  const removeRule = (areaId, idx) => {
    const current = value[areaId] || { rules: [] };
    setArea(areaId, { rules: current.rules.filter((_, i) => i !== idx) });
  };

  const dataAreas = areas.filter((a) => ['grid', 'tree', 'pivot'].includes(a.kind));

  return (
    <Box>
      <StepDataInspector
        title="Step 6 — Cascade 전체 데이터 (AI 분석 결과)"
        data={value}
        summary={[
          { label: `${Object.keys(value || {}).length} areas` },
          { label: `${Object.values(value || {}).reduce((n, v) => n + (v?.rules?.length || 0), 0)} rules` },
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Column 간 주종관계(parent → child)를 선언합니다. <code>packages/wingui/src/common/fieldCascade.js</code>
        의 레지스트리에 이미 있는 관계는 <b>컬럼 이름만 맞추면 자동 적용</b>. 이 단계는 "이 화면에서 사용 중"
        임을 LLM 에 알려 <code>useFieldCascade</code>/<code>applyGridCascade</code> 호출 코드를 누락 없이 생성하기 위함.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        레지스트리에 없는 새 관계가 필요하면 이 wizard 에서 작업하지 말고 <code>fieldCascade.js</code> 에 먼저 엔트리를 추가해 주세요.
      </Alert>

      <Stack spacing={2}>
        {dataAreas.map((a) => {
          const areaState = value[a.id] || { rules: [] };
          const areaColumns = (columns[a.id]?.columns || []).map((c) => c.name);
          return (
            <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                <Chip label={a.kind} size="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, ml: 1, flex: 1 }}>{a.id}</Typography>
                <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={() => addRule(a.id)}>
                  관계 추가
                </Button>
              </Stack>

              {areaState.rules.length === 0 ? (
                <Typography variant="caption" color="text.secondary">주종관계 없음 (단순 마스터).</Typography>
              ) : (
                <Stack spacing={1}>
                  {areaState.rules.map((r, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      <TextField size="small" select label="Child (레지스트리)"
                        value={r.child}
                        onChange={(e) => {
                          const preset = REGISTRY_CHILDREN.find((c) => c.value === e.target.value);
                          const derivedParent = preset?.label.match(/parent=(\w+)/)?.[1] || '';
                          const derivedPopup  = preset?.label.match(/(Pop\w+|popup-only)/)?.[1] || '';
                          updateRule(a.id, idx, {
                            child: e.target.value,
                            parent: derivedParent,
                            filterParam: derivedParent,
                            popup: derivedPopup,
                          });
                        }}
                        sx={{ width: 360 }}
                      >
                        {REGISTRY_CHILDREN.map((c) => (
                          <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                        ))}
                      </TextField>
                      <TextField size="small" label="Parent" value={r.parent}
                        onChange={(e) => updateRule(a.id, idx, { parent: e.target.value })}
                        sx={{ width: 140 }}
                      />
                      <TextField size="small" label="Popup" value={r.popup}
                        onChange={(e) => updateRule(a.id, idx, { popup: e.target.value })}
                        sx={{ width: 200 }}
                      />
                      <IconButton size="small" onClick={() => removeRule(a.id, idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}

              {areaColumns.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  이 Area 의 컬럼: {areaColumns.join(' · ')}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

export default Step6Cascade;
