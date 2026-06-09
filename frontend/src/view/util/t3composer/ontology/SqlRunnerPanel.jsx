import React, { useCallback, useMemo, useState } from 'react';
import {
  Box, Stack, Button, IconButton, Typography, Alert, Chip, Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { previewOntologySql } from '../api';

/**
 * Q&A Answer 같은 SQL 을 Target DB 에서 안전 실행 → 결과 표시.
 * Props:
 *  - sql: string (현재 편집 중인 SQL — 저장 불필요)
 *  - targetCd: string
 *  - dbType: 'mssql' | 'oracle' | 'postgresql'
 */
function SqlRunnerPanel({ sql, targetCd, dbType }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);  // { columns, rows, rowCount, elapsedMs, truncated, topInjected, executedSql }
  const [error, setError] = useState(null);    // { code, message, sqlState? }
  const [expanded, setExpanded] = useState(true);

  const canRun = !!(sql && sql.trim()) && !!targetCd && !running;

  const handleRun = useCallback(async () => {
    if (!canRun) return;
    setRunning(true);
    setError(null);
    try {
      const r = await previewOntologySql(sql, targetCd, dbType);
      setResult(r.data);
      setExpanded(true);
    } catch (e) {
      const err = e?.response?.data?.error || { code: 'NETWORK', message: e?.message || '네트워크 오류' };
      setError(err);
      setExpanded(true);
    } finally {
      setRunning(false);
    }
  }, [sql, targetCd, dbType, canRun]);

  // Ctrl/Cmd+Enter — Answer textarea 에서 한 단계 위로 bubble 됨. 본 컴포넌트 안의 [실행] 버튼 영역만.
  const handlePanelKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  const handleCopy = useCallback(async () => {
    if (!result || !result.rows?.length) return;
    const tsv = toTsv(result.columns, result.rows);
    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      // 폴백 — 일부 환경에서 clipboard API 비활성
      const ta = document.createElement('textarea');
      ta.value = tsv;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (_) { /* ignore */ }
      document.body.removeChild(ta);
    }
  }, [result]);

  const meta = useMemo(() => {
    if (error) return null;
    if (!result) return null;
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1 }}>
        <Typography sx={{ fontSize: 11, color: '#3A4A63' }}>
          {result.rowCount}행 · {result.elapsedMs}ms
        </Typography>
        {result.truncated && (
          <Chip size="small" label="잘림 (5000행 상한)" sx={{
            fontSize: 10, height: 18, bgcolor: '#FFF1D6', color: '#7A5A12',
            border: '1px solid #E6C079',
          }} />
        )}
      </Stack>
    );
  }, [result, error]);

  return (
    <Box
      onKeyDown={handlePanelKeyDown}
      sx={{
        mt: 0.5,
        border: '1px solid rgba(124,167,224,0.30)',
        borderRadius: 1,
        bgcolor: 'rgba(233,241,251,0.40)',
      }}
    >
      {/* 헤더 */}
      <Stack direction="row" alignItems="center" spacing={1}
        sx={{ p: 0.75, borderBottom: expanded ? '1px solid rgba(124,167,224,0.30)' : 'none' }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<PlayArrowIcon fontSize="small" />}
          onClick={handleRun}
          disabled={!canRun}
          sx={{
            bgcolor: '#7CA7E0', '&:hover': { bgcolor: '#6594D0' },
            fontSize: 11, py: 0.25, minHeight: 26,
          }}
        >
          {running ? '실행 중…' : 'SQL 실행'}
        </Button>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)}
          sx={{ p: 0.25 }} title={expanded ? '결과 접기' : '결과 펼치기'}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#3A4A63' }}>
          결과 미리보기
        </Typography>
        {meta}
        <Box sx={{ flex: 1 }} />
        {result && result.rows?.length > 0 && (
          <Tooltip title="TSV 로 클립보드 복사">
            <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* 본문 */}
      {expanded && (
        <Box sx={{ p: 0.75 }}>
          {!targetCd && (
            <Alert severity="info" sx={{ fontSize: 11, py: 0.5 }}>
              Target System 이 선택되지 않았습니다.
            </Alert>
          )}
          {targetCd && !result && !error && (
            <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>
              [SQL 실행] 을 누르면 Target DB({targetCd}, {dbType || 'mssql'})에서 SELECT 만 안전 실행합니다. 행 수는 작성하신 SQL 의 TOP/WHERE 로 직접 제어해 주세요.
            </Typography>
          )}
          {error && <ErrorAlert error={error} />}
          {!error && result && <ResultTable result={result} />}
        </Box>
      )}
    </Box>
  );
}

