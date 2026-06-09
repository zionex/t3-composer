import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Button, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { getWidgetLibrary } from '../../../restapi/widgetBuilder';
import { useUserStore } from '@wingui/common/imports';
import AiRecommendTab from './tabs/AiRecommendTab';
import DomainBrowseTab from './tabs/DomainBrowseTab';
import WidgetSelectTab from './tabs/WidgetSelectTab';

const TABS = [
  { key: 'ai', label: 'AI 추천' },
  { key: 'domain', label: '비즈니스 탐색' },
  { key: 'select', label: '위젯 선택' },
];

export default function UserWidgetCreatorPopup({ open, onClose, onSelect }) {
  const userId = useUserStore(s => s.userInfo?.userId);

  const [activeTab, setActiveTab] = useState('ai');
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const data = await getWidgetLibrary();
      setLibrary(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setActiveTab('ai');
      loadLibrary();
    }
  }, [open, loadLibrary]);

  const handleSaved = () => {
    loadLibrary();
    setActiveTab('select');
  };

  const handleSelect = (widget) => {
    if (onSelect) onSelect(widget);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          width: 'min(1100px, calc(100vw - 64px))',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0.75 }}>
        <PersonIcon color="primary" />
        <Typography variant="h6">위젯 만들기</Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}>
        {TABS.map(tab => (
          <Button
            key={tab.key}
            size="small"
            sx={{
              borderRadius: 0,
              borderBottom: activeTab === tab.key ? 2 : 0,
              borderColor: 'primary.main',
              color: activeTab === tab.key ? 'primary.main' : 'text.secondary',
              mr: 1,
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.key === 'select' ? `위젯 선택 (${library.length})` : tab.label}
          </Button>
        ))}
      </Box>

      <DialogContent sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.5, bgcolor: '#fafafa' }}>
        {activeTab === 'ai' && <AiRecommendTab userId={userId} />}
        {activeTab === 'domain' && <DomainBrowseTab onSaved={handleSaved} userId={userId} />}
        {activeTab === 'select' && (
          <WidgetSelectTab
            library={library}
            libraryLoading={libraryLoading}
            isAdmin={false}
            onSelect={handleSelect}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
