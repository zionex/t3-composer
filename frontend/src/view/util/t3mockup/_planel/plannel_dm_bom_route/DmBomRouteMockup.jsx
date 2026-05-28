import React, { useState } from 'react';
import { Box, Stack, TextField, MenuItem, Button, Chip, Typography, Tabs, Tab, Paper, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import MockShell from '../../_shared/MockShell';

// PLANNEL DM BOM / Route — BomMaster / BomDetail / Route / Routing / BodMaster / BodItem 6개
// LAYOUT_ROUTELAYOUT — BOM 트리 다이어그램 (nested boxes + arrows) + 우측 노드 detail

const NODE = (label, code, qty, type, color) => ({ label, code, qty, type, color });

const BOM_LEVEL_0 = NODE('LED Module 60W', 'ITM-A100', 1, 'FG', 'primary');
const BOM_LEVEL_1 = [
  NODE('PCB Board Rev.3',   'ITM-B205', 1, 'SF',  'info'),
  NODE('Plastic Housing',   'ITM-D420', 1, 'RM',  'success'),
  NODE('Glass Cover',       'ITM-D421', 1, 'RM',  'success'),
  NODE('Aluminum Heatsink', 'ITM-C310', 0.5, 'RM','warning'),
];
const BOM_LEVEL_2 = [
  NODE('LED Chip 0.5W', 'ITM-E510', 12, 'RM', 'success'),
  NODE('Resistor 1kΩ',  'ITM-E520', 24, 'RM', 'success'),
  NODE('Capacitor',     'ITM-E530',  8, 'RM', 'success'),
];

const NodeBox = ({ node, level }) => (
  <Paper elevation={1} sx={{
    p: 1, minWidth: 160, textAlign: 'center',
    border: '2px solid', borderColor: `${node.color}.main`,
    backgroundColor: `${node.color}.50`,
  }}>
    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: `${node.color}.dark` }}>
      {node.code}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>{node.label}</Typography>
    <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 0.5 }}>
      <Chip label={node.type} size="small" sx={{ height: 16, fontSize: 9 }} />
      <Chip label={`× ${node.qty}`} size="small" variant="outlined" sx={{ height: 16, fontSize: 9, fontFamily: 'monospace' }} />
    </Stack>
  </Paper>
);

export default function DmBomRouteMockup() {
  const [tab, setTab] = useState(0);
  return (
    <MockShell
      patternCode="plannel_dm_bom_route"
      patternLabel="PlaNEL — DM BOM/Route (BOM Master / BOM Detail / Route / Routing / BOD Master / BOD Item)"
      layoutCategory="LAYOUT_ROUTELAYOUT"
      description="BOM / 공정 라우트 다이어그램. FLODiagram 풍 트리 (LV0→LV1→LV2) + 노드 클릭 시 우측 detail."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="Top Item" size="small" value="ITM-A100 — LED Module 60W" sx={{ width: 260 }} />
          <TextField label="유형" size="small" select value="BOM" sx={{ width: 110 }}>
            <MenuItem value="BOM">BOM</MenuItem>
            <MenuItem value="ROUTE">Route</MenuItem>
            <MenuItem value="BOD">BOD</MenuItem>
          </TextField>
          <TextField label="버전" size="small" select value="V2026.05" sx={{ width: 130 }}>
            <MenuItem value="V2025.12">V2025.12</MenuItem>
            <MenuItem value="V2026.05">V2026.05</MenuItem>
          </TextField>
          <Box sx={{ flexGrow: 1 }} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="BOM" />
            <Tab label="Route" disabled />
            <Tab label="BOD" disabled />
          </Tabs>
          <Button size="small" startIcon={<SearchIcon />} variant="contained">조회</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 70% — BOM Tree Diagram */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto', backgroundColor: 'grey.50' }}>
          {/* LV0 */}
          <Stack alignItems="center" spacing={3}>
            <NodeBox node={BOM_LEVEL_0} level={0} />
            <Box sx={{ width: 2, height: 24, backgroundColor: 'grey.400' }} />
            {/* LV1 */}
            <Stack direction="row" spacing={2} sx={{ position: 'relative' }}>
              {BOM_LEVEL_1.map((n) => <NodeBox key={n.code} node={n} level={1} />)}
            </Stack>
            <Box sx={{ width: 2, height: 24, backgroundColor: 'grey.400' }} />
            {/* LV2 — PCB Board 의 하위 */}
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-start', ml: 2 }}>
              ↑ PCB Board Rev.3 의 하위 구성요소
            </Typography>
            <Stack direction="row" spacing={2}>
              {BOM_LEVEL_2.map((n) => <NodeBox key={n.code} node={n} level={2} />)}
            </Stack>
          </Stack>
        </Box>

        {/* 우측 30% — Selected Node Detail */}
        <Box sx={{ width: '30%', borderLeft: '1px solid', borderColor: 'divider', p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>선택 노드</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <Stack>
              <Typography variant="caption" color="text.secondary">코드</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>ITM-B205</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">명칭</Typography>
              <Typography variant="body2">PCB Board Rev.3</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">유형 / 단위</Typography>
              <Typography variant="body2">SF (반제품) / EA</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">소요량 (per parent)</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>1 EA</Typography>
            </Stack>
            <Stack>
              <Typography variant="caption" color="text.secondary">하위 구성요소</Typography>
              <Typography variant="body2">3개 (LED Chip / Resistor / Capacitor)</Typography>
            </Stack>
            <Divider />
            <Button size="small" startIcon={<AddIcon />}>하위 노드 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">변경 저장</Button>
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
