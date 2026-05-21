// =============================================================================
// SourceBundleSection — NEW_FROM_COPY / EXISTING_MODIFY 모드의 소스 분석 패널.
//   · SourceBundleAnalysisPanel  : 발견된 SP/URL/Entity/GridId 칩 미리보기
//   · SourceBundlePreview        : 섹션별 파일 목록 + Repository 의 추론 SQL 펼침
//
// 두 모드 모두 collectSourceForLlm(menuCd, targetCd) 결과를 동일 형태로 처리.
// =============================================================================
import React from 'react';

import { Box, Paper, Stack, Chip, Typography, Divider } from '@mui/material';
import SourceIcon from '@mui/icons-material/Source';

import InferredSqlPanel from './InferredSqlPanel';
import { analyzeSourceBundle } from './wizardState';

/**
 * sourceBundle 분석 미리보기 — 발견된 SP / URL / Entity / BaseGrid id 빠른 진단.
 */
export function SourceBundleAnalysisPanel({ bundle }) {
  const analysis = React.useMemo(() => analyzeSourceBundle(bundle), [bundle]);
  const { sps, spsCrud, urls, entities, gridIds, serviceIds, serviceIdToSp, sections, hasAny } = analysis;

  return (
    <Paper variant="outlined" sx={{
      p: 1.5, mb: 1, borderRadius: 2,
      borderColor: hasAny ? '#10b981' : '#f59e0b',
      bgcolor:     hasAny ? '#f0fdf4' : '#fffbeb',
    }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <SourceIcon fontSize="small" sx={{ color: hasAny ? '#16a34a' : '#d97706' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: hasAny ? '#15803d' : '#92400e' }}>
          {hasAny
            ? '✓ sourceBundle 분석 완료 — wizard 에 자동 prefill 됩니다'
            : '⚠ sourceBundle 에서 SP/URL 을 못 찾았습니다 — 아래 섹션 정보 확인'}
        </Typography>
      </Stack>

      {sps.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#15803d', fontWeight: 600 }}>
            🔧 발견된 SP ({sps.length}) — CRUD 자동 분류:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {spsCrud.read   && <Chip size="small" label={`R: ${spsCrud.read}`}   sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#dbeafe', color: '#1e40af' }} />}
            {spsCrud.create && <Chip size="small" label={`C: ${spsCrud.create}`} sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#dcfce7', color: '#166534' }} />}
            {spsCrud.update && <Chip size="small" label={`U: ${spsCrud.update}`} sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#fef3c7', color: '#92400e' }} />}
            {spsCrud.delete && <Chip size="small" label={`D: ${spsCrud.delete}`} sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#fee2e2', color: '#991b1b' }} />}
          </Stack>
          {sps.length > Object.values(spsCrud).filter(Boolean).length && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#64748b' }}>
              전체 SP: {sps.join(', ')}
            </Typography>
          )}
        </Box>
      )}

      {Array.isArray(serviceIds) && serviceIds.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#15803d', fontWeight: 600 }}>
            ⚙️ 발견된 callService SERVICE ID ({serviceIds.length}):
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {serviceIds.map((sid) => {
              const sp = serviceIdToSp && serviceIdToSp[sid];
              return (
                <Chip
                  key={sid} size="small"
                  label={sp ? `${sid} → ${sp}` : `${sid} (SP 매핑 ↻ service.xml 필요)`}
                  sx={{ fontFamily: 'monospace', fontSize: 11,
                        bgcolor: sp ? '#dbeafe' : '#fef3c7',
                        color:   sp ? '#1e40af' : '#92400e' }}
                />
              );
            })}
          </Stack>
        </Box>
      )}

      {urls.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#15803d', fontWeight: 600 }}>
            🌐 발견된 zAxios URL ({urls.length}):
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.3 }}>
            {urls.map((u) => (
              <Chip key={u} size="small" label={u}
                    sx={{ fontFamily: 'monospace', fontSize: 11, bgcolor: '#e0e7ff', color: '#3730a3' }} />
            ))}
          </Stack>
        </Box>
      )}

      {entities.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            📦 Entity: <b>{entities.join(', ')}</b>
            {gridIds.length > 0 && <> · 🔲 BaseGrid id: <b>{gridIds.join(', ')}</b></>}
          </Typography>
        </Box>
      )}

      {!hasAny && (
        <Box sx={{ mt: 1, p: 1, bgcolor: '#fef9c3', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', color: '#92400e', fontWeight: 600, mb: 0.5 }}>
            sourceBundle 섹션 별 데이터:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', fontSize: 10.5, color: '#713f12' }}>
            screen.source     : {sections.screenLen.toLocaleString()} chars{sections.screenLen === 0 && '  ⚠ 비어있음'}<br/>
            frontendSources   : {sections.frontendSources} files<br/>
            backend.controllers : {sections.controllers} · services: {sections.services} · repositories: {sections.repositories}<br/>
            backend.entities    : {sections.entities} · procedures: {sections.procedures}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

/**
 * 섹션별 파일 목록 + Repository 의 추론 SQL 펼침.
 * legacy 응답 (bundle.<key>) + t3-composer 응답 (bundle.backend.<key>) 둘 다 지원.
 */
export function SourceBundlePreview({ bundle }) {
  if (!bundle || typeof bundle !== 'object') return null;
  const backend = bundle.backend || {};
  const pickSection = (key) => bundle[key] || backend[key];

  const sections = [
    { key: 'screen',       title: 'SCREEN',       color: '#2563eb' },
    { key: 'components',   title: 'COMPONENTS',   color: '#0891b2' },
    { key: 'controllers',  title: 'CONTROLLERS',  color: '#7c3aed' },
    { key: 'services',     title: 'SERVICES',     color: '#c026d3' },
    { key: 'repositories', title: 'REPOSITORIES', color: '#db2777' },
    { key: 'entities',     title: 'ENTITIES',     color: '#ea580c' },
    { key: 'procedures',   title: 'PROCEDURES',   color: '#ca8a04' },
  ];

  return (
    <Stack spacing={1}>
      {sections.map(({ key, title, color }) => {
        const data = pickSection(key);
        if (!data) return null;
        const count = Array.isArray(data) ? data.length : 1;
        return (
          <Paper key={key} elevation={0}
                 sx={{ p: 1.2, border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`,
                       borderRadius: 1, bgcolor: '#fff' }}>
            <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.3 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color, fontFamily: 'monospace' }}>
                {title}
              </Typography>
              <Chip label={count} size="small"
                    sx={{ height: 16, fontSize: 10, bgcolor: `${color}22`, color, fontWeight: 700 }} />
            </Stack>
            {Array.isArray(data) ? (
              <Stack spacing={0.4}>
                {data.slice(0, 8).map((item, i) => {
                  const raw = item.path || item.name || item.fileName || '';
                  const { targetCd, rel } = parseContainerPath(raw);
                  return (
                  <Box key={i}>
                    <Stack direction="row" spacing={0.6} alignItems="center" useFlexGap flexWrap="wrap">
                      {targetCd && (
                        <Chip
                          label={targetCd}
                          size="small"
                          sx={{
                            height: 16, fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700,
                            bgcolor: targetChipBg(targetCd), color: targetChipFg(targetCd),
                            border: `1px solid ${targetChipFg(targetCd)}55`,
                            '& .MuiChip-label': { px: 0.6 },
                          }}
                        />
                      )}
                      <Typography variant="caption"
                                  sx={{ fontFamily: 'monospace', fontSize: 10, color: '#475569',
                                        wordBreak: 'break-all' }}>
                        {rel || raw || JSON.stringify(item).slice(0, 90)}
                      </Typography>
                    </Stack>
                    {key === 'repositories' && Array.isArray(item.queryMethods) && item.queryMethods.length > 0 && (
                      <InferredSqlPanel
                        queryMethods={item.queryMethods}
                        title={`${item.className || item.name} — JPA 추론 SQL`}
                        compact
                      />
                    )}
                  </Box>
                  );
                })}
                {data.length > 8 && (
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    ... 외 {data.length - 8}건
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
                {typeof data === 'string' ? data.slice(0, 180) : JSON.stringify(data).slice(0, 180)}
              </Typography>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}

// ── path → Target chip + relative path 분리 ───────────────────────────
// path 예: `/workspace/targets/PLANNEL/backend/src/main/java/t3series/saas/controller/X.java`
//   → { targetCd: 'PLANNEL', rel: 'backend/src/main/java/t3series/saas/controller/X.java' }
// path 가 `/workspace/wingui/...` (글로벌 fallback) 면 targetCd 없이 그대로.
const TARGET_PATH_RE = /^\/workspace\/targets\/([A-Z][A-Z0-9_]*)\/(.*)$/;
function parseContainerPath(raw) {
  if (!raw || typeof raw !== 'string') return { targetCd: null, rel: raw || '' };
  const m = raw.match(TARGET_PATH_RE);
  if (!m) return { targetCd: null, rel: raw };
  return { targetCd: m[1], rel: m[2] };
}

// Target chip 색 (다른 Target 도 한 눈에 구분)
const TARGET_CHIP_COLORS = {
  T3SERIES:     { bg: '#dbeafe', fg: '#1d4ed8' },   // blue
  PLANNEL:      { bg: '#dcfce7', fg: '#15803d' },   // green
  LGES_NEXTSCM: { bg: '#fef3c7', fg: '#a16207' },   // amber
};
function targetChipBg(cd) { return (TARGET_CHIP_COLORS[cd] || {}).bg || '#f1f5f9'; }
function targetChipFg(cd) { return (TARGET_CHIP_COLORS[cd] || {}).fg || '#475569'; }

/** 두 패널을 묶어 한 번에 사용 — divider 포함 */
export function SourceBundleSection({ bundle }) {
  if (!bundle) return null;
  return (
    <>
      <SourceBundleAnalysisPanel bundle={bundle} />
      <Divider sx={{ my: 1 }} />
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        수집된 원본 소스 번들 — Wizard 9단계에 자동 prefill 됩니다
      </Typography>
      <Divider sx={{ my: 1 }} />
      <SourceBundlePreview bundle={bundle} />
    </>
  );
}

export default SourceBundleSection;
