import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography,
  Switch, FormControlLabel, Divider, Checkbox, Radio, RadioGroup, FormControl } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import MockShell from '../../_shared/MockShell';

// PLANNEL DP 설정 — DpSettings / BfSettings / TargetItemSelection / PlanHorizonSelect 4개
// LAYOUT_SINGLE — 좌측 카테고리 list + 우측 설정 폼 (카테고리 클릭 시 우측 본문 전환)

const CATEGORIES = [
  { key: 'dp_main',     label: 'DP 기본 설정',  title: 'DP 기본 설정' },
  { key: 'bf_main',     label: 'BF 예측 설정',  title: 'BF 예측 알고리즘 / 데이터 정제' },
  { key: 'target_item', label: 'Target Item',   title: 'Target Item Selection (ABC-XYZ)' },
  { key: 'plan_horizon',label: 'Plan Horizon',  title: 'Plan Horizon / DTF 설정' },
];

// BF 알고리즘 후보
const BF_ALGORITHMS = [
  { key: 'ZTFM',  label: 'TimesFM',       checked: true,  isDefault: true  },
  { key: 'PR',    label: 'Prophet',       checked: true,  isDefault: false },
  { key: 'RF',    label: 'Random Forest', checked: true,  isDefault: false },
  { key: 'XGB',   label: 'GBM',           checked: false, isDefault: false },
  { key: 'ZBASE', label: 'Baseline',      checked: true,  isDefault: false },
  { key: 'ZSMA',  label: 'ZSMA',          checked: false, isDefault: false },
  { key: 'SMA',   label: 'SMA',           checked: false, isDefault: false },
  { key: 'CRST',  label: 'Croston',       checked: false, isDefault: false },
  { key: 'AR',    label: 'Auto ARIMA',    checked: true,  isDefault: false },
  { key: 'HW',    label: 'Holt-Winters',  checked: false, isDefault: false },
];

