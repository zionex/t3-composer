import React from 'react';
import { MenuItem, Select } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation } from 'react-i18next';
import { PALETTE } from '../../../theme';

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
 *   'chip'           — A시안 .chip 룩 (globe 아이콘 + 짧은 라벨 + 흰 배경 + 회색 보더, height 32px)
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
        IconComponent={() => null}            // 우측 chevron 숨김 (A시안 chip 은 globe + 라벨만)
        renderValue={(val) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <LanguageIcon sx={{ fontSize: 14, color: '#4B5563' }} />
            {LANGUAGES.find((l) => l.code === val)?.label || val}
          </span>
        )}
        sx={{
          height: 28, borderRadius: '9px',
          bgcolor: '#FFFFFF',
          fontSize: 11, fontWeight: 500, color: '#4B5563',
          '& .MuiSelect-select': {
            display: 'flex', alignItems: 'center',
            py: 0, px: 1.2,
            minHeight: 'unset !important',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: PALETTE.panelBorder,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: PALETTE.primaryBorder,
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
          borderColor: 'rgba(45,139,168,0.35)',
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
