import React from 'react';
import { Box } from '@mui/material';

/**
 * T3Mockup 공통 styleCallback 표현 헬퍼.
 *
 * 운영 화면의 RealGrid `styleCallback` 시각 효과를 mockup `<TableCell>` 에서
 * 동일한 룩으로 흉내내기 위한 일관 팔레트 + 헬퍼.
 *
 * 사용 예 (KTNG mockup):
 *   import { STATUS_PALETTE, cellSx, rowSx, StatusDot, percentStatus, deltaStatus } from '../../_shared/styleCallback';
 *
 *   <TableRow sx={rowSx(r.status)}>
 *     <TableCell sx={cellSx(r.status)}>{r.rtfPct}%</TableCell>
 *     <TableCell><StatusDot status={r.status} /> {r.label}</TableCell>
 *   </TableRow>
 *
 * 상태 키:
 *   normal    — 색 없음 (기본)
 *   info      — 정보 강조 (파랑)
 *   success   — 좋음/정상 초과 달성 (녹색)
 *   warning   — 경고/단기/임계 (노랑)
 *   danger    — 위험/결품/미달 (빨강)
 *   pending   — 대기/검토중 (회색)
 *   highlight — 포인트/AI/추천 (보라)
 */

export const STATUS_PALETTE = {
  normal:    { bg: 'transparent', cellBg: 'transparent',  text: 'text.primary',  rowBg: 'transparent',     dot: '#bdbdbd' },
  info:      { bg: '#e3f2fd',     cellBg: '#e3f2fd',      text: '#1565c0',       rowBg: 'rgba(33,150,243,0.06)',  dot: '#1976d2' },
  success:   { bg: '#c8e6c9',     cellBg: '#c8e6c9',      text: '#2e7d32',       rowBg: 'rgba(76,175,80,0.08)',   dot: '#2e7d32' },
  warning:   { bg: '#fff3e0',     cellBg: '#ffe0b2',      text: '#e65100',       rowBg: 'rgba(255,152,0,0.10)',   dot: '#f57c00' },
  danger:    { bg: '#ffcdd2',     cellBg: '#ffcdd2',      text: '#b71c1c',       rowBg: 'rgba(244,67,54,0.10)',   dot: '#c62828' },
  pending:   { bg: '#f5f5f5',     cellBg: '#eeeeee',      text: '#616161',       rowBg: 'rgba(0,0,0,0.04)',       dot: '#9e9e9e' },
  highlight: { bg: '#f3e5f5',     cellBg: '#e1bee7',      text: '#6a1b9a',       rowBg: 'rgba(156,39,176,0.06)',  dot: '#7b1fa2' },
};

/** 셀 단위 conditional 배경/폰트 — RealGrid styleCallback cell return 과 동일 톤. */
export function cellSx(status, opts = {}) {
  const p = STATUS_PALETTE[status] || STATUS_PALETTE.normal;
  const base = {
    backgroundColor: p.cellBg,
    color: status === 'normal' ? undefined : p.text,
    fontWeight: status === 'normal' ? undefined : 700,
  };
  if (opts.mono) base.fontFamily = 'monospace';
  if (opts.align) base.textAlign = opts.align;
  return base;
}

/** 행 단위 conditional 배경 — RealGrid styleCallback row return 과 동일 톤. */
export function rowSx(status) {
  const p = STATUS_PALETTE[status] || STATUS_PALETTE.normal;
  return {
    backgroundColor: p.rowBg,
    '&:hover': { backgroundColor: p.rowBg === 'transparent' ? undefined : p.rowBg },
  };
}

/** 작은 8px dot 마커. 셀의 첫머리에 inline 으로 붙여 우선순위 시각화. */
export function StatusDot({ status = 'normal', size = 8, sx }) {
  const p = STATUS_PALETTE[status] || STATUS_PALETTE.normal;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: p.dot,
        mr: 0.75,
        verticalAlign: 'middle',
        boxShadow: status === 'danger' || status === 'warning' ? `0 0 0 2px ${p.dot}22` : undefined,
        ...sx,
      }}
    />
  );
}

/**
 * 달성률(%) → status 변환.
 *   default thresholds: < 80 danger · < 95 warning · >= 100 success · 그 외 normal.
 */
export function percentStatus(value, thresholds = {}) {
  const v = Number(value);
  if (!Number.isFinite(v)) return 'normal';
  const t = { danger: 80, warning: 95, success: 100, ...thresholds };
  if (v < t.danger) return 'danger';
  if (v < t.warning) return 'warning';
  if (v >= t.success) return 'success';
  return 'normal';
}

/**
 * 증감(delta) → status 변환.
 *   양수=success, 음수(절대값 small)=warning, 음수(큰 폭)=danger, 0=normal.
 */
export function deltaStatus(value, thresholds = {}) {
  const v = Number(value);
  if (!Number.isFinite(v) || v === 0) return 'normal';
  const t = { warningDown: -5, dangerDown: -15, ...thresholds };
  if (v >= 0) return 'success';
  if (v <= t.dangerDown) return 'danger';
  if (v <= t.warningDown) return 'warning';
  return 'normal';
}

/**
 * 재고/안전재고 비율 → status.
 *   ratio = onhand / safety
 *   < 1.0 danger · < 1.3 warning · > 3.0 highlight(과잉) · 그 외 normal.
 */
export function stockStatus(onhand, safety) {
  const o = Number(onhand);
  const s = Number(safety);
  if (!Number.isFinite(o) || !Number.isFinite(s) || s <= 0) return 'normal';
  const r = o / s;
  if (r < 1.0) return 'danger';
  if (r < 1.3) return 'warning';
  if (r > 3.0) return 'highlight';
  return 'normal';
}
