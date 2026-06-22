import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith('en') ? 'en' : 'ko';
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={current}
      onChange={(_, v) => v && i18n.changeLanguage(v)}
      sx={{ ml: 1, '& .MuiToggleButton-root': { px: 1.5, py: 0.25, fontSize: 12, fontWeight: 700 } }}
    >
      <ToggleButton value="ko">KO</ToggleButton>
      <ToggleButton value="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
