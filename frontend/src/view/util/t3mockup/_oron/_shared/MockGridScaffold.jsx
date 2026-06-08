import React from 'react';
import {
  Box, Stack, TextField, MenuItem, Button, Typography, Chip, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// ORON MP/PK/DP/RP/YP mockup 공용 — SearchArea + Tabs + BaseGrid 흉내 (mp_master 패턴 추출).
// 각 mockup 의 코드는 TABS 배열 (각 탭의 menu/cnt/cols/rows/search/buttons) 만 정의하고
// 이 컴포넌트가 렌더링을 담당. 운영 jsx 와 1:1 매핑을 보장하기 위해 cols/search 는 mockup
// 작성자가 직접 운영 소스에서 추출해 넣는다 (추측 금지 — CJBO 패턴 §c8dbaea 동일 원칙).

const STATUS_COLOR = { ACTV:'success', EOP:'warning', STOP:'error', CONFIRMED:'success', DRAFT:'default', RUNNING:'info', FAIL:'error' };
const LC_COLOR     = { INTRO:'info', GROWTH:'success', MATURE:'primary', DECLINE:'warning', EOL:'default' };

function renderSearchField(f) {
  if (f.type === 'button') {
    return (
      <Button key={f.key} variant="outlined" size="small" sx={{ height: 36 }}>{f.label}</Button>
    );
  }
  if (f.type === 'date') {
    return (
      <TextField key={f.key} label={f.label} size="small" type="date" InputLabelProps={{ shrink: true }} sx={{ width: f.width || 150 }} />
    );
  }
  return (
    <TextField
      key={f.key}
      label={f.label}
      size="small"
      placeholder={f.ph || ''}
      sx={{ width: f.width || 130 }}
      select={f.type === 'select' || f.type === 'multiSelect'}
      SelectProps={f.type === 'multiSelect' ? { multiple: true, value: [] } : undefined}
      value={f.type === 'select' ? '' : f.type === 'multiSelect' ? [] : ''}
    >
      {(f.options || []).map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
    </TextField>
  );
}

function renderCell(col, val) {
  if (col.group && Array.isArray(val)) {
    return val.map((sub, i) => (
      <TableCell key={col.name + ':' + i} sx={{ textAlign: 'center', fontSize: 12, fontFamily: i === 0 ? 'monospace' : undefined, color: i === 0 ? '#2563eb' : undefined }}>
        {sub}
      </TableCell>
    ));
  }
  if (col.bool) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Chip label={val ? 'Y' : 'N'} size="small" color={val ? 'success' : 'default'} variant={val ? 'filled' : 'outlined'} sx={{ height: 18, fontSize: 10 }} />
      </TableCell>
    );
  }
  if (col.status) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Chip label={val} size="small" color={STATUS_COLOR[val] || 'default'} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
      </TableCell>
    );
  }
  if (col.lifecycle) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Chip label={val} size="small" color={LC_COLOR[val] || 'default'} variant="outlined" sx={{ height: 18, fontSize: 10 }} />
      </TableCell>
    );
  }
  if (col.action) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center' }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
          <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: '#2563eb' }}>{val}</Typography>
          <IconButton size="small" sx={{ p: 0.2 }} title="Pop 검색"><OpenInNewIcon sx={{ fontSize: 14 }} /></IconButton>
        </Stack>
      </TableCell>
    );
  }
  if (col.name === 'EDIT' && Array.isArray(val)) {
    return (
      <TableCell key={col.name} sx={{ textAlign: 'center', fontSize: 11, color: '#6b7280' }}>
        <div>{val[0]}</div><div>{val[1]}</div>
      </TableCell>
    );
  }
  const isNum = col.a === 'right' && typeof val === 'number';
  return (
    <TableCell
      key={col.name}
      sx={{
        textAlign: col.a,
        fontSize: 12,
        fontFamily: isNum || (col.name && col.name.endsWith('_CD')) ? 'monospace' : undefined,
        color: (col.name && (col.name === 'ITEM_CD' || col.name === 'MAT_CD' || col.name === 'PLAN_CD' || col.name === 'VER_CD')) ? '#2563eb' : undefined,
        backgroundColor: col.edit ? '#fffbeb' : (col.warn ? '#fef2f2' : undefined),
      }}
    >
      {isNum ? val.toLocaleString(undefined, { maximumFractionDigits: 3 }) : (val === true ? 'Y' : val === false ? 'N' : val)}
    </TableCell>
  );
}

/**
 * MockGridScaffold — SearchArea + Tabs + Buttons + BaseGrid (정적 흉내) 표준 레이아웃
 *
 * props:
 *  - tabs: [{ key, label, menu, cnt, cols, rows, search, buttons, src? }]
 *    cols: [{ name, h, w, a, edit?, bool?, status?, lifecycle?, action?, group?, warn? }]
 *    rows: [{ <name>: <value>, ... }]
 *    search: [{ key, label, type:'text'|'select'|'multiSelect'|'date'|'button', width?, options?, ph? }]
 *    buttons: ['add'|'del'|'save'|'excel'][]
 *    src: 'view/oron/...File.jsx' — 기반 운영 소스 파일 경로 (1:1 출처)
 *  - footer: 추가 안내 텍스트 (옵션)
 *
 * NO-GUESS 원칙 (사용자 지시 2026-06-05):
 *  - cols 의 모든 항목은 실제 jsx 의 visible:true 컬럼이어야 함
 *  - search 의 모든 InputField 는 실제 jsx 의 SearchArea 그대로
 *  - 시각적 추측 (라이브 로그 패널 / stepper 시각화 / KPI 카드 / 차트 등) 금지
 *  - 추측인지 의심되면 그 항목은 빼고 footer 의 _source 노트에 명시
 */