export default function DpSettingsMockup() {
  const [active, setActive] = useState('dp_main');
  const current = CATEGORIES.find((c) => c.key === active) || CATEGORIES[0];

  return (
    <MockShell
      patternCode="plannel_dp_settings"
      patternLabel="PlaNEL — DP 설정 (DP Settings / BF Settings / Target Item Selection / Plan Horizon Select)"
      layoutCategory="LAYOUT_SINGLE"
      description="좌측 설정 카테고리 list + 우측 설정 폼. 4개 DP 정책/설정 통합 화면."
    >
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 — 카테고리 list (클릭 가능) */}
        <Box sx={{ width: 240, borderRight: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="overline" sx={{ p: 1.5, display: 'block', color: 'text.secondary', fontWeight: 700 }}>설정 카테고리</Typography>
          {CATEGORIES.map((c) => {
            const sel = c.key === active;
            return (
              <Box key={c.key}
                onClick={() => setActive(c.key)}
                sx={{
                  p: 1.5, cursor: 'pointer',
                  backgroundColor: sel ? 'primary.50' : 'transparent',
                  borderLeft: '3px solid',
                  borderLeftColor: sel ? 'primary.main' : 'transparent',
                  '&:hover': { backgroundColor: sel ? 'primary.50' : 'action.hover' },
                }}>
                <Typography variant="body2" sx={{ fontWeight: sel ? 700 : 400 }}>{c.label}</Typography>
              </Box>
            );
          })}
        </Box>

        {/* 우측 — active 별 본문 */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{current.title}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip label="V2026.05 적용" color="success" size="small" />
            <Button size="small" startIcon={<SaveIcon />} variant="contained" sx={{ ml: 1 }}>저장</Button>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {/* (1) DP 기본 설정 */}
          {active === 'dp_main' && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>1. 계획 주기</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="계획 주기" select size="small" value="MONTH" sx={{ width: 180 }}>
                  <MenuItem value="WEEK">주간</MenuItem>
                  <MenuItem value="MONTH">월간</MenuItem>
                  <MenuItem value="QUARTER">분기</MenuItem>
                </TextField>
                <TextField label="버킷 단위" select size="small" value="WEEK" sx={{ width: 180 }}>
                  <MenuItem value="DAY">일</MenuItem>
                  <MenuItem value="WEEK">주</MenuItem>
                  <MenuItem value="MONTH">월</MenuItem>
                </TextField>
                <TextField label="Horizon (개월)" type="number" size="small" value={18} sx={{ width: 140 }} />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>2. 검토/승인 흐름</Typography>
              <Stack spacing={1} sx={{ mb: 3 }}>
                <FormControlLabel control={<Switch defaultChecked />} label="2단계 결재 활성" />
                <FormControlLabel control={<Switch defaultChecked />} label="이상치 자동 알림 (변동률 ±20% 초과)" />
                <FormControlLabel control={<Switch />} label="자동 확정 (검토 후 N일 미응답 시)" />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>3. 검증 규칙</Typography>
              <Stack direction="row" spacing={2}>
                <TextField label="최소 수량 (EA)" type="number" size="small" value={0} sx={{ width: 160 }} />
                <TextField label="최대 변동률 (%)" type="number" size="small" value={50} sx={{ width: 160 }} />
                <TextField label="이상치 기준 (σ)" type="number" size="small" value={2} sx={{ width: 160 }} />
              </Stack>
            </>
          )}

          {/* (2) BF 예측 설정 */}
          {active === 'bf_main' && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>1. 데이터 정제</Typography>
              <Stack spacing={1} sx={{ mb: 3 }}>
                <FormControlLabel control={<Switch defaultChecked />} label="결측치 자동 처리 (Process missing value)" />
                <Stack direction="row" spacing={2} sx={{ pl: 4 }}>
                  <TextField label="보간 방법" select size="small" value="interpolate" sx={{ width: 200 }}>
                    <MenuItem value="interpolate">Linear interpolation</MenuItem>
                    <MenuItem value="ffill">Forward fill</MenuItem>
                    <MenuItem value="bfill">Back fill</MenuItem>
                  </TextField>
                </Stack>
                <FormControlLabel control={<Switch defaultChecked />} label="이상치 제거 (Remove outlier)" />
                <Stack direction="row" spacing={2} sx={{ pl: 4 }}>
                  <TextField label="민감도 (sensitivity)" type="number" size="small" value={3.0} sx={{ width: 160 }} />
                </Stack>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>2. 학습 기간</Typography>
              <FormControl sx={{ mb: 3 }}>
                <RadioGroup row defaultValue="PERIOD">
                  <FormControlLabel value="PERIOD" control={<Radio />} label="기간 설정" />
                  <FormControlLabel value="DATE" control={<Radio />} label="시작일 설정" />
                </RadioGroup>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField label="학습 기간 (개월)" type="number" size="small" value={24} sx={{ width: 160 }} />
                  <TextField label="학습 시작일" type="date" size="small" value="2024-01-01" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} disabled />
                </Stack>
              </FormControl>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>3. 예측 알고리즘 선택</Typography>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <TextField label="기본 알고리즘 (Default)" select size="small" value="ZTFM" sx={{ width: 220 }}>
                  {BF_ALGORITHMS.map((a) => <MenuItem key={a.key} value={a.key}>{a.label}</MenuItem>)}
                </TextField>
                <Chip label="기본 알고리즘은 항상 활성" size="small" variant="outlined" color="info" />
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, mt: 1 }}>
                {BF_ALGORITHMS.map((a) => (
                  <FormControlLabel
                    key={a.key}
                    control={<Checkbox size="small" defaultChecked={a.checked} disabled={a.isDefault} />}
                    label={<span style={{ fontWeight: a.checked ? 600 : 400 }}>{a.label}{a.isDefault ? ' (기본)' : ''}</span>}
                  />
                ))}
              </Box>
            </>
          )}

          {/* (3) Target Item Selection */}
          {active === 'target_item' && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>1. 분석 기간</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="분석 시작" type="date" size="small" value="2025-06-01" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                <TextField label="분석 종료" type="date" size="small" value="2026-05-31" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                <TextField label="Max CV" type="number" size="small" value={0.5} sx={{ width: 130 }} />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>2. ABC-XYZ 분류 기준</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="기준 (Sort By)" select size="small" value="REVENUE" sx={{ width: 200 }}>
                  <MenuItem value="REVENUE">Revenue (매출)</MenuItem>
                  <MenuItem value="QUANTITY">Quantity (수량)</MenuItem>
                  <MenuItem value="FREQUENCY">Frequency (빈도)</MenuItem>
                  <MenuItem value="PROFIT">Profit (이익)</MenuItem>
                  <MenuItem value="COGS">COGS (원가)</MenuItem>
                </TextField>
                <TextField label="고객 레벨" select size="small" value="LV3" sx={{ width: 180 }}>
                  <MenuItem value="LV1">LV1 (전체)</MenuItem>
                  <MenuItem value="LV2">LV2 (Region)</MenuItem>
                  <MenuItem value="LV3">LV3 (Account)</MenuItem>
                </TextField>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>3. ABC 구간 (누적 %)</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="A 클래스 (≤)" type="number" size="small" value={80} sx={{ width: 140 }} InputProps={{ endAdornment: <span>%</span> }} />
                <TextField label="B 클래스 (≤)" type="number" size="small" value={95} sx={{ width: 140 }} InputProps={{ endAdornment: <span>%</span> }} />
                <TextField label="C 클래스 (≤)" type="number" size="small" value={100} sx={{ width: 140 }} InputProps={{ endAdornment: <span>%</span> }} disabled />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>4. 적용 범위</Typography>
              <FormControlLabel control={<Switch defaultChecked />} label="전체 품목 대상 (Select All)" />
              <FormControlLabel control={<Switch />} label="신제품 (NPI) 별도 분류" />
            </>
          )}

          {/* (4) Plan Horizon Select */}
          {active === 'plan_horizon' && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>1. 계획 시작/종료</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="계획 시작일" type="date" size="small" value="2026-05-01" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
                <TextField label="계획 종료일" type="date" size="small" value="2027-04-30" InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>2. 버킷 / 범위</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="버킷 단위" select size="small" value="MONTH" sx={{ width: 160 }}>
                  <MenuItem value="WEEK">주 (Week)</MenuItem>
                  <MenuItem value="MONTH">월 (Month)</MenuItem>
                  <MenuItem value="QUARTER">분기 (Quarter)</MenuItem>
                  <MenuItem value="YEAR">년 (Year)</MenuItem>
                </TextField>
                <TextField label="Planning Range" type="number" size="small" value={12} sx={{ width: 160 }} InputProps={{ endAdornment: <span>버킷</span> }} />
                <TextField label="주 시작일" select size="small" value="MON" sx={{ width: 140 }}>
                  <MenuItem value="MON">월요일</MenuItem>
                  <MenuItem value="SUN">일요일</MenuItem>
                </TextField>
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>3. DTF (Demand Time Fence)</Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField label="DTF (버킷 수)" type="number" size="small" value={4} sx={{ width: 160 }} helperText="이 기간 내 수요는 확정값으로 처리" />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>4. 미리보기</Typography>
              <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: 'grey.50' }}>
                <Stack direction="row" spacing={3}>
                  <Stack><Typography variant="caption" color="text.secondary">시작</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>2026-05-01 (월)</Typography></Stack>
                  <Stack><Typography variant="caption" color="text.secondary">종료</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>2027-04-30 (금)</Typography></Stack>
                  <Stack><Typography variant="caption" color="text.secondary">총 버킷 수</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>12 개월</Typography></Stack>
                  <Stack><Typography variant="caption" color="text.secondary">DTF 만료일</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'warning.main', fontWeight: 700 }}>2026-08-31</Typography></Stack>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </MockShell>
  );
}
