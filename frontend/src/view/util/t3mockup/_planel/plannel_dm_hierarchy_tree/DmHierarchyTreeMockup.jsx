import React, { useState } from 'react';
import { Box, Stack, TextField, Button, Chip, Typography, Tabs, Tab,
  List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MockShell from '../../_shared/MockShell';

const TREE_NODES = [
  { id: 'L1-FG',  label: '완제품 (LV1)',       labelEn: 'Finished Goods', level: 1, expanded: true,  indent: 0, parent: '-',                 children: 2, desc: '최종 완성 제품 대분류' },
  { id: 'L2-LED', label: 'LED Lighting (LV2)', labelEn: 'LED Lighting',   level: 2, expanded: true,  indent: 1, parent: '완제품 (LV1)',         children: 2, desc: 'LED 기반 조명 제품 카테고리' },
  { id: 'L3-IDR', label: 'Indoor (LV3)',       labelEn: 'Indoor',         level: 3, expanded: true,  indent: 2, parent: 'LED Lighting (LV2)',  children: 2, desc: '실내용 LED 조명 카테고리 — Office/Home 으로 세분화' },
  { id: 'L4-OFF', label: 'Office (LV4)',       labelEn: 'Office',         level: 4, expanded: false, indent: 3, parent: 'Indoor (LV3)',        children: 0, desc: '오피스용 LED 조명 (천장형/매립형)' },
  { id: 'L4-HOM', label: 'Home (LV4)',         labelEn: 'Home',           level: 4, expanded: false, indent: 3, parent: 'Indoor (LV3)',        children: 0, desc: '가정용 LED 조명 (전구/스탠드)' },
  { id: 'L3-ODR', label: 'Outdoor (LV3)',      labelEn: 'Outdoor',        level: 3, expanded: false, indent: 2, parent: 'LED Lighting (LV2)',  children: 0, desc: '실외용 LED 조명 (가로등/조경)' },
  { id: 'L2-IOT', label: 'IoT Device (LV2)',   labelEn: 'IoT Device',     level: 2, expanded: false, indent: 1, parent: '완제품 (LV1)',         children: 0, desc: 'IoT 연동 디바이스 (센서/허브)' },
  { id: 'L1-SF',  label: '반제품 (LV1)',       labelEn: 'Semi-Finished',  level: 1, expanded: false, indent: 0, parent: '-',                  children: 0, desc: '중간 가공품 — 추가 공정 필요' },
  { id: 'L1-RM',  label: '원자재 (LV1)',       labelEn: 'Raw Materials',  level: 1, expanded: false, indent: 0, parent: '-',                  children: 0, desc: '원료/부품 — 최초 입고' },
];

export default function DmHierarchyTreeMockup() {
  const [tab, setTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState('L3-IDR');
  const current = TREE_NODES.find((n) => n.id === selectedNode) || TREE_NODES[2];
  return (
    <MockShell
      patternCode="plannel_dm_hierarchy_tree"
      patternLabel="PlaNEL — DM 계층 마스터 (Hierarchy Config / Item Hierarchy / Customer Hierarchy)"
      layoutCategory="LAYOUT_H2"
      description="좌측 계층 TreeGrid + 우측 디테일 폼. LV1~LV5 정의 → 노드 클릭 시 우측 속성 편집."
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField label="계층 검색" size="small" value="" placeholder="레벨/명칭" sx={{ width: 220 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Item Hierarchy" />
            <Tab label="Customer Hierarchy" disabled />
            <Tab label="Hrchy Config" disabled />
          </Tabs>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 좌측 30% — Tree */}
        <Box sx={{ width: '32%', borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Stack direction="row" spacing={0.5} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Button size="small" startIcon={<AddIcon />}>레벨 추가</Button>
            <Button size="small" startIcon={<SaveIcon />} variant="contained">저장</Button>
          </Stack>
          <List dense disablePadding>
            {TREE_NODES.map((n) => {
              const sel = n.id === selectedNode;
              return (
              <ListItem key={n.id} disablePadding
                onClick={() => setSelectedNode(n.id)}
                sx={{
                  pl: 1 + n.indent * 2,
                  py: 0.5, cursor: 'pointer',
                  backgroundColor: sel ? 'primary.50' : 'transparent',
                  borderLeft: '3px solid',
                  borderLeftColor: sel ? 'primary.main' : 'transparent',
                  '&:hover': { backgroundColor: sel ? 'primary.50' : 'action.hover' },
                }}>
                <IconButton size="small" sx={{ p: 0.25 }}>
                  {n.expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>
                <Chip label={`LV${n.level}`} size="small" variant="outlined"
                  sx={{ mr: 1, fontFamily: 'monospace', fontSize: 10 }} />
                <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 13, fontWeight: sel ? 700 : 400 }} />
              </ListItem>
              );
            })}
          </List>
        </Box>

        {/* 우측 68% — Detail Form (선택 노드 기반 동적) */}
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            노드 속성 — {current.label}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="레벨 코드" size="small" value={current.id} sx={{ flex: 1 }} disabled />
              <TextField label="레벨 깊이" size="small" value={String(current.level)} sx={{ flex: 1 }} disabled />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="레벨 명 (한글)" size="small" value={current.label} sx={{ flex: 1 }} />
              <TextField label="레벨 명 (English)" size="small" value={current.labelEn} sx={{ flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="상위 노드" size="small" value={current.parent} sx={{ flex: 1 }} disabled />
              <TextField label="자식 노드 수" size="small" value={String(current.children)} sx={{ flex: 1 }} disabled />
            </Stack>
            <TextField label="설명" size="small" value={current.desc} multiline rows={2} />
            <Stack direction="row" spacing={1}>
              <Chip label="ACTIVE" color="success" size="small" />
              <Chip label="USE_YN: Y" variant="outlined" size="small" />
              <Chip label="생성: 2024-08-15" variant="outlined" size="small" />
            </Stack>
          </Stack>
        </Box>
      </Box>
    </MockShell>
  );
}
