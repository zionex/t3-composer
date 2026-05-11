import React from 'react';
import {
  Box, Typography, Paper, Stack, TextField, RadioGroup, FormControlLabel, Radio, Alert, Chip,
  Divider,
} from '@mui/material';

import StepDataInspector from '../StepDataInspector';
import InferredSqlPanel from '../InferredSqlPanel';

/**
 * 모듈 도메인별 default source.
 *   · BF / DP / MP / FP : 계산·결과 도메인 — 거의 SP 기반 (mp/dp/bf/fp server 경유)
 *   · 그 외 (AD/UT/CM/IM/RP/SA/SO/SALES) : CRUD·마스터 — JPA_ENTITY 권장
 *
 * NEW_FROM_COPY 의 prefilled spec 에는 영향 없음 (이미 source 가 채워져 있음).
 * NEW_NL/NEW_STEP 에서 사용자가 새 area 추가하거나 prefill 없는 영역에서 default 로 사용.
 */
function defaultSourceFor(moduleCode) {
  const m = String(moduleCode || '').toUpperCase();
  return ['BF', 'DP', 'MP', 'FP'].includes(m) ? 'SP' : 'JPA_ENTITY';
}

const SP_RECOMMENDED_MODULES = new Set(['BF', 'DP', 'MP', 'FP']);

/**
 * SOURCES 의 라벨은 모듈에 따라 동적으로 (권장) 표시 — Step4 함수 안에서 렌더 시 결정.
 */
const SOURCES_BASE = [
  { value: 'JPA_ENTITY', label: 'JPA Entity (wingui 네이티브)', color: '#10b981' },
  { value: 'SP',         label: 'Stored Procedure (사전 등록 SP 연결)', color: '#f59e0b' },
  { value: 'ONTOLOGY',   label: '온톨로지 기반 (자연어 질의용)', color: '#8b5cf6' },
  { value: 'DIRECT',     label: '직접 URL 입력 (기타)', color: '#64748b' },
];

/**
 * Step4 — 각 Area 의 데이터 연결 설정.
 *  · JPA_ENTITY : entity 이름 + baseUrl (예: User / system/users) → 자동으로 GET/POST/POST-delete
 *  · SP         : spName (예: SP_UI_AD_USER_Q1). Composer 는 신규 SP 생성 금지 (rules/41)
 *  · ONTOLOGY   : menu_cd 또는 entity id → NL Query 플로우
 *  · DIRECT     : 사용자가 URL 직접 입력
 */
