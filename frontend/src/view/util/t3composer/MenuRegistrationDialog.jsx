import React, { useEffect, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Box,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupIcon from '@mui/icons-material/Group';

import { listArtifacts, getArtifact, checkMenuExists, executeMenuSql, listAllGroups, listAllMenus, getSession, loadTargetMenuTree } from './api';
import MenuPickerDialog from './MenuPickerDialog';
import PlanelGroupPicker from './PlanelGroupPicker';

// 권한 종류 — TB_AD_PERMISSION_GROUP.PERMISSION_TP 에 들어갈 값
const PERMISSION_TYPES = [
  { code: 'READ',   label: '조회' },
  { code: 'UPDATE', label: '저장' },
  { code: 'DELETE', label: '삭제' },
];

/**
 * 메뉴 등록 확인 다이얼로그.
 *
 * 흐름:
 *   1. 세션의 MENU_SQL 산출물 로드
 *   2. 부모 메뉴 코드 추출 + DB 존재 여부 검증
 *   3. 사용자에게 요약(화면ID·경로·부모) 표시 후 [등록 실행] 버튼
 *   4. 성공 시 실행 결과(executed / skipped / errors) 표시
 */
function MenuRegistrationDialog({ open, sessionId, onClose }) {
  const [menuSql, setMenuSql]       = useState(null);  // 산출물 (MENU_SQL · MENU_JS 공용)
  const [menuArtifactType, setMenuArtifactType] = useState(null); // 'MENU_SQL' | 'MENU_JS'
  const [menuJsEntries, setMenuJsEntries] = useState([]);         // MENU_JS 인 경우 entries 배열
  const [summary, setSummary]       = useState(null);  // { parent, path, fileName, screenId }
  const [parentOk, setParentOk]     = useState(null);  // null | true | false
  const [loading, setLoading]       = useState(false);
  const [executing, setExecuting]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  // 트리 픽커로 변경된 SQL 원본 추적
  const [pickerOpen, setPickerOpen] = useState(false);
  const [originalSql, setOriginalSql] = useState(null);   // 처음 로드한 SQL (revert 용)
  // PLANEL (MENU_JS) — 그룹 트리 picker
  const [sessionTargetCd, setSessionTargetCd] = useState(null);
  const [planelGroups, setPlanelGroups] = useState([]);   // PLANEL 트리의 group 목록 (groupKey 검증용)
  const [planelPickerOpen, setPlanelPickerOpen] = useState(false);
  const [planelPickerEntryIdx, setPlanelPickerEntryIdx] = useState(-1);   // 어느 entry 에 적용할지
  const [originalMenuJsContent, setOriginalMenuJsContent] = useState(null);  // revert 용
  // 권한 동시 등록
  const [groups, setGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [selectedPermTypes, setSelectedPermTypes] = useState(['READ']);   // 기본: 조회 권한
  // 실제 메뉴 트리 (초기 경로 복원용)
  const [menuTree, setMenuTree] = useState([]);
  // (분리됨 2026-04-27) 산출물 적용은 별도 ArtifactApplyDialog 로 이전

  useEffect(() => {
    if (!open || !sessionId) return;
    reset();
    loadMenus();        // 먼저 메뉴 트리를 로드 — 초기 경로 복원에 사용
    loadMenuSql();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  const loadMenus = async () => {
    try {
      const res = await listAllMenus();
      setMenuTree(Array.isArray(res.data) ? res.data : []);
    } catch (_e) {
      setMenuTree([]);
    }
  };

  // summary 에서 leaf 메뉴 명칭 추출 — 우선 menuPath 의 마지막 세그먼트,
  // 없으면 fileName 의 PascalCase 분해 · 최후로 screenId
  const deriveLeafFromSummary = (s) => {
    if (!s) return '';
    const path = s.menuPath || '';
    const seps = [' > ', '>', '/'];
    for (const sep of seps) {
      const idx = path.lastIndexOf(sep);
      if (idx >= 0 && idx + sep.length < path.length) {
        return path.substring(idx + sep.length).trim();
      }
    }
    if (s.fileName) {
      // /util/usermgmt/UserMgmt.jsx → UserMgmt
      const m = s.fileName.match(/([A-Z][A-Za-z0-9]+)\.jsx?$/);
      if (m) return m[1];
    }
    return s.screenId || '';
  };

  // flat 메뉴 목록에서 menuCd 로 ancestorPath(root → 해당 노드) 계산
  const resolveAncestorPath = (menuCd, menus) => {
    if (!menuCd) return '';
    const list = menus && menus.length ? menus : menuTree;
    if (!list || list.length === 0) return '';
    const byId = new Map(list.map((m) => [m.id, m]));
    const target = list.find((m) => m.menuCd === menuCd);
    if (!target) return '';
    const parts = [];
    let cur = target;
    const guard = new Set();
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id);
      parts.unshift(cur.menuNm || cur.menuCd);
      cur = cur.parentId ? byId.get(cur.parentId) : null;
    }
    return parts.join(' > ');
  };

  const reset = () => {
    setMenuSql(null);
    setMenuArtifactType(null);
    setMenuJsEntries([]);
    setSummary(null);
    setParentOk(null);
    setResult(null);
    setError(null);
    setPickerOpen(false);
    setOriginalSql(null);
    setSelectedGroupIds([]);
    setSelectedPermTypes(['READ']);
    setMenuTree([]);
    setSessionTargetCd(null);
    setPlanelGroups([]);
    setPlanelPickerOpen(false);
    setPlanelPickerEntryIdx(-1);
    setOriginalMenuJsContent(null);
  };
  // handleApply 는 ArtifactApplyDialog 로 이전

  const loadGroups = async () => {
    try {
      const res = await listAllGroups();
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch (_e) {
      // 그룹 조회 실패해도 메뉴 등록 자체는 가능해야 함 — silent
      setGroups([]);
    }
  };

  const loadMenuSql = async () => {
    setLoading(true);
    try {
      const listRes = await listArtifacts(sessionId);
      const items = Array.isArray(listRes.data) ? listRes.data : [];
      // PLANEL 류 (Target.menu_source='JS_FILE') 는 MENU_JS, 그 외는 MENU_SQL.
      // 한 세션에 둘 다 있는 경우는 정상적으로 발생하지 않지만 안전하게 MENU_JS 우선 시도.
      const menuJsItem = items.find((a) => a.artifactType === 'MENU_JS');
      const menuSqlItem = items.find((a) => a.artifactType === 'MENU_SQL');
      const menuItem = menuJsItem || menuSqlItem;
      if (!menuItem) {
        setError('MENU_SQL · MENU_JS 산출물이 모두 없습니다. Claude 응답에 메뉴 등록 산출물이 포함되지 않았습니다.');
        return;
      }
      setMenuArtifactType(menuItem.artifactType);

      const full = await getArtifact(menuItem.id);
      setMenuSql(full.data);

      // 세션의 targetCd 확보 — MENU_SQL · MENU_JS 두 분기 모두 필요.
      //   MENU_SQL 분기에서 부모 메뉴 picker (<MenuPickerDialog targetCd={sessionTargetCd}>) 가
      //   T3SERIES 등 활성 Target 의 운영 메뉴 트리를 보여주기 위함.
      //   이전엔 MENU_JS 분기 안에만 setSessionTargetCd 가 있어 MENU_SQL 세션에서는
      //   null 유지 → composer-db 의 listAllMenus fallback 으로 표시 (운영 트리와 불일치).
      try {
        const sess = await getSession(sessionId);
        const tCd = sess?.data?.targetCd || sess?.data?.target_cd || null;
        setSessionTargetCd(tCd);
      } catch (_e) {
        // silent — picker 는 fallback 동작 가능
      }

      // MENU_JS — JSON 파싱 후 entries 추출, SQL 처리 일체 skip
      if (menuItem.artifactType === 'MENU_JS') {
        const content = full.data?.content || '';
        try {
          const json = JSON.parse(content);
          const entries = Array.isArray(json.entries) ? json.entries
                        : (json.reduxKey ? [json] : []);
          // 원본 텍스트 포맷 차이로 [원래대로] 버튼이 noise 처럼 보이는 것 방지 —
          // entries 로부터 재직렬화한 canonical 텍스트를 origin 기준으로 사용.
          const canonical = JSON.stringify({ entries }, null, 2);
          setMenuJsEntries(entries);
          setOriginalMenuJsContent(canonical);
          setMenuSql({ ...full.data, content: canonical });
          if (entries.length === 0) {
            setError('MENU_JS 산출물에 entries 가 없습니다. content 첫 줄: '
                     + content.substring(0, 120));
          }
        } catch (e) {
          setError('MENU_JS JSON 파싱 실패: ' + (e?.message || 'invalid JSON'));
        }

        // PLANEL 트리 로드 (groupKey 검증·picker 용) — sessionTargetCd 는 위에서 이미 set.
        try {
          const sess = await getSession(sessionId);
          const tCd = sess?.data?.targetCd || sess?.data?.target_cd || null;
          if (tCd) {
            const lang = localStorage.getItem('languageCode')
              || sessionStorage.getItem('languageCode')
              || (navigator.language || 'ko').slice(0, 2);
            const treeRes = await loadTargetMenuTree(lang, tCd);
            const groups = Array.isArray(treeRes?.data?.items) ? treeRes.data.items
                         : Array.isArray(treeRes?.data) ? treeRes.data
                         : [];
            setPlanelGroups(groups);
          }
        } catch (_e) {
          // 트리 로드 실패해도 메뉴 등록 자체는 가능 — silent
          setPlanelGroups([]);
        }
        return;
      }

      // 이하 기존 MENU_SQL 흐름
      const parsed = parseMenuSummary(full.data?.content || '');
      setOriginalSql(full.data?.content || '');

      if (parsed.parentMenuCd) {
        const exists = await checkMenuExists(parsed.parentMenuCd);
        setParentOk(!!exists.data?.exists);
      }

      // ── 초기 menuPath 정규화 — LOWER(MENU_FILE_PATH) 로 통일 (rules/41 §2.3) ──
      //   운영 표준 MENU_PATH 는 URL slug (예: '/sample/sample01', '/system/common/commoncode').
      //   이전엔 parent breadcrumb + ' > ' + leaf (한글 경로) 로 덮어썼는데 운영 형식과 달라
      //   사용자가 "관리 > 공통코드" 같이 잘못 들어가는 사고 (2026-05-27).
      //   parsed.fileName 또는 SQL 의 MENU_FILE_PATH 리터럴을 LOWER 처리해 사용.
      let menus = menuTree;
      if (!menus || menus.length === 0) {
        try {
          const res = await listAllMenus();
          menus = Array.isArray(res.data) ? res.data : [];
          setMenuTree(menus);
        } catch (_e) { menus = []; }
      }
      // MENU_FILE_PATH 값 → LOWER 로 변환. 없으면 parsed.menuPath 그대로 (Claude 작성본 fallback).
      const normalizedPath = (parsed.fileName || '').trim().toLowerCase()
        || (parsed.menuPath || '').trim();
      if (normalizedPath) {
        const fixedSql = rewriteMenuPath(full.data?.content || '', normalizedPath);
        setMenuSql({ ...full.data, content: fixedSql });
        setSummary({ ...parsed, menuPath: normalizedPath });
      } else {
        setSummary(parsed);
      }

      // 저장·삭제 기능 자동 감지 → 권한 타입 초기값 결정
      //   1) SCREEN_JSX 에 GridSaveButton / GridDeleteRowButton / S1·D1 호출이 있으면 각각 UPDATE / DELETE 추가
      //   2) 아무것도 없으면 READ 만
      const caps = await detectScreenCapabilities(items);
      const nextPerms = ['READ'];
      if (caps.canSave)   nextPerms.push('UPDATE');
      if (caps.canDelete) nextPerms.push('DELETE');
      setSelectedPermTypes(nextPerms);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || '로드 실패');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 화면의 저장/삭제 기능 존재 여부를 판정.
   *  - SCREEN_JSX artifact 내에 GridSaveButton / GridDeleteRowButton / GridDelRowButton 있으면 각각 true
   *  - SQL_SP artifact 에 `SP_UI_*_S[0-9]+` / `SP_UI_*_D[0-9]+` 가 있으면 보조 증거
   */
  const detectScreenCapabilities = async (artifactList) => {
    const result = { canSave: false, canDelete: false };
    try {
      const jsxItem = artifactList.find((a) => a.artifactType === 'SCREEN_JSX');
      if (jsxItem) {
        const jsxFull = await getArtifact(jsxItem.id);
        const code = jsxFull?.data?.content || '';
        if (/GridSaveButton|GridAddRowButton|\bS[0-9]+\b/.test(code))             result.canSave   = true;
        if (/GridDeleteRowButton|GridDelRowButton|\bD[0-9]+\b/.test(code))        result.canDelete = true;
      }
      // SP 이름 패턴으로 보조 감지 (JSX 에서 못 찾은 경우만)
      if (!result.canSave || !result.canDelete) {
        const spItems = artifactList.filter((a) => a.artifactType === 'SQL_SP');
        for (const sp of spItems) {
          const name = (sp.fileName || '').toUpperCase();
          if (!result.canSave   && /SP_UI_.+_S[0-9]+/.test(name))   result.canSave   = true;
          if (!result.canDelete && /SP_UI_.+_D[0-9]+/.test(name))   result.canDelete = true;
        }
      }
    } catch (_e) { /* 감지 실패 시 READ 만 — silent */ }
    return result;
  };

  // 트리에서 부모 메뉴를 선택했을 때:
  //  1. SQL content 내의 OLD 부모 MENU_CD 참조를 NEW 로 치환
  //  2. TB_AD_MENU INSERT 의 MENU_PATH 값을 **root→부모** 전체 경로 + leaf 로 재작성
  //  3. 로컬 summary 갱신 (parentMenuCd · menuPath · parentOk)
  const handlePickParent = async (picked) => {
    if (!picked) return;
    const newParent = picked.menuCd;
    const oldParent = summary?.parentMenuCd || '';

    // 현재 SQL (stale closure 방지용 snapshot)
    const currentSql = menuSql?.content || '';
    let nextSql = currentSql;

    // 1) 부모 MENU_CD 치환 (홑따옴표 경계 유지)
    if (oldParent && oldParent !== newParent) {
      const escaped = oldParent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(N?')${escaped}(')`, 'g');
      nextSql = nextSql.replace(re, `$1${newParent}$2`);
    }

    // 2) MENU_PATH 재작성 — LOWER(MENU_FILE_PATH) 로 통일 (운영 표준, rules/41 §2.3).
    //    parent 변경되어도 MENU_PATH 자체는 동일 (URL slug 는 파일 경로 따름).
    const reparsedTmp = parseMenuSummary(nextSql);
    const normalizedPath = (reparsedTmp.fileName || '').trim().toLowerCase()
      || (summary?.fileName || '').trim().toLowerCase()
      || (reparsedTmp.menuPath || '').trim();

    if (normalizedPath) {
      nextSql = rewriteMenuPath(nextSql, normalizedPath);
    }

    setMenuSql((prev) => prev ? { ...prev, content: nextSql } : { content: nextSql });
    const reparsed = parseMenuSummary(nextSql);

    setSummary((prev) => ({
      ...(prev || {}),
      ...reparsed,
      parentMenuCd: newParent,
      menuPath: normalizedPath || reparsed.menuPath,
    }));
    setParentOk(true);
  };

  // 변경 전 원본 SQL 로 되돌리기
  const revertSql = () => {
    if (!originalSql) return;
    setMenuSql((m) => m ? { ...m, content: originalSql } : m);
    const reparsed = parseMenuSummary(originalSql);
    setSummary(reparsed);
    if (reparsed.parentMenuCd) {
      checkMenuExists(reparsed.parentMenuCd)
        .then((r) => setParentOk(!!r.data?.exists))
        .catch(() => setParentOk(null));
    } else {
      setParentOk(null);
    }
  };

  // ── MENU_JS (PLANEL) — 그룹 picker / content 재조립 / revert ──

  /** entries 배열 → MENU_JS content JSON (pretty 2-space). */
  const buildMenuJsContent = (entries) => {
    try {
      return JSON.stringify({ entries }, null, 2);
    } catch (_e) {
      return originalMenuJsContent || '';
    }
  };

  /** PLANEL 트리 picker 에서 그룹 선택 — 해당 entry 의 groupKey 갱신 + JSON content 재조립. */
  const handlePickPlanelGroup = (picked) => {
    if (!picked || planelPickerEntryIdx < 0) return;
    setMenuJsEntries((prev) => {
      const next = prev.slice();
      if (planelPickerEntryIdx < next.length) {
        next[planelPickerEntryIdx] = { ...next[planelPickerEntryIdx], groupKey: picked.groupKey };
      }
      return next;
    });
  };

  /** entries 가 바뀌면 menuSql.content 도 동기화 — execute 시 override 로 전송 */
  useEffect(() => {
    if (menuArtifactType !== 'MENU_JS') return;
    if (!menuJsEntries || menuJsEntries.length === 0) return;
    const next = buildMenuJsContent(menuJsEntries);
    setMenuSql((m) => (m && m.content !== next) ? { ...m, content: next } : m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuJsEntries, menuArtifactType]);

  /** MENU_JS content 를 원본으로 되돌림 */
  const revertMenuJs = () => {
    if (!originalMenuJsContent) return;
    try {
      const json = JSON.parse(originalMenuJsContent);
      const entries = Array.isArray(json.entries) ? json.entries
                    : (json.reduxKey ? [json] : []);
      setMenuJsEntries(entries);
      setMenuSql((m) => m ? { ...m, content: originalMenuJsContent } : m);
    } catch (_e) { /* invalid original — silent */ }
  };

  // 선택된 그룹 x 권한 조합으로 TB_AD_PERMISSION_GROUP INSERT 문 생성.
  // 새 메뉴의 ID 는 MENU_CD 기반 sub-query 로 lookup (방금 INSERT 한 메뉴의 ID 를 확보).
  const buildPermissionSql = () => {
    if (!summary?.screenId) return '';
    if (selectedGroupIds.length === 0 || selectedPermTypes.length === 0) return '';
    const screenCd = summary.screenId;
    const lines = [
      '',
      '-- === AUTO: 메뉴 권한 (TB_AD_PERMISSION_GROUP) ===',
    ];
    for (const grpId of selectedGroupIds) {
      const grp = groups.find((g) => g.id === grpId);
      const grpLabel = grp ? `${grp.grpCd}/${grp.grpNm}` : grpId;
      for (const tp of selectedPermTypes) {
        lines.push(
          `-- ${grpLabel} · ${tp}`,
          `INSERT INTO TB_AD_PERMISSION_GROUP (ID, GRP_ID, MENU_ID, PERMISSION_TP, USABILITY, CREATE_BY, CREATE_DTTM)`,
          `SELECT LOWER(REPLACE(NEWID(), '-', '')),`,
          `       '${grpId}',`,
          `       (SELECT ID FROM TB_AD_MENU WHERE MENU_CD = '${screenCd}'),`,
          `       '${tp}',`,
          `       'Y',`,
          `       'composer',`,
          `       GETDATE()`,
          `WHERE EXISTS (SELECT 1 FROM TB_AD_MENU WHERE MENU_CD = '${screenCd}')`,
          `  AND NOT EXISTS (`,
          `       SELECT 1 FROM TB_AD_PERMISSION_GROUP pg`,
          `        JOIN TB_AD_MENU m ON m.ID = pg.MENU_ID`,
          `        WHERE pg.GRP_ID = '${grpId}'`,
          `          AND m.MENU_CD = '${screenCd}'`,
          `          AND pg.PERMISSION_TP = '${tp}');`,
        );
      }
    }
    return lines.join('\n');
  };

  const execute = async () => {
    setExecuting(true);
    setError(null);
    try {
      let sendOverride = null;
      if (menuArtifactType === 'MENU_JS') {
        // PLANEL — content (JSON) 가 picker 등으로 변경됐으면 override 로 전송
        const current = menuSql?.content || '';
        const original = originalMenuJsContent || '';
        sendOverride = (current && current !== original) ? current : null;
      } else {
        // MENU_SQL — 기존 흐름 (트리 픽커 SQL + 권한 SQL 합산)
        const baseSql = menuSql?.content || '';
        const permSql = buildPermissionSql();
        const combined = permSql ? baseSql + '\n' + permSql : baseSql;
        const original = originalSql || '';
        sendOverride = combined !== original ? combined : null;
      }
      const res = await executeMenuSql(sessionId, sendOverride);
      setResult(res.data);
    } catch (e) {
      const data = e?.response?.data;
      // 서버가 적절한 결과 Map 을 돌려주는 경우 그대로 사용.
      // 그렇지 않은 경우(네트워크·500 등) 원인 메시지를 errors 에 넣어 표시.
      if (data && (data.errors || data.success !== undefined)) {
        setResult(data);
      } else {
        const rootMsg = e?.response?.status
          ? `HTTP ${e.response.status}: ${data?.message || e.message}`
          : (e?.message || '실행 실패');
        setResult({ success: false, executed: 0, skipped: 0, errors: [rootMsg] });
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MenuIcon color="primary" />
        메뉴 등록 확인
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              MENU_SQL 산출물 로드 중...
            </Typography>
          </Stack>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* MENU_JS (PLANEL) — JSON entries 미리보기 패널 */}
        {!loading && menuArtifactType === 'MENU_JS' && !result && (
          <Stack spacing={2}>
            <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                PLANEL 류 Target — TabMenuList.js 에 직접 메뉴 entry append
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                대상 파일: <code>&lt;PLANEL repo&gt;/src/pages/TabMenuList.js</code>
                {' · '}동일 reduxKey 가 이미 있으면 자동 skip (멱등)
              </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  추가될 메뉴 entry ({menuJsEntries.length} 건)
                </Typography>
                <Box sx={{ flex: 1 }} />
                {originalMenuJsContent && originalMenuJsContent !== buildMenuJsContent(menuJsEntries) && (
                  <Button size="small" variant="text" color="inherit" onClick={revertMenuJs}>
                    원래대로
                  </Button>
                )}
              </Stack>
              <Stack spacing={1.5}>
                {menuJsEntries.map((e, i) => {
                  const groupKey = e.groupKey || '';
                  const inTree = !!planelGroups.find((g) => g.id === groupKey);
                  return (
                    <Box key={`${e.reduxKey || 'entry'}_${i}`} sx={{
                      p: 1.2,
                      border: '1px solid #e2e8f0',
                      borderRadius: 1,
                      bgcolor: '#f8fafc',
                    }}>
                      <Stack spacing={0.6}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 70, flexShrink: 0 }}>
                            부모 그룹
                          </Typography>
                          <Chip
                            label={groupKey || '(미지정)'}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                          />
                          {groupKey && inTree && (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                              label="트리에 존재"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {groupKey && !inTree && planelGroups.length > 0 && (
                            <Chip
                              icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                              label="신규 그룹 (생성됨)"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                          <Box sx={{ flex: 1 }} />
                          <Tooltip title="PLANEL TabMenuList.js 의 그룹 키 트리에서 선택">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AccountTreeIcon fontSize="small" />}
                              onClick={() => {
                                setPlanelPickerEntryIdx(i);
                                setPlanelPickerOpen(true);
                              }}
                              disabled={!sessionTargetCd}
                            >
                              트리에서 선택
                            </Button>
                          </Tooltip>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 70, flexShrink: 0 }}>
                            reduxKey
                          </Typography>
                          <Chip
                            label={e.reduxKey || '-'}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </Stack>
                        <Row label="title (i18n)" value={e.title} />
                        <Row label="component" value={e.componentName} />
                        {e.componentPath && (
                          <Row label="import path" value={`./${e.componentPath}`} />
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                실행될 JSON 미리보기
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  maxHeight: 280,
                  overflow: 'auto',
                  bgcolor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontSize: 11,
                  fontFamily: 'Consolas, monospace',
                  borderRadius: 1,
                }}
              >
                {menuSql?.content || ''}
              </Box>
            </Box>
          </Stack>
        )}

        {!loading && menuArtifactType === 'MENU_SQL' && summary && !result && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              아래 정보로 메뉴가 등록됩니다. 확인 후 실행하세요.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.2}>
                <Row label="화면 ID"   value={summary.screenId} />
                <Row label="메뉴 경로" value={summary.menuPath} />
                <Row label="JSX 파일"  value={summary.fileName} />
                <Divider />
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>
                    부모 메뉴
                  </Typography>
                  <Chip
                    label={summary.parentMenuCd || '(미지정)'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                  {parentOk === true && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                      label="DB 존재 확인"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {parentOk === false && (
                    <Chip
                      icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                      label="DB 에 없음"
                      size="small"
                      color="error"
                    />
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Tooltip title="실제 메뉴 트리에서 부모를 고르고 SQL 을 자동으로 바꿉니다">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AccountTreeIcon fontSize="small" />}
                      onClick={() => setPickerOpen(true)}
                    >
                      트리에서 선택
                    </Button>
                  </Tooltip>
                  {originalSql && menuSql?.content !== originalSql && (
                    <Button size="small" variant="text" color="inherit" onClick={revertSql}>
                      원래대로
                    </Button>
                  )}
                </Stack>

                <Divider />

                {/* 권한 동시 등록 — 그룹 × 권한 타입 선택 */}
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GroupIcon fontSize="small" sx={{ color: '#5281b3' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      사용자 그룹 권한 동시 등록
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (TB_AD_PERMISSION_GROUP)
                    </Typography>
                  </Stack>

                  {/* 그룹 선택 */}
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ pl: 3.5 }}>
                    {groups.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        등록 가능한 그룹이 없습니다. (TB_AD_GROUP 비어있음)
                      </Typography>
                    ) : (
                      groups.map((g) => {
                        const checked = selectedGroupIds.includes(g.id);
                        return (
                          <Chip
                            key={g.id}
                            label={
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <b>{g.grpCd}</b>
                                {g.grpNm && (
                                  <span style={{ color: '#64748b' }}>· {g.grpNm}</span>
                                )}
                              </Stack>
                            }
                            size="small"
                            color={checked ? 'primary' : 'default'}
                            variant={checked ? 'filled' : 'outlined'}
                            onClick={() =>
                              setSelectedGroupIds((prev) =>
                                prev.includes(g.id)
                                  ? prev.filter((id) => id !== g.id)
                                  : [...prev, g.id]
                              )
                            }
                            sx={{ cursor: 'pointer', fontSize: 11 }}
                          />
                        );
                      })
                    )}
                  </Stack>

                  {/* 권한 타입 선택 */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 3.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 60 }}>
                      권한 타입
                    </Typography>
                    {PERMISSION_TYPES.map((t) => (
                      <FormControlLabel
                        key={t.code}
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedPermTypes.includes(t.code)}
                            onChange={(e) =>
                              setSelectedPermTypes((prev) =>
                                e.target.checked
                                  ? [...prev, t.code]
                                  : prev.filter((c) => c !== t.code)
                              )
                            }
                            sx={{ p: 0.3 }}
                          />
                        }
                        label={
                          <Typography variant="caption">
                            {t.label} <span style={{ color: '#94a3b8' }}>({t.code})</span>
                          </Typography>
                        }
                      />
                    ))}
                  </Stack>

                  {selectedGroupIds.length > 0 && selectedPermTypes.length > 0 && (
                    <Typography variant="caption" color="primary" sx={{ pl: 3.5, fontWeight: 500 }}>
                      ✓ {selectedGroupIds.length} 개 그룹 × {selectedPermTypes.length} 권한 =
                      &nbsp;총 {selectedGroupIds.length * selectedPermTypes.length} 건 권한 SQL 이 추가됩니다.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Paper>

            {parentOk === false && (
              <Alert severity="warning">
                부모 메뉴 <b>{summary.parentMenuCd}</b> 가 DB 에 존재하지 않습니다.
                위의 <b>트리에서 선택</b> 을 눌러 실제 존재하는 부모 메뉴를 지정하거나,
                메뉴를 먼저 생성하세요.
              </Alert>
            )}

            {originalSql && menuSql?.content !== originalSql && (
              <Alert severity="info">
                SQL 이 트리 픽커를 통해 수정되었습니다. 등록 실행 시 수정된 SQL 이 반영됩니다.
              </Alert>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                실행될 SQL 미리보기 (메뉴 + 권한)
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  maxHeight: 280,
                  overflow: 'auto',
                  bgcolor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontSize: 11,
                  fontFamily: 'Consolas, monospace',
                  borderRadius: 1,
                }}
              >
                {(menuSql?.content || '') + (buildPermissionSql() ? '\n' + buildPermissionSql() : '')}
              </Box>
            </Box>
          </Stack>
        )}

        {result && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              borderColor: result.success ? 'success.light' : 'error.light',
              bgcolor: result.success ? 'success.lighter' : 'error.lighter',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              {result.success ? (
                <CheckCircleIcon color="success" />
              ) : (
                <ErrorIcon color="error" />
              )}
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {result.success ? '등록 완료' : '등록 실패'}
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="body2">
                {menuArtifactType === 'MENU_JS'
                  ? <>추가된 entry: <b>{result.executed ?? 0}</b>개, 이미 존재(skip): <b>{result.skipped ?? 0}</b>개</>
                  : <>실행된 statement: <b>{result.executed ?? 0}</b>개, 스킵: <b>{result.skipped ?? 0}</b>개</>
                }
              </Typography>
              {menuArtifactType === 'MENU_JS' && result.file && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                  대상 파일: {result.file}
                </Typography>
              )}
              {!result.success && /존재하지 않는 컬럼명|열 이름.*유효하지|MENU_NM|PARENT_MENU_CD|SORT_ORDER|DEPTH/.test(
                    (result.errors || []).join(' ')) && (
                <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                    💡 MENU_SQL 이 실제 TB_AD_MENU 스키마와 맞지 않습니다.
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Composer 채팅창에 아래 문구를 붙여 넣어 재생성하세요 (기존 산출물이 자동 대체됨):
                  </Typography>
                  <Box component="pre" sx={{
                    m: 0, mt: 0.5, p: 1, fontSize: 11,
                    bgcolor: '#0f172a', color: '#e2e8f0',
                    fontFamily: 'Consolas, monospace',
                    borderRadius: 0.5, whiteSpace: 'pre-wrap',
                  }}>
{`MENU_SQL 산출물을 다시 생성해주세요.
TB_AD_MENU 실제 컬럼만 사용:
  ID, PARENT_ID, MENU_CD, MENU_PATH, MENU_SEQ, MENU_FILE_PATH, USE_YN, CREATE_BY, CREATE_DTTM
금지 컬럼: MENU_NM, PARENT_MENU_CD, URL, DEPTH, SORT_ORDER
- ID 는 LOWER(REPLACE(NEWID(),'-',''))
- PARENT_ID 는 (SELECT ID FROM TB_AD_MENU WHERE MENU_CD='<부모_MENU_CD>')
- 메뉴 표시명은 TB_AD_LANG_PACK(LANG_CD, LANG_KEY=MENU_CD, LANG_VALUE) 에 ko/en/ja/zh 4건 INSERT
- WHERE NOT EXISTS 패턴으로 중복 방지`}
                  </Box>
                </Alert>
              )}
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <>
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    오류:
                  </Typography>
                  {result.errors.map((err, i) => {
                    const isSqlLine = typeof err === 'string' && err.startsWith('SQL:');
                    if (isSqlLine) {
                      return (
                        <Box key={i} component="pre" sx={{
                          m: 0, mt: 0.5, p: 1,
                          bgcolor: '#1e1e1e', color: '#d4d4d4',
                          fontSize: 10.5, fontFamily: 'Consolas, monospace',
                          borderRadius: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                          maxHeight: 180, overflow: 'auto',
                        }}>
                          {err.replace(/^SQL:\s*/, '')}
                        </Box>
                      );
                    }
                    return (
                      <Typography key={i} variant="caption" color="error" sx={{ fontFamily: 'monospace' }}>
                        • {err}
                      </Typography>
                    );
                  })}
                </>
              )}
              {result.success && (
                <Alert severity="info" icon={false} sx={{ mt: 1, py: 0.5, fontSize: 12, bgcolor: '#e0f2fe' }}>
                  ✅ 메뉴 등록 완료. 파일 저장·DDL·SP 실행은 별도 <b>산출물 실행</b> 다이얼로그에서 진행하세요.
                </Alert>
              )}
            </Stack>
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={executing}>닫기</Button>
        {!result && (
          <Button
            variant="contained"
            onClick={execute}
            disabled={
              loading || executing || !menuSql
              // MENU_SQL 모드만 parentOk 검사 — MENU_JS 는 부모 메뉴 개념이 없음
              || (menuArtifactType === 'MENU_SQL' && parentOk === false)
              // MENU_JS 모드에서 entries 가 비어있으면 실행 의미 없음
              || (menuArtifactType === 'MENU_JS' && menuJsEntries.length === 0)
            }
          >
            {executing ? '실행 중...' : '등록 실행'}
          </Button>
        )}
      </DialogActions>

      {/* 부모 메뉴 트리 픽커 — 그룹 노드만 선택 가능 (MENU_SQL = T3SERIES 등).
          targetCd 미전달 시 composer-db 기본 트리(local) 로 fallback → 실제 운영 메뉴와
          이질적인 하드코딩처럼 보임. 세션의 targetCd 를 넘겨 MetaStep 과 동일한
          운영 메뉴 트리를 사용. */}
      <MenuPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickParent}
        selectGroupOnly={true}
        targetCd={sessionTargetCd}
      />

      {/* PLANEL 그룹 트리 픽커 — MENU_JS 모드 entry 의 groupKey 변경 */}
      <PlanelGroupPicker
        open={planelPickerOpen}
        onClose={() => setPlanelPickerOpen(false)}
        onSelect={handlePickPlanelGroup}
        targetCd={sessionTargetCd}
        currentGroupKey={
          planelPickerEntryIdx >= 0 && planelPickerEntryIdx < menuJsEntries.length
            ? menuJsEntries[planelPickerEntryIdx]?.groupKey
            : null
        }
      />
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
        {value || '-'}
      </Typography>
    </Stack>
  );
}

/**
 * MENU_SQL 산출물 content 에서 요약 정보 추출.
 * - parentMenuCd: WHERE MENU_CD = 'xxx' 패턴 (부모 lookup 서브쿼리용)
 * - menuPath/fileName: INSERT INTO TB_AD_MENU (cols...) SELECT|VALUES ... 에서
 *   MENU_PATH · MENU_FILE_PATH 컬럼 인덱스를 찾아 해당 위치 리터럴 값만 정확히 추출
 */
function parseMenuSummary(sql) {
  const empty = { screenId: '', menuPath: '', fileName: '', parentMenuCd: '' };
  if (!sql) return empty;

  const out = { ...empty };
  // 부모: MENU_CD = 'xxx' (서브쿼리 lookup)
  const parent = sql.match(/MENU_CD\s*=\s*N?'([A-Za-z0-9_]+)'/i);
  if (parent) out.parentMenuCd = parent[1];
  // 화면 ID: UI_*
  const screen = sql.match(/N?'(UI_[A-Za-z0-9_]+)'/);
  if (screen) out.screenId = screen[1];

  // INSERT INTO TB_AD_MENU 블록에서 정확한 MENU_PATH / MENU_FILE_PATH 추출
  const stmts = splitTopLevelStatements(sql);
  for (const stmt of stmts) {
    if (!/^\s*INSERT\s+INTO\s+\[?TB_AD_MENU\b/i.test(stmt)) continue;
    const colM = stmt.match(/INSERT\s+INTO\s+\[?TB_AD_MENU\]?\s*\(([\s\S]*?)\)\s*(VALUES|SELECT)\b/i);
    if (!colM) continue;
    const cols = colM[1].split(',').map((c) => c.trim().replace(/[\[\]"`]/g, '').toUpperCase());
    const iPath = cols.indexOf('MENU_PATH');
    const iFile = cols.indexOf('MENU_FILE_PATH');
    if (iPath < 0 && iFile < 0) continue;

    const afterCols = stmt.substring(colM.index + colM[0].length);
    const verb = colM[2].toUpperCase();
    let tokens = [];
    if (verb === 'VALUES') {
      const vOpen = afterCols.indexOf('(');
      if (vOpen >= 0) {
        const { inner } = extractBalancedParen(afterCols, vOpen);
        tokens = splitSqlValues(inner || '');
      }
    } else {
      const end = findTopLevelSelectTerminator(afterCols);
      tokens = splitSqlValues(afterCols.substring(0, end));
    }
    if (iPath >= 0 && iPath < tokens.length) {
      const m = tokens[iPath].match(/^N?'((?:[^']|'')*)'\s*$/);
      if (m) out.menuPath = m[1].replace(/''/g, "'");
    }
    if (iFile >= 0 && iFile < tokens.length) {
      const m = tokens[iFile].match(/^N?'((?:[^']|'')*)'\s*$/);
      if (m) out.fileName = m[1].replace(/''/g, "'");
    }
    break;  // 첫 번째 TB_AD_MENU INSERT 만 기준
  }
  return out;
}