export default function MockGridScaffold({ tabs, footer }) {
  const [tab, setTab] = React.useState(0);
  const cur = tabs[tab];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* SearchArea — 탭별 가변 */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
          {(cur.search || []).map(renderSearchField)}
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
        </Stack>
      </Box>

      {/* Tabs */}
      {tabs.length > 1 && (
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}>
          <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable">
            {tabs.map((t) => (
              <Tab
                key={t.key}
                label={
                  <Stack direction="row" alignItems="center" spacing={0.8}>
                    <span>{t.label}</span>
                    {t.cnt != null && <Chip size="small" label={Number(t.cnt).toLocaleString()} variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
                  </Stack>
                }
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* WorkArea */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flex: 1, gap: 1, minHeight: 0 }}>
        {/* ButtonArea */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {cur.label}
            {cur.menu && (
              <Typography component="span" sx={{ ml: 1, fontSize: 11, color: 'text.secondary', fontFamily: 'monospace' }}>{cur.menu}</Typography>
            )}
            <Typography component="span" sx={{ ml: 1.5, fontSize: 11, color: 'text.secondary' }}>
              — {(cur.rows || []).length}건{cur.cnt != null ? ` (총 ${Number(cur.cnt).toLocaleString()}건 중)` : ''}
            </Typography>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {(cur.buttons || []).includes('add')   && <Button variant="outlined"  size="small" startIcon={<AddIcon />}>행 추가</Button>}
          {(cur.buttons || []).includes('del')   && <Button variant="outlined"  size="small" startIcon={<DeleteIcon />} color="error">행 삭제</Button>}
          {(cur.buttons || []).includes('save')  && <Button variant="contained" size="small" startIcon={<SaveIcon />}>저장</Button>}
          {(cur.buttons || []).includes('excel') && <Button variant="outlined"  size="small" startIcon={<DownloadIcon />}>Excel</Button>}
        </Stack>

        {/* Grid */}
        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              {/* 그룹 헤더가 있으면 2-tier */}
              {cur.cols.some((c) => c.group) ? (
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" rowSpan={2} sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                    {cur.cols.map((c) => (
                      c.group
                        ? <TableCell key={c.name} colSpan={c.group.length} sx={{ backgroundColor: 'grey.200', fontWeight: 700, textAlign: 'center', fontSize: 12 }}>{c.h}</TableCell>
                        : <TableCell key={c.name} rowSpan={2} sx={{ backgroundColor: 'grey.100', width: c.w, fontWeight: 700, textAlign: c.a, fontSize: 12 }}>
                            {c.h}{c.edit ? <Typography component="span" sx={{ ml: 0.4, fontSize: 9, color: '#d97706' }}>✎</Typography> : null}
                          </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    {cur.cols.filter((c) => c.group).flatMap((c) =>
                      c.group.map((sub) => (
                        <TableCell key={c.name + ':' + sub} sx={{ backgroundColor: 'grey.100', fontWeight: 600, textAlign: 'center', fontSize: 11 }}>{sub}</TableCell>
                      ))
                    )}
                  </TableRow>
                </TableHead>
              ) : (
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ backgroundColor: 'grey.100' }}> </TableCell>
                    {cur.cols.map((c) => (
                      <TableCell key={c.name} sx={{ backgroundColor: 'grey.100', width: c.w, fontWeight: 700, textAlign: c.a, fontSize: 12 }}>
                        {c.h}{c.edit ? <Typography component="span" sx={{ ml: 0.4, fontSize: 9, color: '#d97706' }}>✎</Typography> : null}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              )}
              <TableBody>
                {(cur.rows || []).map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell padding="checkbox"> </TableCell>
                    {cur.cols.flatMap((c) => {
                      const cell = renderCell(c, r[c.name]);
                      return Array.isArray(cell) ? cell : [cell];
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 0.7, borderTop: '1px solid', borderColor: 'divider', fontSize: 10, color: 'text.secondary', backgroundColor: 'grey.50' }}>
            <span style={{ color: '#d97706', marginRight: 4 }}>✎</span> = editable · 노란 셀 = 수정 대상 · 파란 코드 = PK 식별자{footer ? ' · ' + footer : ''}
            {cur.src && (
              <Box component="span" sx={{ ml: 1.5, fontFamily: 'monospace', color: '#475569' }}>
                <span style={{ color: '#10b981', marginRight: 4 }}>●</span>
                기반 소스 (NO-GUESS 1:1): <span style={{ color: '#0f172a' }}>{cur.src}</span>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