function ErrorAlert({ error }) {
  // 운영 DB 상태성 오류 (tempdb 부족, transaction log full 등) 패턴 감지 — 사용자/SQL 문제가 아닌 DBA 이슈
  const dbaIssue = classifyDbaIssue(error.message || '');
  const severity = dbaIssue ? 'warning'
    : error.code === 'QUERY_TIMEOUT' ? 'warning'
    : 'error';
  const hint = {
    BLOCKED: '허용되지 않은 SQL 입니다. SELECT 또는 WITH 로 시작하는 쿼리만 실행할 수 있습니다.',
    BLOCKED_KEYWORD: 'DML/DDL 키워드는 허용되지 않습니다.',
    BLOCKED_INTO: 'SELECT INTO 는 허용되지 않습니다 (결과를 새 테이블에 쓰기 시도).',
    MULTI_STATEMENT: '세미콜론으로 여러 문장을 보낼 수 없습니다.',
    NOT_SELECT: 'SELECT 또는 WITH 로 시작하는 쿼리만 허용됩니다.',
    EMPTY: 'SQL 이 비어있습니다.',
    QUERY_TIMEOUT: '10초 안에 결과가 오지 않았습니다. WHERE 조건을 좁히거나 TOP/LIMIT 를 추가해 보세요.',
    TARGET_NOT_CONFIGURED: 'Target DB 연결정보가 없습니다. 좌상단 Target 셀렉터의 Storage 다이얼로그에서 JDBC URL/계정을 설정하세요.',
    TOO_MANY_COLUMNS: '컬럼 수가 너무 많습니다 (최대 200). SELECT 절을 좁혀 주세요.',
    SQL_ERROR: 'SQL 실행 중 오류가 발생했습니다.',
    RUNTIME_ERROR: '서버 내부 오류가 발생했습니다.',
    NETWORK: '네트워크 오류 — 백엔드가 기동 중인지 확인하세요.',
  }[error.code];

  return (
    <Alert severity={severity} sx={{ fontSize: 11, py: 0.5, '& .MuiAlert-message': { width: '100%' } }}>
      <Stack spacing={0.5}>
        <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
          [{error.code}]{error.sqlState ? ` SQLState=${error.sqlState}` : ''}
        </Typography>
        {dbaIssue && (
          <Box sx={{
            border: '1px solid #E6C079', bgcolor: '#FFF7E5', borderRadius: 0.5,
            p: 0.75, mt: 0.25,
          }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#7A5A12', mb: 0.25 }}>
              ⚠ Target DB 운영 상태 이슈 — Composer 가드/쿼리 문제가 아닙니다
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#5A4310' }}>
              {dbaIssue.summary}
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#5A4310', mt: 0.5 }}>
              <b>해결</b>: {dbaIssue.fix}
            </Typography>
            {dbaIssue.workaround && (
              <Typography sx={{ fontSize: 11, color: '#5A4310', mt: 0.25 }}>
                <b>임시 우회</b>: {dbaIssue.workaround}
              </Typography>
            )}
          </Box>
        )}
        {!dbaIssue && hint && <Typography sx={{ fontSize: 11 }}>{hint}</Typography>}
        <Typography sx={{ fontSize: 11, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', whiteSpace: 'pre-wrap', color: '#3A4A63' }}>
          {error.message}
        </Typography>
      </Stack>
    </Alert>
  );
}

/** 운영 DB 측 자원/상태 이슈 패턴 — 사용자/쿼리 잘못이 아님을 분명히 알려야 한다. */
function classifyDbaIssue(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('tempdb') && (m.includes('filegroup is full') || m.includes('could not allocate'))) {
    return {
      summary: '운영 MSSQL 의 tempdb 디스크가 가득 차 정렬·그룹화의 중간 결과를 저장하지 못했습니다. 동일 쿼리를 SSMS 같은 다른 클라이언트에서 돌려도 같은 에러가 납니다.',
      fix: '운영팀(DBA)에 tempdb 디스크 확장·autogrowth 활성화·SQL Server 재시작 중 한 가지 요청.',
      workaround: '잠시 후(다른 사용자의 큰 트랜잭션 종료 후) 재시도, 또는 쿼리의 WHERE 조건을 더 좁혀 GROUP BY/ORDER BY 대상 행 수 축소.',
    };
  }
  if (m.includes('transaction log') && m.includes('full')) {
    return {
      summary: 'Target DB 의 트랜잭션 로그가 가득 찼습니다.',
      fix: '운영팀(DBA)에 트랜잭션 로그 백업/축소 요청.',
      workaround: null,
    };
  }
  if (m.includes('out of memory') || m.includes('insufficient memory')) {
    return {
      summary: 'Target DB 서버 메모리가 부족합니다.',
      fix: '운영팀(DBA)에 서버 메모리 확인 요청.',
      workaround: '쿼리 단순화 (조인/그룹 축소).',
    };
  }
  if (m.includes('database') && m.includes('is in transition') ) {
    return {
      summary: 'Target DB 가 일시적으로 전이 상태 (recovery / restore / detach 등).',
      fix: '운영팀에 상태 확인 요청.',
      workaround: '잠시 후 재시도.',
    };
  }
  return null;
}

function ResultTable({ result }) {
  const { columns = [], rows = [] } = result;
  if (!rows.length) {
    return <Typography sx={{ fontSize: 11, color: '#6E7E96' }}>(0 rows)</Typography>;
  }
  return (
    <Box sx={{ maxHeight: 360, overflow: 'auto', border: '1px solid #DAE5F4', borderRadius: 0.5, bgcolor: '#fff' }}>
      <Box component="table" sx={{
        borderCollapse: 'separate', borderSpacing: 0, fontSize: 11, width: '100%',
        fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
      }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <Box component="th" key={c} sx={{
                position: 'sticky', top: 0, zIndex: 1,
                bgcolor: '#E9F1FB', color: '#3A4A63',
                borderBottom: '1px solid #BFD5EE', borderRight: '1px solid #DAE5F4',
                padding: '4px 8px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap',
              }}>{c}</Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => {
                const v = row[c];
                const isNull = v === null || v === undefined;
                const isNum = typeof v === 'number' || typeof v === 'bigint';
                const isBool = typeof v === 'boolean';
                return (
                  <Box component="td" key={c} sx={{
                    padding: '3px 8px',
                    borderBottom: '1px solid #EEF2F8',
                    borderRight: '1px solid #F4F7FB',
                    color: isNull ? '#9CA8BD' : '#3A4A63',
                    textAlign: isNum ? 'right' : 'left',
                    whiteSpace: 'nowrap', verticalAlign: 'top',
                    maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                  title={isNull ? null : String(v)}>
                    {isNull ? '(null)' : isBool ? (v ? '✓' : '✗') : String(v)}
                  </Box>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

function toTsv(columns, rows) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
  };
  const head = columns.join('\t');
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join('\t')).join('\n');
  return head + '\n' + body;
}

export default SqlRunnerPanel;