/**
 * TB_AD_MENU INSERT 문의 MENU_PATH 컬럼 값을 `<parentPath> > <leaf>` 로 재작성.
 *
 * 지원 포맷:
 *   INSERT INTO TB_AD_MENU (A, B, MENU_PATH, ...) VALUES (..., 'old', ...);
 *   INSERT INTO TB_AD_MENU (A, B, MENU_PATH, ...) SELECT ..., 'old', ... ;
 *   INSERT INTO TB_AD_MENU (A, B, MENU_PATH, ...) SELECT ..., 'old', ...
 *       WHERE NOT EXISTS (...);
 *
 * - 컬럼명에 공백 · [] · "" 래핑 허용.
 * - 내부 서브쿼리의 세미콜론에 현혹되지 않도록, 명령문 경계는 최상위 `;`(깊이 0) 기준.
 */
function rewriteMenuPath(sql, parentPath) {
  if (!sql || !parentPath) return sql;

  const statements = splitTopLevelStatements(sql);
  const rebuilt = statements.map((stmt) => rewriteSingleInsert(stmt, parentPath));
  return rebuilt.join(';\n') + (sql.trimEnd().endsWith(';') ? ';' : '');
}

// 최상위(깊이 0) 세미콜론으로 명령문 분할 (문자열 · 괄호 깊이 보호)
function splitTopLevelStatements(sql) {
  const out = [];
  let buf = '';
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (inStr) {
      buf += c;
      if (c === "'") {
        if (sql[i + 1] === "'") { buf += "'"; i++; }
        else inStr = false;
      }
    } else if (c === "'") {
      buf += c; inStr = true;
    } else if (c === '(') { depth++; buf += c; }
    else if (c === ')') { depth--; buf += c; }
    else if (c === ';' && depth === 0) {
      const t = buf.trim();
      if (t) out.push(t);
      buf = '';
    } else {
      buf += c;
    }
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

function rewriteSingleInsert(stmt, parentPath) {
  // TB_AD_MENU INSERT 가 아니면 그대로
  if (!/^\s*INSERT\s+INTO\s+\[?TB_AD_MENU\b/i.test(stmt)) return stmt;

  // 컬럼 리스트 추출
  const colM = stmt.match(/INSERT\s+INTO\s+\[?TB_AD_MENU\]?\s*\(([\s\S]*?)\)\s*(VALUES|SELECT)\b/i);
  if (!colM) return stmt;
  const colListRaw = colM[1];
  const verb = colM[2].toUpperCase();
  const cols = colListRaw.split(',').map((c) => c.trim().replace(/[\[\]"`]/g, '').toUpperCase());
  const idx = cols.indexOf('MENU_PATH');
  if (idx < 0) return stmt;

  const afterCols = stmt.substring(colM.index + colM[0].length);
  // 'VALUES' 와 'SELECT' 각각 처리
  // ★ parentPath 매개변수의 의미 = "최종 MENU_PATH 컬럼 값" (이전엔 parent breadcrumb
  //    + leaf 합성. 운영 표준이 LOWER(MENU_FILE_PATH) 인 URL slug 형태라 합성 잘못).
  //    호출자가 LOWER(menuFilePath) 같은 정확한 값 전달.
  if (verb === 'VALUES') {
    const vOpen = afterCols.indexOf('(');
    if (vOpen < 0) return stmt;
    const { endIdx, inner } = extractBalancedParen(afterCols, vOpen);
    if (endIdx < 0) return stmt;
    const tokens = splitSqlValues(inner);
    if (idx >= tokens.length) return stmt;
    tokens[idx] = `N'${escapeSql(parentPath)}'`;
    const newInner = tokens.join(', ');
    return stmt.substring(0, colM.index + colM[0].length)
         + afterCols.substring(0, vOpen) + '(' + newInner + ')'
         + afterCols.substring(endIdx + 1);
  } else {
    const selectEnd = findTopLevelSelectTerminator(afterCols);
    const selectPart = afterCols.substring(0, selectEnd);
    const rest = afterCols.substring(selectEnd);

    const tokens = splitSqlValues(selectPart);
    if (idx >= tokens.length) return stmt;
    tokens[idx] = `N'${escapeSql(parentPath)}'`;
    const newSelect = tokens.join(', ');
    return stmt.substring(0, colM.index + colM[0].length) + newSelect + rest;
  }
}

// SELECT list 가 끝나는 지점을 깊이-0 기준으로 탐색.
// 종결자: FROM / WHERE / GROUP BY / ORDER BY / HAVING / UNION / 문자열 끝
// 서브쿼리 괄호 안의 FROM/WHERE 는 무시 (depth > 0 에서 skip).
function findTopLevelSelectTerminator(s) {
  const TERMINATORS = ['FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'UNION'];
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "'") {
        if (s[i + 1] === "'") { i++; continue; }
        inStr = false;
      }
      continue;
    }
    if (c === "'") { inStr = true; continue; }
    if (c === '(') { depth++; continue; }
    if (c === ')') { depth--; continue; }
    if (depth !== 0) continue;
    // depth 0 에서 종결 키워드 검색 (word boundary)
    // 직전 문자가 word char 면 이미 다른 식별자의 일부 → skip
    const prevCh = i > 0 ? s[i - 1] : ' ';
    if (/\w/.test(prevCh)) continue;
    // 현재부터 슬라이스 검사
    const upper = s.substring(i, i + 8).toUpperCase();
    for (const kw of TERMINATORS) {
      if (upper.startsWith(kw)) {
        const afterKw = s.charAt(i + kw.length);
        if (!/\w/.test(afterKw)) return i;
      }
    }
  }
  return s.length;
}

// s[startAt] 이 '(' 이면 매칭되는 ')' 까지의 범위를 돌려줌
function extractBalancedParen(s, startAt) {
  if (s[startAt] !== '(') return { endIdx: -1, inner: '' };
  let depth = 0;
  let inStr = false;
  for (let i = startAt; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "'") {
        if (s[i + 1] === "'") { i++; continue; }
        inStr = false;
      }
    } else if (c === "'") {
      inStr = true;
    } else if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return { endIdx: i, inner: s.substring(startAt + 1, i) };
    }
  }
  return { endIdx: -1, inner: '' };
}

function escapeSql(s) {
  return String(s).replace(/'/g, "''");
}

// 기존 MENU_PATH 리터럴에서 leaf 이름만 추출.
function extractLeafFromLiteral(tok) {
  if (!tok) return '';
  const m = tok.match(/^N?'((?:[^']|'')*)'\s*$/);
  if (!m) return '';
  const body = m[1].replace(/''/g, "'");
  const seps = [' > ', '>', '/'];
  for (const s of seps) {
    const i = body.lastIndexOf(s);
    if (i >= 0) return body.substring(i + s.length).trim();
  }
  return body.trim();
}

// VALUES (...) 안의 콤마 구분 토큰을 단일따옴표 인지 + 괄호 깊이 기준으로 분할.
function splitSqlValues(s) {
  const out = [];
  let buf = '';
  let depth = 0;
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      buf += c;
      if (c === "'") {
        if (s[i + 1] === "'") { buf += "'"; i++; }
        else inStr = false;
      }
    } else if (c === "'") {
      buf += c; inStr = true;
    } else if (c === '(') { depth++; buf += c; }
    else if (c === ')') { depth--; buf += c; }
    else if (c === ',' && depth === 0) {
      out.push(buf.trim()); buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export default MenuRegistrationDialog;
