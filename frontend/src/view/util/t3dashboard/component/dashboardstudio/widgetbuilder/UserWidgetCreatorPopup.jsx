import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Alert, Box, Button, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { getWidgetLibrary } from '../../../restapi/widgetBuilder';
import { useUserStore } from '@wingui/common/imports';
import AiRecommendTab from './tabs/ai/AiRecommendTab';
import DomainBrowseTab from './tabs/browse/domainbrowse/DomainBrowseTab';
import WidgetLibraryTab from './tabs/library/WidgetLibraryTab';

const TABS = [
  { key: 'ai', label: 'AI 추천' },
  { key: 'domain', label: '비즈니스 탐색' },
  { key: 'select', label: '위젯 선택' },
];

const BUILDER_DIALOG_SX = {
  width: 'min(1640px, calc(100vw - 40px))',
  height: '92vh',
  display: 'flex',
  flexDirection: 'column',
};

export default function UserWidgetCreatorPopup({ open, onClose, onSelect }) {
  const userId = useUserStore(s => s.userInfo?.userId);
  const isAdminUser = true;

  const [activeTab, setActiveTab] = useState('ai');
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [aiDraftMsg, setAiDraftMsg] = useState('');

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
      setAiDraftMsg('');
      loadLibrary();
    }
  }, [open, loadLibrary]);

  const handleSelect = (widget) => {
    if (onSelect) onSelect(widget);
    onClose();
  };

  const handleAiDraftToDomain = useCallback((_, mode = 'confirm') => {
    setAiDraftMsg(
      mode === 'edit'
        ? 'AI 초안을 기준으로 수정할 항목을 선택하세요.'
        : 'AI 초안을 기준으로 데이터 후보를 확인하세요.',
    );
    setActiveTab('domain');
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: BUILDER_DIALOG_SX,
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
            onClick={() => {
              setActiveTab(tab.key);
              setAiDraftMsg('');
            }}
          >
            {tab.key === 'select' ? `위젯 선택 (${library.length})` : tab.label}
          </Button>
        ))}
      </Box>

      <DialogContent sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2.25, bgcolor: '#fafafa', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'ai' && (
          <AiRecommendTab
            userId={userId}
            onConfirmDraft={(draft) => handleAiDraftToDomain(draft, 'confirm')}
            onEditDraft={(draft) => handleAiDraftToDomain(draft, 'edit')}
          />
        )}
        {activeTab === 'domain' && (
          <>
            {aiDraftMsg && <Alert severity="info" sx={{ mb: 1.5 }}>{aiDraftMsg}</Alert>}
            <DomainBrowseTab
              library={library}
              libraryLoading={libraryLoading}
              isAdmin={isAdminUser}
              userId={userId}
              onLibrarySaved={loadLibrary}
              onSelect={handleSelect}
            />
          </>
        )}
        {activeTab === 'select' && (
          <WidgetLibraryTab
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
