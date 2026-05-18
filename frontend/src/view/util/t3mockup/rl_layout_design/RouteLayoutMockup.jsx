import React from 'react';
import { Box, Stack, Button, Chip, Typography, Card, CardContent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

import MockShell from '../_shared/MockShell';

const NODES = [
  { id: 'IN',   label: '입고\nWarehouse', x: 50,  y: 220, w: 110, h: 60,  color: '#5281b3' },
  { id: 'PCB',  label: 'PCB 조립\nLine A', x: 220, y: 100, w: 130, h: 60,  color: '#2a9d8f' },
  { id: 'SOL',  label: 'SMD 솔더',         x: 220, y: 220, w: 130, h: 60,  color: '#2a9d8f' },
  { id: 'INSP', label: '검사\nQC',         x: 220, y: 340, w: 130, h: 60,  color: '#ffb100' },
  { id: 'ASSY', label: '최종 조립\nLine B', x: 410, y: 160, w: 140, h: 60,  color: '#2a9d8f' },
  { id: 'PACK', label: '포장\nPackaging',   x: 410, y: 300, w: 140, h: 60,  color: '#2a9d8f' },
  { id: 'OUT',  label: '출하\nDC',          x: 610, y: 220, w: 110, h: 60,  color: '#fa7d5b' },
];

const EDGES = [
  { from: 'IN',   to: 'PCB' },
  { from: 'IN',   to: 'SOL' },
  { from: 'IN',   to: 'INSP' },
  { from: 'PCB',  to: 'ASSY' },
  { from: 'SOL',  to: 'ASSY' },
  { from: 'INSP', to: 'PACK' },
  { from: 'ASSY', to: 'PACK' },
  { from: 'PACK', to: 'OUT' },
];

function findNode(id) { return NODES.find((n) => n.id === id); }

export default function RouteLayoutMockup() {
  return (
    <MockShell
      patternCode="rl_layout_design"
      patternLabel="RL — 라우트 레이아웃 (FLODiagram)"
      layoutCategory="LAYOUT_ROUTELAYOUT"
      description="공정 라우트 / BOM / 공급망 시각화. SVG 노드 + 화살표. ReactFlow 기반 FLODiagram 컴포넌트가 실제 구현."
    >
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip size="small" label="공정 라우트" color="warning" />
          <Typography variant="body2">LED Module 60W — 표준 라우트</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<EditIcon />}>편집</Button>
          <Button size="small" variant="contained" startIcon={<SaveIcon />}>저장</Button>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2, overflow: 'auto', backgroundColor: '#fafbfc' }}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent sx={{ height: '100%', p: 1 }}>
            <svg width="100%" height="100%" viewBox="0 0 780 460" preserveAspectRatio="xMidYMid meet">
              {/* arrow marker */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
                </marker>
              </defs>

              {/* edges */}
              {EDGES.map((e, i) => {
                const a = findNode(e.from);
                const b = findNode(e.to);
                if (!a || !b) return null;
                const x1 = a.x + a.w, y1 = a.y + a.h / 2;
                const x2 = b.x, y2 = b.y + b.h / 2;
                const mx = (x1 + x2) / 2;
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    stroke="#555" strokeWidth={2} fill="none" markerEnd="url(#arrow)"
                  />
                );
              })}

              {/* nodes */}
              {NODES.map((n) => (
                <g key={n.id}>
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={6} ry={6}
                        fill="white" stroke={n.color} strokeWidth={2} />
                  <rect x={n.x} y={n.y} width={n.w} height={20} rx={6} ry={6} fill={n.color} />
                  <text x={n.x + n.w / 2} y={n.y + 14} textAnchor="middle"
                        style={{ fontSize: 11, fontWeight: 700, fill: 'white' }}>{n.id}</text>
                  {n.label.split('\n').map((line, li) => (
                    <text key={li} x={n.x + n.w / 2} y={n.y + 36 + li * 14}
                          textAnchor="middle" style={{ fontSize: 11, fill: '#333' }}>{line}</text>
                  ))}
                </g>
              ))}
            </svg>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