function Step4DataBinding({ areas, value, moduleCode, onChange, sourceBundle }) {
  const defaultSrc = defaultSourceFor(moduleCode);

  // sourceBundle 의 모든 Repository 의 queryMethods 합쳐 — JPA_ENTITY area 일 때 표시
  const allQueryMethods = React.useMemo(() => {
    const repos = (sourceBundle && sourceBundle.backend && sourceBundle.backend.repositories) || [];
    const out = [];
    for (const repo of repos) {
      if (Array.isArray(repo.queryMethods)) {
        for (const qm of repo.queryMethods) {
          out.push({ ...qm, repoName: repo.className || repo.name });
        }
      }
    }
    return out;
  }, [sourceBundle]);
  const SOURCES = SOURCES_BASE.map((s) =>
    s.value === defaultSrc ? { ...s, label: `${s.label} · 권장` } : s
  );

  // 진단 로그 — areas[].id 와 value 의 key 가 정합한지 + 각 bind 의 실제 필드값 출력
  // (NEW_FROM_COPY 의 데이터 연결 빈 칸 회귀 분석용)
  React.useEffect(() => {
    const areaIds = (areas || []).map((a) => a && a.id);
    const valueKeys = Object.keys(value || {});
    const mismatch = valueKeys.filter((k) => !areaIds.includes(k));
    const bindSummary = {};
    for (const k of valueKeys) {
      const v = value[k] || {};
      bindSummary[k] = {
        source: v.source,
        entity: v.entity,
        baseUrl: v.baseUrl,
        spName: v.spName,
        crudSp: v.crudSp,
        allSpNamesCount: Array.isArray(v.allSpNames) ? v.allSpNames.length : 0,
      };
    }
    // eslint-disable-next-line no-console
    console.info('[Composer Step4] areas:', JSON.stringify(areaIds),
      'valueKeys:', JSON.stringify(valueKeys),
      'mismatch:', JSON.stringify(mismatch),
      'bindSummary JSON:', JSON.stringify(bindSummary));
  }, [areas, value]);

  // 방어 — areas 의 grid kind 가 비어있더라도 value 에 키가 남아있으면 orphan 으로 표시
  // (어떤 경로로든 reconcile 이 누락되어도 사용자 데이터가 화면에서 사라지지 않게 한다)
  const gridAreas = (areas || []).filter((a) => a && a.kind !== 'dashboard' && a.kind !== 'search');
  const valueKeys = Object.keys(value || {});
  const knownIds = new Set(gridAreas.map((a) => a.id));
  const orphanIds = valueKeys.filter((k) => !knownIds.has(k));
  const displayAreas = [
    ...gridAreas,
    ...orphanIds.map((k) => ({ id: k, kind: 'grid', title: `${k} (orphan · areas 와 미정합)` })),
  ];

  const setArea = (areaId, patch) => {
    onChange({ ...value, [areaId]: { ...(value[areaId] || {}), ...patch } });
  };

  // SP 모드의 crudSp.{read|create|update|delete} 중 한 항목만 갱신.
  // read 변경 시 spName 도 동기화 (Step9 LLM 가이드의 1차 spName 호환).
  const setCrudSp = (areaId, action, sp) => {
    const current = value[areaId] || {};
    const crudSp = { ...(current.crudSp || {}), [action]: sp };
    const patch = { crudSp };
    if (action === 'read') patch.spName = sp;
    setArea(areaId, patch);
  };

  return (
    <Box>
      <StepDataInspector
        title="Step 4 — DataBinding 전체 데이터 (AI 분석 결과 · CRUD SP/URL/Entity 모두 포함)"
        data={value}
        summary={[
          { label: `${Object.keys(value || {}).length} bindings` },
          ...Object.values(value || {}).flatMap((v) =>
            v?.source ? [{ label: v.source, color: v.source === 'SP' ? '#fef3c7' : '#dcfce7' }] : []
          ),
        ]}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        각 Area 가 어디에서 데이터를 가져오는지 지정합니다.
        {SP_RECOMMENDED_MODULES.has(String(moduleCode || '').toUpperCase()) ? (
          <>
            {' '}<b>{moduleCode}</b> 모듈은 계산·결과 도메인이라 <b>Stored Procedure</b> 가 권장입니다.
            엔진 경유 호출(<code>callService</code>) 또는 사전 등록된 SP 만 연결.
          </>
        ) : (
          <>
            {' '}<b>{moduleCode || 'AD/UT/CM/...'}</b> 모듈은 CRUD·마스터 도메인이라 <b>JPA Entity</b> (wingui REST Controller) 가 권장입니다.
            SP 는 사전 등록된 것만 연결 (Composer 에서 신규 SP 생성 금지).
          </>
        )}
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        새 테이블이 꼭 필요하면 <b>자연어(NL) 모드</b> 로 다시 시작하시는 것을 권장합니다.
        단계별 생성 모드는 <b>기존 Table/View 재사용</b> 이 원칙입니다.
      </Alert>

      <Stack spacing={2}>
        {displayAreas.map((a) => {
          const bind = value[a.id] || { source: defaultSrc };
          // Render-time 진단 — useEffect 와 별개로 실제 그려질 때의 bind 값 출력
          // (NEW_FROM_COPY 데이터 연결 빈 칸 회귀 — render 시점 vs effect 시점 mismatch 진단용)
          // eslint-disable-next-line no-console
          console.info('[Composer Step4 RENDER]', a.id,
            'bind:', JSON.stringify({
              source: bind.source, entity: bind.entity, baseUrl: bind.baseUrl,
              spName: bind.spName,
            }));
          // String 강제 변환 + 한 번 더 fallback (controlled state 보장)
          const entityVal  = String(bind.entity ?? '');
          const baseUrlVal = String(bind.baseUrl ?? '');
          const sourceVal  = String(bind.source ?? defaultSrc);
          return (
            <Paper key={a.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip label={a.kind} size="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{a.id}</Typography>
              </Stack>

              <RadioGroup
                row value={sourceVal}
                onChange={(e) => setArea(a.id, { source: e.target.value })}
                sx={{ mb: 1 }}
              >
                {SOURCES.map((s) => (
                  <FormControlLabel
                    key={s.value} value={s.value}
                    control={<Radio size="small" />}
                    label={<Typography variant="body2" sx={{ color: s.color, fontWeight: 600 }}>{s.label}</Typography>}
                  />
                ))}
              </RadioGroup>

              {/* source 별 세부 입력 */}
              {sourceVal === 'JPA_ENTITY' && (
                <>
                  <Alert severity="success" icon={false} sx={{ mb: 1, py: 0.5, fontSize: 12, bgcolor: '#dcfce7' }}>
                    💡 이 화면은 wingui 네이티브 REST (JPA Entity) 방식 — <b>SP 를 사용하지 않습니다</b>.
                    Entity 클래스명과 Base URL 만 검토하시면 됩니다.
                  </Alert>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      // key 의 'has/empty' 토글로 비어있다가 prefill 채워질 때 한 번만 강제 재마운트.
                      // 사용자 입력 중에는 has 그대로라 포커스/IME 영향 없음.
                      key={`${a.id}-entity-${entityVal ? 'has' : 'empty'}`}
                      size="small" label="Entity 클래스명"
                      value={entityVal}
                      onChange={(e) => setArea(a.id, { entity: e.target.value })}
                      placeholder="User"
                      helperText="web/domain/<module>/<feature>/<Feature>.java"
                      sx={{ flex: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      key={`${a.id}-baseUrl-${baseUrlVal ? 'has' : 'empty'}`}
                      size="small" label="Base URL"
                      value={baseUrlVal}
                      onChange={(e) => setArea(a.id, { baseUrl: e.target.value })}
                      placeholder="system/users"
                      helperText="zAxios.get/post 의 상대 경로"
                      sx={{ flex: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                  {/* Repository method-name → 추론 SQL (Hibernate 가 런타임에 생성할 실제 쿼리 미리보기) */}
                  {allQueryMethods.length > 0 && (
                    <InferredSqlPanel
                      queryMethods={allQueryMethods}
                      title={`JPA 추론 SQL — Hibernate 가 런타임에 발생시킬 쿼리 (${allQueryMethods.length}건)`}
                      defaultExpanded={false}
                    />
                  )}
                </>
              )}

              {bind.source === 'SP' && (() => {
                // crudSp 가 비어있으면 spName(=read) 기반으로 객체 형태 표시 보장
                const crudSp = bind.crudSp || { read: bind.spName || '', create: '', update: '', delete: '' };
                const cudSpExists = !!(crudSp.create || crudSp.update || crudSp.delete);
                // SP 모드인데 spName · crudSp · allSpNames 모두 비어있으면 LLM 잘못 매핑 의심
                const spEmpty = !bind.spName && !cudSpExists && !crudSp.read
                  && !(Array.isArray(bind.allSpNames) && bind.allSpNames.length > 0);
                return (
                  <>
                  {spEmpty && (
                    <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}
                      action={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <button
                            onClick={() => setArea(a.id, { source: 'JPA_ENTITY', spName: '', crudSp: undefined, target: undefined, allSpNames: undefined })}
                            style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer',
                                     border: '1px solid #d97706', borderRadius: 4, background: '#fef3c7', color: '#92400e' }}>
                            JPA_ENTITY 로 변경
                          </button>
                        </Box>
                      }>
                      AI 가 SP 모드로 분류했으나 SP 이름을 찾지 못했습니다. 원본이 zAxios REST 만 사용하는 경우 JPA_ENTITY 가 정확합니다.
                    </Alert>
                  )}
                  <Stack spacing={1}>
                    {/* 첫 줄 — 조회 SP + Target */}
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small" label="조회 SP (Read · Q*)"
                        value={crudSp.read || ''}
                        onChange={(e) => setCrudSp(a.id, 'read', e.target.value)}
                        placeholder={`SP_UI_${(moduleCode || 'UT')}_<NO>_Q1`}
                        helperText="기존 등록 SP 만 연결 · 신규 생성 금지"
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small" label="Target 엔진" value={bind.target || 'mp'}
                        onChange={(e) => setArea(a.id, { target: e.target.value })}
                        placeholder="mp | dp | bf | fp"
                        helperText="SP 이름 prefix 로 자동 추정됨"
                        sx={{ width: 200 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>

                    {/* 두번째 줄 — CUD SP 3종 */}
                    <Divider>
                      <Typography variant="caption" color="text.secondary">
                        CUD SP (저장 · 삭제 — 사용자 액션이 있으면 채움)
                      </Typography>
                    </Divider>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small" label="저장(Create · S*)"
                        value={crudSp.create || ''}
                        onChange={(e) => setCrudSp(a.id, 'create', e.target.value)}
                        placeholder={`SP_UI_${(moduleCode || 'UT')}_<NO>_S1`}
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small" label="수정(Update · U*/S*)"
                        value={crudSp.update || ''}
                        onChange={(e) => setCrudSp(a.id, 'update', e.target.value)}
                        placeholder="(저장 SP 와 동일하면 비워둠)"
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        size="small" label="삭제(Delete · D*)"
                        value={crudSp.delete || ''}
                        onChange={(e) => setCrudSp(a.id, 'delete', e.target.value)}
                        placeholder={`SP_UI_${(moduleCode || 'UT')}_<NO>_D1`}
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>

                    {/* AI 가 발견한 전체 SP 목록 (참고용) */}
                    {Array.isArray(bind.allSpNames) && bind.allSpNames.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          원본에서 발견된 전체 SP 목록 (클릭해서 적용):
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {bind.allSpNames.map((sp) => (
                            <Chip
                              key={sp} size="small" label={sp}
                              onClick={() => {
                                // SP 이름 suffix 로 read/create/update/delete 자동 매핑
                                const action = /(_S\d*|_SAVE)$/.test(sp) ? 'create'
                                            : /(_D\d*|_DELETE)$/.test(sp) ? 'delete'
                                            : /(_U\d*|_UPDATE)$/.test(sp) ? 'update'
                                            : 'read';
                                setCrudSp(a.id, action, sp);
                              }}
                              sx={{ fontFamily: 'monospace', fontSize: 11, cursor: 'pointer',
                                    bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* SERVICE_ID 목록 (callService 첫 인자 — service.xml 의 <service id>) */}
                    {Array.isArray(bind.serviceIds) && bind.serviceIds.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          원본 callService SERVICE ID (service.xml &lt;service id&gt;):
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {bind.serviceIds.map((sid) => {
                            const mappedSp = bind.serviceIdToSp && bind.serviceIdToSp[sid];
                            return (
                              <Chip
                                key={sid} size="small"
                                label={mappedSp ? `${sid} → ${mappedSp}` : sid}
                                title={mappedSp ? `매핑된 SP: ${mappedSp}` : 'service.xml 매핑이 필요한 ID (백엔드 procedures 가 채워줘야 함)'}
                                sx={{ fontFamily: 'monospace', fontSize: 11,
                                      bgcolor: mappedSp ? '#dbeafe' : '#fef3c7',
                                      color: mappedSp ? '#1e40af' : '#92400e' }}
                              />
                            );
                          })}
                        </Stack>
                      </Box>
                    )}

                    {!cudSpExists && !spEmpty && (
                      <Alert severity="info" icon={false} sx={{ py: 0.3, fontSize: 12, bgcolor: '#fef9c3' }}>
                        💡 조회만 있는 화면이면 CUD 칸은 비워두세요. AI 가 찾지 못한 CUD SP 가 있으면 직접 입력하거나 위 SP 칩을 클릭해 적용.
                      </Alert>
                    )}
                  </Stack>
                  </>
                );
              })()}

              {bind.source === 'ONTOLOGY' && (
                <TextField
                  size="small" label="온톨로지 ref (menu_cd or entity id)"
                  value={bind.ontologyRef || ''}
                  onChange={(e) => setArea(a.id, { ontologyRef: e.target.value })}
                  placeholder="UI_DP_MONTHLY_PLAN"
                  helperText="tb_is_vwbusnss_ontlgy.menu_cd 또는 tb_is_ontlgy_entity.id"
                  fullWidth
                />
              )}

              {bind.source === 'DIRECT' && (
                <TextField
                  size="small" label="직접 URL"
                  value={bind.directUrl || ''}
                  onChange={(e) => setArea(a.id, { directUrl: e.target.value })}
                  placeholder="custom/my-endpoint"
                  fullWidth
                />
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

export default Step4DataBinding;
