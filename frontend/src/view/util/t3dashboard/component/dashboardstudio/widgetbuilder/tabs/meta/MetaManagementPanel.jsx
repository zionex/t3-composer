import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DownloadIcon from '@mui/icons-material/Download';

import {
  exportBusinesstree,
  getBizCategories,
  getBizTables,
} from '../../../../../restapi/widgetBuilder';
import { loadMetadata } from './metaUtils';
import IntegratedMetaTab from './IntegratedMetaTab';
import RawMetaTab from './RawMetaTab';
import BizTableTab from './BizTableTab';
import BizColumnTab from './BizColumnTab';
import BizKeywordTab from './BizKeywordTab';
import BizJoinTab from './BizJoinTab';
import BizCategoryTab from './BizCategoryTab';

function SummaryStat({ label, value }) {
  return (
    <Box sx={{ px: 1.25, py: 0.75, border: '1px solid #e5eaf2', borderRadius: '8px', bgcolor: '#fff', minWidth: 96 }}>
      <Typography sx={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 18, color: '#0f172a', fontWeight: 900, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  );
}

export default function MetaManagementPanel({ enabled = true }) {
  const [activeTab, setActiveTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [organizing, setOrganizing] = useState(false);
  const [organizeProgress, setOrganizeProgress] = useState(0);
  const [organizeSnack, setOrganizeSnack] = useState({ open: false, severity: 'success', message: '' });
  const [rawTableCount, setRawTableCount] = useState(0);
  const [bizTables, setBizTables] = useState([]);
  const [bizCategories, setBizCategories] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    loadMetadata(false).then((d) => setRawTableCount(d?.tables?.length ?? 0)).catch(() => {});
    getBizTables().then((d) => setBizTables(Array.isArray(d) ? d : [])).catch(() => {});
    getBizCategories().then((d) => setBizCategories(Array.isArray(d) ? d : [])).catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!organizing) { setOrganizeProgress(0); return; }
    const interval = setInterval(() => {
      setOrganizeProgress((prev) => prev >= 90 ? prev : Math.min(90, prev + (90 - prev) * 0.08 + 0.5));
    }, 150);
    return () => clearInterval(interval);
  }, [organizing]);

  const handleOrganize = useCallback(async () => {
    setOrganizeProgress(0);
    setOrganizing(true);
    try {
      const result = await exportBusinesstree();
      setOrganizeSnack({ open: true, severity: 'success', message: `업데이트 완료 (modules=${result?.modules ?? 0}, keywords=${result?.keywords ?? 0}, rows=${result?.rows ?? 0})` });
      getBizTables().then((d) => setBizTables(Array.isArray(d) ? d : [])).catch(() => {});
      getBizCategories().then((d) => setBizCategories(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (err) {
      setOrganizeSnack({ open: true, severity: 'error', message: '저장 실패: ' + (err?.message || String(err)) });
    } finally {
      setOrganizeProgress(100);
      setTimeout(() => setOrganizing(false), 600);
    }
  }, []);

  const TAB_LABELS = ['통합 보기', 'Raw Meta', 'biz_table', 'biz_column', 'biz_keyword', 'biz_join', 'biz_category'];

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      {activeTab === 1 && (
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <SummaryStat label="Raw Tables" value={rawTableCount} />
          <SummaryStat label="biz_table" value={bizTables.length} />
          <Tooltip title="서버 business_tree.duckdb 재생성">
            <span>
              <Button size="small" variant="outlined" onClick={handleOrganize} disabled={organizing} startIcon={<DownloadIcon />}>
                데이터 정리
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
      )}

      {organizing && (
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textAlign: 'right' }}>
          데이터 정리 중... {Math.round(organizeProgress)}%
        </Typography>
      )}

      <Box sx={{ flex: '1 1 0%', minHeight: 0, display: 'flex', borderTop: '1px solid #e5eaf2', overflow: 'hidden' }}>
        <Box
          sx={{
            width: sidebarOpen ? 152 : 44,
            flexShrink: 0,
            borderRight: '1px solid #e5eaf2',
            bgcolor: '#fff',
            transition: 'width 0.18s ease',
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent={sidebarOpen ? 'space-between' : 'center'} sx={{ height: 40, px: sidebarOpen ? 1.25 : 0.5, borderBottom: '1px solid #eef2f7' }}>
            {sidebarOpen && <Typography sx={{ fontSize: 13, fontWeight: 900, color: '#64748b' }}>메타</Typography>}
            <IconButton size="small" onClick={() => setSidebarOpen((open) => !open)}>
              {sidebarOpen ? <ChevronLeftIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Stack>
          <Stack spacing={0.25} sx={{ py: 0.75 }}>
            {TAB_LABELS.map((label, index) => (
              <Tooltip key={label} title={sidebarOpen ? '' : label} placement="right" arrow>
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setActiveTab(index);
                    }
                  }}
                  sx={{
                    mx: sidebarOpen ? 0.75 : 0.4,
                    px: sidebarOpen ? 1.25 : 0,
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: activeTab === index ? 900 : 700,
                    color: activeTab === index ? '#0b84ff' : '#334155',
                    bgcolor: activeTab === index ? '#eff6ff' : 'transparent',
                    borderRight: activeTab === index && sidebarOpen ? '3px solid #0b84ff' : '3px solid transparent',
                    '&:hover': { bgcolor: '#f8fafc' },
                    '&:focus-visible': { outline: '2px solid #60a5fa', outlineOffset: 1 },
                  }}
                >
                  {sidebarOpen ? label : label.slice(0, 1)}
                </Box>
              </Tooltip>
            ))}
          </Stack>
        </Box>

        {/* Tab panels */}
        <Box sx={{ flex: '1 1 0%', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', p: 1, overflow: 'hidden' }}>
          {activeTab === 0 && <IntegratedMetaTab bizTables={bizTables} bizCategories={bizCategories} />}
          {activeTab === 1 && <RawMetaTab enabled={enabled} />}
          {activeTab === 2 && <BizTableTab />}
          {activeTab === 3 && <BizColumnTab bizTables={bizTables} />}
          {activeTab === 4 && <BizKeywordTab bizTables={bizTables} />}
          {activeTab === 5 && <BizJoinTab bizTables={bizTables} />}
          {activeTab === 6 && <BizCategoryTab />}
        </Box>
      </Box>

      <Snackbar
        open={organizeSnack.open} autoHideDuration={3000}
        onClose={() => setOrganizeSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={organizeSnack.severity} onClose={() => setOrganizeSnack((s) => ({ ...s, open: false }))}>
          {organizeSnack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
