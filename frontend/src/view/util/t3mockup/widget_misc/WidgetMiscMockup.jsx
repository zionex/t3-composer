import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, Chip } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import MockShell from '../_shared/MockShell';
import { WORK_ORDERS, PURCHASE_ORDERS, SALES_ORDERS } from '../_data/mockData';

export default function WidgetMiscMockup() {
  const activities = [
    { type: 'wo',  icon: <FactoryIcon />, color: 'warning', text: 'WO-2026-7775 작업 완료', time: '14:42', detail: 'LED Module 60W · 1,300 EA' },
    { type: 'po',  icon: <LocalShippingIcon />, color: 'info', text: 'PO-2026-0043 입고 완료', time: '13:55', detail: 'Capacitor 100µF · 120,000 EA' },
    { type: 'so',  icon: <WarehouseIcon />, color: 'success', text: 'SO-2026-1106 출하 완료', time: '11:18', detail: 'LED Module 100W · 1,200 EA' },
    { type: 'wo',  icon: <FactoryIcon />, color: 'warning', text: 'WO-2026-7773 단계 2 완료', time: '10:42', detail: 'Display 55" · 200 EA' },
    { type: 'po',  icon: <LocalShippingIcon />, color: 'info', text: 'PO-2026-0042 입고 시작', time: '09:14', detail: 'PCB Substrate FR4 · 50,000 EA' },
  ];

  return (
    <MockShell
      patternCode="widget_misc"
      patternLabel="위젯 — 자유 폼 (활동 피드 / Timeline)"
      layoutCategory="WIDGET"
      description="차트/그리드/피벗 외 자유 폼 위젯. 활동 피드, Timeline, 단순 정보 카드 등."
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.50', height: '100%' }}>
        <Card variant="outlined" sx={{ width: 480 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">최근 활동</Typography>
              <Chip size="small" label="실시간" color="success" />
            </Stack>
            <List dense disablePadding>
              {activities.map((a, i) => (
                <React.Fragment key={i}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: `${a.color}.light`, color: `${a.color}.dark` }}>
                        {a.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{a.text}</Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontFamily: 'monospace' }}>{a.time}</Typography>
                        </Stack>
                      }
                      secondary={<Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{a.detail}</Typography>}
                    />
                  </ListItem>
                  {i < activities.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>
    </MockShell>
  );
}
