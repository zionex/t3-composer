import React from 'react';

import { Box, Card, CardActionArea, Typography, Stack, Chip } from '@mui/material';
import * as MuiIcons from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { MODULES, localizedModuleName, localizedModuleDesc } from './constants';
import useUiLanguage from './useUiLanguage';

/**
 * 모듈 대그룹 선택.
 * NEW_GENERAL 의 자연어/단계별 경로 공통 첫 스텝.
 */
function ModuleSelector({ value, onChange, compact = false }) {
  const { t } = useTranslation('composer');
  const lng = useUiLanguage();   // 'ko' | 'en' | 'ja' | 'zh-CN' | 'zh-TW'
  return (
    <Box>
      {!compact && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('moduleSelector.intro')}
        </Typography>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 1.5,
        }}
      >
        {MODULES.map((m) => {
          const Icon = MuiIcons[m.icon] || MuiIcons.Folder;
          const selected = value === m.code;
          return (
            <Card
              key={m.code}
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: selected ? m.color : 'rgba(0,0,0,0.08)',
                borderWidth: selected ? 2 : 1,
                bgcolor: selected ? `${m.color}08` : 'white',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: m.color,
                  boxShadow: `0 4px 12px -6px ${m.color}66`,
                },
              }}
            >
              <CardActionArea onClick={() => onChange(m.code)} sx={{ height: '100%', p: compact ? 1 : 1.5 }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: compact ? 0.5 : 1 }}>
                  <Box
                    sx={{
                      width: compact ? 28 : 36,
                      height: compact ? 28 : 36,
                      borderRadius: 1.2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${m.color}22`,
                      color: m.color,
                    }}
                  >
                    <Icon fontSize={compact ? 'small' : 'medium'} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                      {m.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {localizedModuleName(m, lng)}
                    </Typography>
                  </Box>
                </Stack>
                {!compact && (
                  <>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        mb: 0.8,
                      }}
                    >
                      {localizedModuleDesc(m, lng)}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={`${m.tableCount} tables`}
                        size="small"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                      <Chip
                        label={`${m.spCount} SPs`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    </Stack>
                  </>
                )}
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

export default ModuleSelector;
