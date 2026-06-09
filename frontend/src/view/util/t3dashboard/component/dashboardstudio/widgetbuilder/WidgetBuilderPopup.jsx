import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

import { useWidgetBuilderStore } from './store/widgetBuilderStore';
import useDashboardSourceCatalog, { findCatalogEntry } from './hooks/useDashboardSourceCatalog';
import {
  deleteWidgetFromLibrary,
  getWidgetLibrary,
  saveWidgetToLibrary,
  updateWidgetInLibrary,
} from '../../../restapi/widgetBuilder';
import {
  defaultVisualConfig,
  getVisualTargets,
  getVisualTargetTitle,
  MODULE_LIST,
} from './tabs/direct/steps/wizardConstants';
import DirectCreateTab, { createEmptyWidget } from './tabs/direct/DirectCreateTab';
import MetaManagementPanel from './tabs/meta/MetaManagementPanel';
import { useCurrentUser } from '../../../auth/currentUser';
import { normalizeParameterMappings } from '../generic/widgetSpecAdapter';
import dashboardConfig from '../core/dashboardConfig';
import DomainBrowseTab from './tabs/browse/domainbrowse/DomainBrowseTab';
import AiRecommendTab from './tabs/ai/AiRecommendTab';
import WidgetLibraryTab from './tabs/library/WidgetLibraryTab';

const aiEnabled = dashboardConfig.use_ai !== false;
const BUILDER_DIALOG_SX = {
  width: 'min(1640px, calc(100vw - 40px))',
  height: '92vh',
  display: 'flex',
  flexDirection: 'column',
};

function normalizeSourceType(suggestResult, catalogEntry) {
  const raw = catalogEntry?.sourceType || suggestResult?.dataSource?.sourceType || suggestResult?.dataSource?.type || '';
  const sourceName = catalogEntry?.sourceName || suggestResult?.dataSource?.name || '';
  if (raw === 'STORED_PROCEDURE' || raw === 'PROCEDURE' || raw === 'SP') return 'STORED_PROCEDURE';
  if (raw === 'VIEW') return 'VIEW';
  if (sourceName.toUpperCase().startsWith('VIEW_')) return 'VIEW';
  return 'STORED_PROCEDURE';
}

function buildPreseededWidget(suggestResult, prompt, catalog, aiVisualConfig = null) {
  const widgetType = suggestResult?.widgetType || 'kpi';
  const rawSources = suggestResult?.dataSources?.length
    ? suggestResult.dataSources
    : suggestResult?.dataSource
      ? [suggestResult.dataSource]
      : [];

  const dataSources = rawSources.map((ds, i) => {
    const catalogEntry = findCatalogEntry(catalog, ds);
    const dsId = catalogEntry?.id || ds.id || `ds_${i + 1}`;
    return {
      ...(catalogEntry ?? {}),
      id: dsId,
      sourceType: catalogEntry?.sourceType || ds.type || 'STORED_PROCEDURE',
      sourceName: catalogEntry?.sourceName || ds.name || '',
      module: catalogEntry?.module || ds.module || MODULE_LIST[0],
      returnType: catalogEntry?.returnType || 'MIXED',
      description: catalogEntry?.description || '',
      params: catalogEntry?.params || [],
      mockData: catalogEntry?.mockData || [],
      needsParamFetch: true,
    };
  });

  const visualConfigs = Object.fromEntries(dataSources.map((ds) => [ds.id, defaultVisualConfig(widgetType)]));
  if (aiVisualConfig && Object.keys(aiVisualConfig).length > 0) {
    const primaryDsId = dataSources[0]?.id;
    if (primaryDsId) {
      visualConfigs[primaryDsId] = { type: widgetType, ...aiVisualConfig };
    }
  }

  const primaryDs = dataSources[0];
  return {
    key: `ai_${Date.now()}`,
    title: suggestResult?.widgetTitle || prompt,
    description: suggestResult?.aiDraftReview?.purpose || '',
    module: primaryDs?.module,
    widgetOptions: {
      dataSourceMode: 'MULTIPLE',
      dataSources,
      parameterMappings: [],
      columnMappings: {},
      mergeConfig: { enabled: false, type: dashboardConfig.defaultMergeType, conditions: [] },
      visualConfigs,
      dataConfig: { procedureName: primaryDs?.sourceName ?? '', viewName: '', params: {}, timeout: 0 },
      visualConfig: defaultVisualConfig(widgetType),
    },
  };
}

