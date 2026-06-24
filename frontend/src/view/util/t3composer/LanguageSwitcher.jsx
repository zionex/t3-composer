import React from 'react';
import { MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';

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

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = normalizeLng(i18n.language);
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
          borderColor: 'rgba(124,167,224,0.4)',
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
