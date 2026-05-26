import React from 'react';
import { Box, Stack, TextField, Button, Chip, Typography, Tabs, Tab,
  List, ListItem, ListItemText, IconButton, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MockShell from '../../_shared/MockShell';

const TREE_NODES = [
  { id: 'L1-FG',  label: '완제품 (LV1)',  level: 1, expanded: true, indent: 0 },
  { id: 'L2-LED', label: 'LED Lighting (LV2)', level: 2, expanded: true, indent: 1 },
  { id: 'L3-IDR', label: 'Indoor (LV3)',       level: 3, expanded: true, indent: 2 },
  { id: 'L4-OFF', label: 'Office (LV4)',       level: 4, expanded: false, indent: 3 },
  { id: 'L4-HOM', label: 'Home (LV4)',         level: 4, expanded: false, indent: 3 },
  { id: 'L3-ODR', label: 'Outdoor (LV3)',      level: 3, expanded: false, indent: 2 },
  { id: 'L2-IOT', label: 'IoT Device (LV2)',   level: 2, expanded: false, indent: 1 },
  { id: 'L1-SF',  label: '반제품 (LV1)',  level: 1, expanded: false, indent: 0 },
  { id: 'L1-RM',  label: '원자재 (LV1)',  level: 1, expanded: false, indent: 0 },
];

export default function DmHierarchyTreeMockup() {
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
          <Tabs value={0}>
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
            {TREE_NODES.map((n, idx) => (
              <ListItem key={n.id} disablePadding sx={{
                pl: 1 + n.indent * 2,
                py: 0.5,
                backgroundColor: idx === 2 ? 'primary.50' : 'transparent',
                borderLeft: idx === 2 ? '3px solid' : '3px solid transparent',
                borderLeftColor: idx === 2 ? 'primary.main' : 'transparent',
              }}>
                <IconButton size="small" sx={{ p: 0.25 }}>
                  {n.expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                </IconButton>
                <Chip label={`LV${n.level}`} size="small" variant="outlined"
                  sx={{ mr: 1, fontFamily: 'monospace', fontSize: 10 }} />
                <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 13 }} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 우측 68% — Detail Form */}
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            노드 속성 — Indoor (LV3)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="레벨 코드" size="small" value="L3-IDR" sx={{ flex: 1 }} disabled />
              <TextField label="레벨 깊이" size="small" value="3" sx={{ flex: 1 }} disabled />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="레벨 명 (한글)" size="small" value="Indoor" sx={{ flex: 1 }} />
              <TextField label="레벨 명 (English)" size="small" value="Indoor" sx={{ flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="상위 노드" size="small" value="LED Lighting (LV2)" sx={{ flex: 1 }} disabled />
              <TextField label="자식 노드 수" size="small" value="2" sx={{ flex: 1 }} disabled />
            </Stack>
            <TextField label="설명" size="small" value="실내용 LED 조명 카테고리 — Office/Home 으로 세분화" multiline rows={2} />
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