export default function WidgetBuilderPopup({ open, onClose, embedded = false, isAdmin: isAdminProp, onSelect }) {
  const { userId } = useCurrentUser();
  const { catalog } = useDashboardSourceCatalog();
  const {
    library,
    setLibrary,
    libraryLoading,
    setLibraryLoading,
    reset,
  } = useWidgetBuilderStore();

  const [activeTab, setActiveTab] = useState(aiEnabled ? 'build' : 'direct');
  const [selectedCreationMode, setSelectedCreationMode] = useState(null);
  const [directWidget, setDirectWidget] = useState(createEmptyWidget);
  const [saveMsg, setSaveMsg] = useState('');

  const isAdminUser = isAdminProp !== undefined ? isAdminProp : true;

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
  }, [setLibrary, setLibraryLoading, userId]);

  useEffect(() => {
    if (open) loadLibrary();
  }, [loadLibrary, open]);

  useEffect(() => {
    if (!aiEnabled && activeTab === 'build') {
      setActiveTab('direct');
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isAdminUser && activeTab === 'metadata') {
      setActiveTab(aiEnabled ? 'build' : 'direct');
    }
  }, [activeTab, isAdminUser]);

  useEffect(() => {
    if (!open) {
      reset();
      setDirectWidget(createEmptyWidget());
    }
  }, [open, reset]);

  useEffect(() => () => reset(), [reset]);

  const handleOpenAiConfig = (aiDraft = null) => {
    if (!aiEnabled) return;
    const draftResult = aiDraft?.suggestResult;
    if (!draftResult) return;

    setDirectWidget(buildPreseededWidget(draftResult, aiDraft?.prompt || '', catalog, draftResult?.visualConfig));
    setSelectedCreationMode('source');
    setActiveTab('direct');
  };

  const handleWizardFinish = async (finalWidget) => {
    const wo = finalWidget.widgetOptions;
    const description = finalWidget.description ?? '';
    const dataSources = wo?.dataSources ?? [];
    const parameterMappings = normalizeParameterMappings(wo?.parameterMappings ?? [], dataSources);
    const visualTargets = getVisualTargets({
      dataSources,
      mergeConfig: wo?.mergeConfig,
      visualConfigs: wo?.visualConfigs,
    });

    function buildDataConfig(ds) {
      if (ds.sourceType === 'TABLE') {
        return {
          sourceType: 'TABLE',
          sourceName: ds.sourceName,
          schema: ds.schema ?? 'dbo',
          tableConfig: ds.tableConfig ?? {},
          params: [],
          fallbackData: [],
          timeout: 0,
        };
      }
      return {
        sourceType: ds.sourceType,
        procedureName: ds.sourceName ?? '',
        viewName: '',
        params: ds.sourceType === 'VIEW' ? {} : paramsObjectFromMappings(parameterMappings, ds.id),
        fallbackData: ds.mockData ?? [],
        timeout: 0,
      };
    }

    try {
      for (const target of visualTargets) {
        const vc = wo.visualConfigs?.[target.id] ?? wo.visualConfig ?? defaultVisualConfig('kpi');
        const title = getVisualTargetTitle(target, wo.visualConfigs) || finalWidget.title || 'Widget';

        if (target.kind === 'merged') {
          const mergedSources = target.dataSources ?? [];
          const mergedModule = mergedSources[0]?.module && mergedSources[0].module !== 'CUSTOM'
            ? mergedSources[0].module
            : finalWidget.module;
          const targetGroup = (wo.mergeConfig?.mergeGroups ?? []).find((group) => group.id === target.id);
          const mergeConfig = {
            ...wo.mergeConfig,
            ...(targetGroup ?? {}),
            enabled: true,
            sourceIds: target.sourceIds,
            visualConfig: vc,
          };
          await saveWidgetToLibrary({
            title,
            description,
            module: mergedModule,
            widget_type: vc?.type,
            spec_json: {
              widgetTitle: title,
              widgetType: vc?.type,
              dataSources,
              parameterMappings,
              mergeConfig,
              visualConfig: vc,
              visualConfigs: wo.visualConfigs,
            },
            created_by: userId,
          });
          continue;
        }

        const ds = target.dataSource;
        const dsModule = ds?.module && ds.module !== 'CUSTOM' ? ds.module : finalWidget.module;
        await saveWidgetToLibrary({
          title,
          description,
          module: dsModule,
          widget_type: vc?.type,
          spec_json: {
            widgetTitle: title,
            widgetType: vc?.type,
            dataConfig: ds ? buildDataConfig(ds) : {},
            dataSource: {
              id: ds?.id,
              type: ds?.sourceType,
              name: ds?.sourceName,
              module: dsModule,
              mockData: ds?.mockData ?? [],
            },
            paramBindings: parameterMappings,
            visualConfig: vc,
          },
          created_by: userId,
        });
      }

      setSaveMsg(`라이브러리에 ${visualTargets.length}개 저장되었습니다.`);
      await loadLibrary();
      setDirectWidget(createEmptyWidget());
      setActiveTab('library');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (e) {
      setSaveMsg('저장 실패: ' + (e?.message || ''));
    }
  };

  const handleDeleteFromLibrary = async (widgetId) => {
    try {
      await deleteWidgetFromLibrary(widgetId);
      await loadLibrary();
    } catch (e) {
      console.error(e);
    }
  };

  const handleInfoSaveEdit = async (widget, payload) => {
    if (!widget) return;
    await updateWidgetInLibrary(widget.id, { ...payload, created_by: userId });
    await loadLibrary();
    setSaveMsg('위젯이 업데이트되었습니다.');
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    handleClose();
  };

  const isFullHeight = (activeTab === 'direct' && selectedCreationMode !== null) || activeTab === 'metadata' || activeTab === 'domain';
  const Shell = embedded ? Box : Dialog;
  const ContentFrame = embedded ? Box : DialogContent;
  const shellProps = embedded
    ? {
        sx: {
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        },
      }
    : {
        open,
        onClose: handleDialogClose,
        maxWidth: 'xl',
        fullWidth: true,
        PaperProps: {
          sx: BUILDER_DIALOG_SX,
        },
      };
  const tabs = [
    aiEnabled ? { key: 'build', label: 'AI 생성' } : null,
    { key: 'direct', label: '직접 생성' },
    isAdminUser ? { key: 'metadata', label: 'Meta 정보 관리' } : null,
    // { key: 'domain', label: '비즈니스 탐색' },
    { key: 'library', label: `라이브러리 (${library.length})` },
  ].filter(Boolean);

  return (
    <>
      <Shell {...shellProps}>
        {!embedded && (
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoFixHighIcon color="primary" />
              <Typography variant="h6">Widget Builder</Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
          </DialogTitle>
        )}

        <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}>
          {tabs.map(tab => (
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
              {tab.label}
            </Button>
          ))}
        </Box>

        <ContentFrame sx={{ flex: 1, minHeight: 0, overflow: isFullHeight ? 'hidden' : 'auto', p: isFullHeight ? 0 : 2.25, bgcolor: isFullHeight ? '#fff' : '#fafafa' }}>
          {aiEnabled && (
            <Box sx={{ display: activeTab === 'build' ? 'block' : 'none' }}>
              <AiRecommendTab
                userId={userId}
                onConfirmDraft={handleOpenAiConfig}
                onEditDraft={handleOpenAiConfig}
              />
            </Box>
          )}

          <Box sx={{ display: activeTab === 'direct' ? 'block' : 'none', height: '100%', minHeight: 0 }}>
            <DirectCreateTab
              open={open}
              mode={selectedCreationMode}
              widget={directWidget}
              onModeChange={setSelectedCreationMode}
              onWidgetChange={setDirectWidget}
              onFinish={handleWizardFinish}
            />
          </Box>

          {isAdminUser && (
            <Box sx={{ display: activeTab === 'metadata' ? 'block' : 'none', height: '100%', minHeight: 0 }}>
              <MetaManagementPanel enabled={open || embedded} />
            </Box>
          )}

          <Box sx={{ display: activeTab === 'domain' ? 'block' : 'none', height: '100%', minHeight: 0 }}>
            <DomainBrowseTab
              library={library}
              libraryLoading={libraryLoading}
              isAdmin={isAdminUser}
              userId={userId}
              onLibrarySaved={loadLibrary}
              onSelect={onSelect}
            />
          </Box>

          <Box sx={{ display: activeTab === 'library' ? 'block' : 'none', height: activeTab === 'library' ? '100%' : undefined }}>
            <WidgetLibraryTab
              library={library}
              libraryLoading={libraryLoading}
              saveMsg={saveMsg}
              canDelete
              onDelete={handleDeleteFromLibrary}
              onSaveEdit={handleInfoSaveEdit}
              onSelect={onSelect}
              showSearch={false}
              emptyActionLabel="위젯 생성하기"
              onEmptyAction={() => setActiveTab(aiEnabled ? 'build' : 'direct')}
              thumbnailHeight={92}
              thumbnailScale={2}
              showTypeLabel
              cardSx={{ boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}
            />
          </Box>
        </ContentFrame>
      </Shell>
    </>
  );
}
