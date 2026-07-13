import React from 'react';
import { MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PALETTE } from '../../../theme';
import { FONT_FAMILY } from '../../../style/typography';
import iconGlobal from '../../../assets/icons/global.svg';
import SvgIcon from '../../../style/SvgIcon';

const LANGUAGES = [
  { code: 'ko',    label: 'KO',    title: '한국어' },
  { code: 'en',    label: 'EN',    title: 'English' },
  { code: 'ja',    label: 'JA',    title: '日本語' },
  { code: 'zh-CN', label: '简',    title: '中文 (简体)' },
  { code: 'zh-TW', label: '繁',    title: '中文 (繁體)' },
];

/** i18n.language (예: 'zh-Hant-TW') 를 5개 지원 locale 중 하나로 정규화. */
function normalizeLng(raw) {
  const l = (raw || '').toLowerCase();
  if (l.startsWith('ko')) return 'ko';
  if (l.startsWith('ja')) return 'ja';
  if (l.startsWith('zh')) {
    if (l.startsWith('zh-tw') || l.startsWith('zh-hk') || l.includes('hant')) return 'zh-TW';
    return 'zh-CN';
  }
  return 'en';
}

/**
 * variant:
 *   'select' (기본) — 기존 Select 룩 (탭스트립 우측 등)
 *   'chip'         — globe 아이콘 + 짧은 라벨 (투명 배경, height 32px)
 */
export default function LanguageSwitcher({ variant = 'select' }) {
  const { i18n } = useTranslation();
  const current = normalizeLng(i18n.language);

  if (variant === 'chip') {
    return (
      <Select
        size="small"
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        IconComponent={() => null}
        MenuProps={{
          anchorOrigin:    { vertical: 'bottom', horizontal: 'right' },
          transformOrigin: { vertical: 'top',    horizontal: 'right' },
          marginThreshold: 0,
          slotProps: {
            paper: { sx: { minWidth: 64 } },
          },
          MenuListProps: {
            sx: { py: 0 },
          },
        }}
        renderValue={(val) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SvgIcon src={iconGlobal} size={18} color={PALETTE.headerIconMuted} />
            {LANGUAGES.find((l) => l.code === val)?.label || val}
          </span>
        )}
        sx={{
          width: 64, minWidth: 64,
          height: 32, borderRadius: '6px',
          bgcolor: 'transparent',
          fontSize: 14, fontWeight: 700,
          fontFamily: FONT_FAMILY,
          lineHeight: 'normal',
          color: PALETTE.headerTextActive,
          '& .MuiSelect-select.MuiSelect-select': {
            display: 'flex !important', alignItems: 'center', justifyContent: 'center',
            padding: '7px 10px !important',
            minHeight: 'unset',
            boxSizing: 'border-box',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.04)',
          },
        }}
      >
        {LANGUAGES.map((lng) => (
          <MenuItem key={lng.code} value={lng.code} sx={{ fontWeight: 600 }} title={lng.title}>
            {lng.label}
          </MenuItem>
        ))}
      </Select>
    );
  }

  // 기본 Select 룩
  return (
    <Select
      size="small"
      value={current}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      sx={{
        ml: 1,
        minWidth: 80,
        fontSize: 13,
        fontWeight: 700,
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          pl: 1.25,
          pr: '28px !important',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(10,136,168,0.35)',
        },
      }}
    >
      {LANGUAGES.map((lng) => (
        <MenuItem key={lng.code} value={lng.code} sx={{ fontWeight: 600 }} title={lng.title}>
          {lng.label}
        </MenuItem>
      ))}
    </Select>
  );
}
