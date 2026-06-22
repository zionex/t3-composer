import React from 'react';
import { MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'ko', label: 'KO' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'ko';
  return (
    <Select
      size="small"
      value={current}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      sx={{
        ml: 1,
        minWidth: 72,
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
        <MenuItem key={lng.code} value={lng.code} sx={{ fontWeight: 600 }}>
          {lng.label}
        </MenuItem>
      ))}
    </Select>
  );
}
