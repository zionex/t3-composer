import React from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Paper,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MockShell from '../../_shared/MockShell';

// MpKtng03 — 공급망 라우팅. From → To 거점 간 운송 경로 + L/T + 비용.

const ROUTES = [
  { FROM: '신탄진 공장', TO: '서울 DC',     MODE: 'TRUCK', LT_DAYS: 1,  COST: 850000,  PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '신탄진 공장', TO: '부산 DC',     MODE: 'TRUCK', LT_DAYS: 1,  COST: 1200000, PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '대전 공장',   TO: '서울 DC',     MODE: 'TRUCK', LT_DAYS: 1,  COST: 950000,  PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '대전 공장',   TO: '광주 DC',     MODE: 'TRUCK', LT_DAYS: 1,  COST: 700000,  PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '광주 공장',   TO: '인천항',       MODE: 'TRUCK', LT_DAYS: 1,  COST: 1100000, PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '인천항',       TO: '인도 뭄바이', MODE: 'SHIP',  LT_DAYS: 28, COST: 4500000, PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '인천항',       TO: '인도네시아',  MODE: 'SHIP',  LT_DAYS: 18, COST: 3800000, PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '부산항',       TO: '몽골',        MODE: 'TRUCK+RAIL', LT_DAYS: 21, COST: 3200000, PRIORITY: 1, USE_YN: 'Y' },
  { FROM: '서울 DC',      TO: '몽골',        MODE: 'AIR',   LT_DAYS:  3, COST: 8500000, PRIORITY: 2, USE_YN: 'Y' },
];

const MODE_COLOR = { TRUCK: 'primary', SHIP: 'info', AIR: 'warning', 'TRUCK+RAIL': 'success' };

// Network diagram nodes
const NODES = [
  { name: '신탄진 공장', x: 80,  y: 80,  type: 'plant' },
  { name: '대전 공장',   x: 80,  y: 160, type: 'plant' },
  { name: '광주 공장',   x: 80,  y: 240, type: 'plant' },
  { name: '서울 DC',     x: 280, y: 80,  type: 'dc' },
  { name: '부산 DC',     x: 280, y: 200, type: 'dc' },
  { name: '광주 DC',     x: 280, y: 290, type: 'dc' },
  { name: '인천항',       x: 480, y: 120, type: 'port' },
  { name: '부산항',       x: 480, y: 220, type: 'port' },
  { name: '인도',         x: 660, y: 60,  type: 'dest' },
  { name: '인도네시아',   x: 660, y: 140, type: 'dest' },
  { name: '몽골',         x: 660, y: 240, type: 'dest' },
];
const TYPE_FILL = { plant: '#3b82f6', dc: '#10b981', port: '#f59e0b', dest: '#ef4444' };

const EDGES = [
  ['신탄진 공장', '서울 DC'], ['신탄진 공장', '부산 DC'],
  ['대전 공장', '서울 DC'], ['대전 공장', '광주 DC'],
  ['광주 공장', '인천항'],
  ['서울 DC', '인천항'], ['부산 DC', '부산항'],
  ['인천항', '인도'], ['인천항', '인도네시아'], ['부산항', '몽골'],
];

const nodeMap = Object.fromEntries(NODES.map((n) => [n.name, n]));

export default function MpRoutingMockup() {
  return (
    <MockShell patternCode="ktng_mp_routing" patternLabel="KTNG — 공급망 라우팅 (MpKtng03)"
      layoutCategory="LAYOUT_ROUTELAYOUT" description="공장→DC→항구→해외 거점 운송 경로 다이어그램 + 경로별 L/T·비용·우선순위.">
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="FROM" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="신탄진">신탄진</MenuItem><MenuItem value="대전">대전</MenuItem>
          </TextField>
          <TextField label="TO" size="small" select value="ALL" sx={{ width: 130 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="인도">인도</MenuItem><MenuItem value="몽골">몽골</MenuItem>
          </TextField>
          <TextField label="MODE" size="small" select value="ALL" sx={{ width: 110 }}>
            <MenuItem value="ALL">전체</MenuItem><MenuItem value="TRUCK">TRUCK</MenuItem><MenuItem value="SHIP">SHIP</MenuItem><MenuItem value="AIR">AIR</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>조회</Button>
          <Button variant="outlined" size="small" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, overflow: 'auto' }}>
        {/* Network diagram */}
        <Paper variant="outlined" sx={{ p: 1.5, height: 360 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>공급망 네트워크 다이어그램</Typography>
            <Chip size="small" label="공장" sx={{ backgroundColor: TYPE_FILL.plant, color: '#fff' }} />
            <Chip size="small" label="DC"   sx={{ backgroundColor: TYPE_FILL.dc,    color: '#fff' }} />
            <Chip size="small" label="항구" sx={{ backgroundColor: TYPE_FILL.port,  color: '#fff' }} />
            <Chip size="small" label="해외 거점" sx={{ backgroundColor: TYPE_FILL.dest, color: '#fff' }} />
          </Stack>
          <Box sx={{ position: 'relative', width: '100%', height: 290 }}>
            <svg viewBox="0 0 740 320" style={{ width: '100%', height: '100%' }}>
              {/* Edges */}
              {EDGES.map(([a, b], i) => {
                const A = nodeMap[a], B = nodeMap[b];
                return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#9ca3af" strokeWidth="1.5" />;
              })}
              {/* Nodes */}
              {NODES.map((n) => (
                <g key={n.name}>
                  <circle cx={n.x} cy={n.y} r="20" fill={TYPE_FILL[n.type]} stroke="#fff" strokeWidth="2" />
                  <text x={n.x} y={n.y + 38} textAnchor="middle" fontSize="11" fill="#374151" fontWeight="600">{n.name}</text>
                </g>
              ))}
            </svg>
          </Box>
        </Paper>

        {/* Route grid */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 200 }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>경로 상세 — {ROUTES.length}개</Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['FROM','','TO','운송수단','L/T (일)','비용 (KRW)','우선순위','USE'].map((c) => (
                    <TableCell key={c} sx={{ backgroundColor: 'grey.100', fontWeight: 700,
                      textAlign: ['L/T (일)','비용 (KRW)'].includes(c) ? 'right' : (['운송수단','우선순위','USE',''].includes(c) ? 'center' : 'left') }}>
                      {c}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {ROUTES.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.FROM}</TableCell>
                    <TableCell sx={{ textAlign: 'center', color: 'text.secondary' }}><ArrowForwardIcon fontSize="small" /></TableCell>
                    <TableCell>{r.TO}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.MODE} color={MODE_COLOR[r.MODE]} /></TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.LT_DAYS}</TableCell>
                    <TableCell sx={{ textAlign: 'right', fontFamily: 'monospace' }}>{r.COST.toLocaleString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.PRIORITY} variant="outlined" color={r.PRIORITY === 1 ? 'primary' : 'default'} /></TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><Chip size="small" label={r.USE_YN} color="success" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </MockShell>
  );
}
