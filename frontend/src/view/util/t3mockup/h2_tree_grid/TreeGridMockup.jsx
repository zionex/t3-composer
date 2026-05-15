import React from 'react';
import { Box, Stack, TextField, Button, Typography, Chip, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';

import MockShell from '../_shared/MockShell';
import { ITEMS } from '../_data/mockData';

// 더미 BOM 트리 (LED Module 60W 의 구성)
const BOM_TREE = [
  { id: 'IT-A001', label: 'LED Module 60W (FG)', level: 0, open: true, qty: 1, children: [
    { id: 'IT-M001', label: 'PCB Substrate FR4 (RM)', level: 1, open: true, qty: 1, children: [
      { id: 'SUB-001', label: 'Copper layer 35µm', level: 2, qty: 2 },
    ]},
    { id: 'IT-M002', label: 'Resistor 10kΩ (RM)', level: 1, qty: 12 },
    { id: 'IT-M003', label: 'Capacitor 100µF (RM)', level: 1, qty: 4 },
    { id: 'LED-CHIP', label: 'LED Chip SMD 2835', level: 1, qty: 60 },
  ]},
];

function TreeNode({ node, onSelect, selectedId, depth = 0 }) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  return (
    <>
      <Box
        onClick={() => onSelect(node)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          pl: 1 + depth * 1.5, pr: 1, py: 0.5,
          cursor: 'pointer',
          backgroundColor: isSelected ? 'primary.light' : 'transparent',
          color: isSelected ? 'primary.contrastText' : 'inherit',
          '&:hover': { backgroundColor: isSelected ? 'primary.light' : 'action.hover' },
        }}
      >
        {hasChildren ? (
          node.open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
        ) : (
          <Box sx={{ width: 20 }} />
        )}
        {hasChildren ? (node.open ? <FolderOpenIcon fontSize="small" color="warning" /> : <FolderIcon fontSize="small" color="warning" />) : <ArticleOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
        <Typography sx={{ fontSize: 13, flex: 1, fontWeight: isSelected ? 600 : 400 }}>{node.label}</Typography>
        <Chip size="small" label={`×${node.qty}`} sx={{ height: 18, fontSize: 10 }} />
      </Box>
      {node.open && hasChildren && node.children.map((c) => (
        <TreeNode key={c.id} node={c} onSelect={onSelect} selectedId={selectedId} depth={depth + 1} />
      ))}
    </>
  );
}

export default function TreeGridMockup() {
  const [selectedId, setSelectedId] = React.useState('IT-A001');
  const selected = (function find(nodes) {
    for (const n of nodes) {
      if (n.id === selectedId) return n;
      if (n.children) { const r = find(n.children); if (r) return r; }
    }
    return null;
  })(BOM_TREE);
  const itemInfo = ITEMS.find((i) => i.itemCd === selectedId);

  return (
    <MockShell
      patternCode="h2_tree_grid"
      patternLabel="P04 — 트리 그리드 (좌 트리 + 우 디테일)"
      layoutCategory="LAYOUT_H2"
      description="BOM/조직도 등 계층 데이터. 좌측 트리에서 선택 시 우측에 디테일 표시."
    >
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField label="품목 검색" size="small" placeholder="LED Module..." sx={{ width: 220 }} />
          <Button variant="contained" size="small" startIcon={<SearchIcon />}>검색</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Tree (좌측 30%) */}
        <Box sx={{ width: '30%', borderRight: '1px solid', borderColor: 'divider', overflow: 'auto', backgroundColor: 'background.paper' }}>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">BOM Tree</Typography>
          </Box>
          {BOM_TREE.map((n) => <TreeNode key={n.id} node={n} onSelect={(node) => setSelectedId(node.id)} selectedId={selectedId} />)}
        </Box>

        {/* Detail (우측 70%) */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">{selected?.label || '-'}</Typography>
            <Typography variant="caption" color="text.secondary">선택된 노드 디테일</Typography>
            {itemInfo && (
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableBody>
                    {[
                      ['품목코드', itemInfo.itemCd, true],
                      ['품목명', itemInfo.itemNm, false],
                      ['품목 유형', itemInfo.itemTp, false],
                      ['그룹', itemInfo.itemGrp, false],
                      ['단가', `₩ ${itemInfo.unitPrice.toLocaleString()}`, true],
                      ['LT', `${itemInfo.leadTime} days`, false],
                      ['UOM', itemInfo.uom, false],
                      ['사용여부', itemInfo.useYn, false],
                    ].map(([k, v, mono]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ width: 130, backgroundColor: 'grey.100', fontWeight: 600 }}>{k}</TableCell>
                        <TableCell sx={{ fontFamily: mono ? 'monospace' : 'inherit' }}>{v}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Box>
    </MockShell>
  );
}
