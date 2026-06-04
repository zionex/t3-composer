package com.zionex.t3composer.domain.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.zionex.t3composer.domain.client.LlmClient;
import com.zionex.t3composer.domain.client.AnthropicModels.CacheControl;
import com.zionex.t3composer.domain.client.AnthropicModels.Message;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesRequest;
import com.zionex.t3composer.domain.client.AnthropicModels.MessagesResponse;
import com.zionex.t3composer.domain.client.AnthropicModels.SystemBlock;
import com.zionex.t3composer.domain.client.AnthropicModels.TextBlock;
import com.zionex.t3composer.domain.entity.PreviewMockup;
import com.zionex.t3composer.domain.repository.PreviewMockupRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * [화면 실행 LIVE] 의 AI mockup 변환.
 *
 * 흐름:
 *   1) original jsx + targetCd → sha256 hash 계산
 *   2) tb_cmp_preview_mockup 에서 cache lookup
 *   3) hit → 캐시된 mockup 반환 (즉시)
 *   4) miss → Anthropic Claude 호출 → mockup jsx 생성 → 캐시 저장 → 반환
 *
 * 변환 의도 (시각 인지 수준):
 *   · import 제한 — React + MUI core 만 (`Box · Stack · Typography · Paper · Button ·
 *     Chip · Divider · IconButton · TextField · MenuItem · Select · Table 류`)
 *   · wingui · @plannel · @zionex · utils 류 import 모두 제거
 *   · AG-Grid · RealGrid → MUI `<Table>` + sample 행 5개 (헤더·정렬 보존)
 *   · Chart.js · Recharts → MUI Box placeholder + 차트 타입 라벨
 *   · 데이터 호출 (zAxios · restApi · service.x · callService) → mock data inline
 *   · 시각 구조 (검색·그리드·차트 배치·KPI 카드 등) 는 원본과 동일
 *
 * Fallback:
 *   · Anthropic 호출 실패 → caller 가 raw jsx 사용하도록 null 반환
 *   · ApiKey 미등록 → null 반환 (cache 도 안 만듦)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MockupTransformService {

    private static final String MODEL_NAME = "claude-sonnet-4-5";
    // mockup jsx 는 핵심 시각 요소만 — 보통 80~200 줄 (2~4K 토큰).
    // 4K 로 박아두면 모델이 짧게 끊는 압력을 받아 응답 시간 단축. 너무 길어 잘리면
    // sandbox 가 syntax 오류로 fallback 발화 (안전망 — caller 가 raw jsx 사용).
    private static final int    MAX_TOKENS = 4096;
    // 원본 jsx 가 너무 크면 Anthropic input 토큰 폭증. 일반 화면은 30~80KB. 100KB 캡.
    private static final int    INPUT_HARD_CAP_CHARS = 100_000;

    private final LlmClient llmClient;
    private final AnthropicApiKeyService apiKeyService;
    private final PreviewMockupRepository mockupRepo;

    /**
     * 캐시 lookup 후 miss 시 Anthropic 호출로 mockup 생성. 반환값 = mockup jsx 문자열.
     * 실패/키없음 등 fallback 케이스는 null.
     *
     * @param originalJsx 원본 화면 jsx 소스
     * @param targetCd    Target 코드 (PLANNEL · T3SERIES 등 — prompt 분기에 사용)
     * @param originalPath 디버깅용 (어떤 화면인지 — log 출력)
     * @param userId      Anthropic API key 조회용 ('composer-dev' 등)
     * @param force       true 면 캐시 무시하고 다시 변환
     */
    public String transformOrCached(String originalJsx, String targetCd, String originalPath,
                                     String userId, boolean force) {
        if (originalJsx == null || originalJsx.isBlank()) return null;
        if (targetCd == null || targetCd.isBlank()) targetCd = "UNKNOWN";

        String hash = sha256(originalJsx);
        PreviewMockup.Pk pk = new PreviewMockup.Pk(hash, targetCd);

        if (!force) {
            Optional<PreviewMockup> cached = mockupRepo.findById(pk);
            if (cached.isPresent()) {
                log.info("mockup transform CACHE HIT — target={} path={} bytes={} model={}",
                        targetCd, originalPath, cached.get().getMockupBytes(), cached.get().getModelName());
                return cached.get().getMockupJsx();
            }
        }

        // miss → Anthropic 호출
        String apiKey;
        try {
            apiKey = apiKeyService.getApiKey(userId)
                    .orElseThrow(() -> new IllegalStateException(
                            "Anthropic API key 미등록 (userId=" + userId + ")"));
        } catch (Exception e) {
            log.warn("mockup transform skip — API key 미확보 ({}): {}", userId, e.getMessage());
            return null;
        }

        String userPrompt = originalJsx;
        if (userPrompt.length() > INPUT_HARD_CAP_CHARS) {
            log.warn("mockup transform 원본 jsx 가 캡({}) 초과 — {} chars 잘라서 전송 (path={})",
                    INPUT_HARD_CAP_CHARS, userPrompt.length() - INPUT_HARD_CAP_CHARS, originalPath);
            userPrompt = userPrompt.substring(0, INPUT_HARD_CAP_CHARS) + "\n// (이하 생략)";
        }

        String systemPrompt = buildSystemPrompt(targetCd);

        MessagesRequest mreq = MessagesRequest.builder()
                .model(MODEL_NAME)
                .max_tokens(MAX_TOKENS)
                .temperature(0.0)
                // system prompt 에 cache_control 부착 — 5분 안 재호출 시 input 90% 절감
                .system(List.of(SystemBlock.builder()
                        .type("text")
                        .text(systemPrompt)
                        .cacheControl(CacheControl.builder().type("ephemeral").build())
                        .build()))
                .messages(List.of(Message.builder().role("user").content(userPrompt).build()))
                .build();

        Instant t0 = Instant.now();
        MessagesResponse resp;
        try {
            resp = llmClient.sendMessages(apiKey, mreq).block();
        } catch (Exception e) {
            log.error("mockup transform Anthropic 호출 실패 — target={} path={} type={} msg={}",
                    targetCd, originalPath, e.getClass().getSimpleName(), e.getMessage(), e);
            return null;
        }
        long elapsedMs = Duration.between(t0, Instant.now()).toMillis();

        String mockupJsx = extractText(resp);
        if (mockupJsx == null || mockupJsx.isBlank()) {
            log.warn("mockup transform 응답이 비어있음 — target={} path={}", targetCd, originalPath);
            return null;
        }
        // 코드 펜스 (```jsx ... ```) 가 포함됐으면 벗기기
        mockupJsx = stripCodeFence(mockupJsx);

        // 캐시 저장
        try {
            PreviewMockup row = PreviewMockup.builder()
                    .originalHash(hash)
                    .targetCd(targetCd)
                    .originalPath(originalPath)
                    .originalBytes(originalJsx.length())
                    .mockupJsx(mockupJsx)
                    .mockupBytes(mockupJsx.length())
                    .modelName(resp != null && resp.getModel() != null ? resp.getModel() : MODEL_NAME)
                    .elapsedMs((int) elapsedMs)
                    .createDttm(LocalDateTime.now())
                    .build();
            mockupRepo.save(row);
        } catch (Exception e) {
            log.warn("mockup cache 저장 실패 (변환은 성공): {}", e.getMessage());
        }

        log.info("mockup transform DONE — target={} path={} originalBytes={} mockupBytes={} elapsed={}ms",
                targetCd, originalPath, originalJsx.length(), mockupJsx.length(), elapsedMs);
        return mockupJsx;
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private static String sha256(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(64);
            for (byte b : d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 실패", e);
        }
    }

    private static String extractText(MessagesResponse resp) {
        if (resp == null || resp.getContent() == null) return null;
        StringBuilder sb = new StringBuilder();
        for (Object block : resp.getContent()) {
            if (block instanceof Map) {
                Object t = ((Map<?, ?>) block).get("type");
                if ("text".equals(t)) {
                    Object tx = ((Map<?, ?>) block).get("text");
                    if (tx != null) sb.append(tx);
                }
            } else if (block instanceof TextBlock) {
                sb.append(((TextBlock) block).getText());
            }
        }
        return sb.toString();
    }

    /** Claude 가 코드 펜스로 감쌌으면 (```jsx ... ```) 펜스 내용만 추출. */
    private static String stripCodeFence(String s) {
        String t = s.trim();
        if (!t.startsWith("```")) return t;
        int firstNl = t.indexOf('\n');
        if (firstNl < 0) return t;
        int closingFence = t.lastIndexOf("```");
        if (closingFence <= firstNl) return t;
        return t.substring(firstNl + 1, closingFence).trim();
    }

    private String buildSystemPrompt(String targetCd) {
        return String.join("\n",
            "당신은 React 화면 JSX 를 시각 mockup 으로 변환하는 도구입니다.",
            "",
            "출력 화면은 [화면 실행 LIVE] 미리보기에서 격리 sandbox 안에 실행됩니다. 외부 의존성·",
            "ambient 글로벌·복잡한 npm 패키지는 사용할 수 없습니다. **시각적 구조만 동일하게**",
            "단순화된 React 컴포넌트를 출력하세요.",
            "",
            "## 길이 — 최대 220줄 · 최소 표현",
            "",
            "**목표는 \"화면 골격 시각 확인\" 이지 \"완성도 높은 UI\" 가 아닙니다.** 다음 원칙을 따릅니다:",
            "- 동일한 패턴(예: KPI 카드 5개, 컬럼 8개)은 **반복 작성하지 말고 inline 배열 + map** 으로",
            "- 주석/빈 줄 최소화 (sandbox 가 파싱만 하면 됨)",
            "- 같은 스타일 객체는 변수로 추출",
            "- styled-components/긴 sx — 핵심 시각만 (배경/padding/radius/border 정도)",
            "- 헬퍼 함수 분리 금지 — 인라인 처리",
            "",
            "## 출력 규칙 — 엄격히 준수",
            "",
            "1. **출력은 jsx 코드 하나뿐.** 설명/주석/마크다운/코드 펜스 모두 금지.",
            "",
            "2. **허용된 import**:",
            "   ```",
            "   import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';",
            "   import { Box, Stack, Typography, Paper, Divider, Chip, Button, IconButton,",
            "     TextField, MenuItem, Select, FormControl, InputLabel,",
            "     Table, TableHead, TableBody, TableRow, TableCell, TableContainer,",
            "     Tabs, Tab, Card, CardContent, CardHeader, Avatar } from '@mui/material';",
            "   ```",
            "   그 외 모든 import 금지 — @plannel, @wingui, @zionex, ag-grid, chart.js,",
            "   recharts, lodash, moment, axios, react-redux, react-router-dom, 상대 import (./..)",
            "   모두 삭제.",
            "",
            "3. **AG-Grid · RealGrid · BaseGrid 등 모든 grid** → MUI `<Table>` 로 변환.",
            "   원본의 컬럼 정의에서 헤더명·정렬을 추출해 `<TableHead>` 작성. mock 데이터는 inline",
            "   `const SAMPLE_ROWS = [{...}, ...]` 형태로 **3건** (현실적 값 — 코드/명칭/숫자/날짜).",
            "   <TableContainer component={Paper}> 로 감싸서 그리드 느낌 유지.",
            "",
            "4. **차트** (Chart.js · Recharts · ApexCharts 등) → MUI Box placeholder.",
            "   ```jsx",
            "   <Box sx={{ height: 200, background: 'linear-gradient(180deg, #e0f2fe, #bae6fd)',",
            "     borderRadius: 1, display:'flex', alignItems:'center', justifyContent:'center' }}>",
            "     <Typography variant='caption' color='text.secondary'>[Chart: Line — 월별 추이]</Typography>",
            "   </Box>",
            "   ```",
            "   원본의 차트 타입 (Line/Bar/Pie/Donut/Area 등) 을 라벨에 표시.",
            "",
            "5. **API/Service 호출** (`zAxios.get`, `restApi.post`, `xService.list`, `callService` 등)",
            "   → 모두 제거하고 mock data 사용. useEffect 에서 fetch 패턴은 빈 useEffect 또는 삭제.",
            "",
            "6. **레이아웃 보존 — 가장 중요**",
            "   · 검색 영역 (SearchArea / FilterContainer 등) → **반드시 wrap 되는 grid layout**:",
            "     ```jsx",
            "     <Box sx={{ display:'grid',",
            "                gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',",
            "                gap: 2, alignItems:'center', mb: 2 }}>",
            "       {/* 각 TextField/Select 는 width 지정 없이 그냥 size='small' 만 */}",
            "     </Box>",
            "     ```",
            "     ❌ `<Stack direction='row' spacing={2}>` 으로 5개 이상 input 한 줄 배치 금지 —",
            "     iframe 미리보기 폭이 좁으면 wrap 안 되고 각 input 이 30~40px 로 collapse 됨.",
            "     ❌ TextField 에 고정 `width: 120` / `width: 150` 부여 금지 — grid cell 이 알아서 fit.",
            "     · 조회/Refresh/Config 등 버튼은 검색 grid 와 **별도 Stack** 으로 분리",
            "       (`<Stack direction='row' spacing={1} sx={{ mb: 1 }}>` ...buttons).",
            "   · 분할 (SplitPanel 등) → flexbox Box",
            "   · 탭 (TabContainer / Tabs) → MUI Tabs/Tab",
            "   · 카드/패널 (Paper / GroupBox) → MUI Paper",
            "   · KPI / 통계 박스 → MUI Card 또는 Box + Typography (큰 숫자)",
            "   · 버튼 → MUI Button (variant='outlined' 또는 'contained')",
            "",
            "7. **withTranslation · i18n · t(...)** → 텍스트 그대로 사용. `t('label.foo')` → 'foo'.",
            "",
            "8. **Redux / React Router · 사용자 컨텍스트** → 모두 제거하거나 useState 로 대체.",
            "",
            "9. **함수형 컴포넌트 1개로 통합** — `export default function ScreenMockup() { ... }`.",
            "   원본의 export 이름은 그대로 유지해도 무방.",
            "",
            "## Target 별 노트",
            "",
            "- PLANNEL: 원본이 AG-Grid + restApi 패턴 — Table + sample 행으로 단순화.",
            "- T3SERIES: 원본이 BaseGrid + zAxios 패턴 — MUI Table 로 통일 (BaseGrid shim 호환을 위해 변환).",
            "",
            "현재 Target = " + targetCd,
            "",
            "## 출력",
            "",
            "원본 jsx 를 받으면 위 규칙대로 변환한 jsx 만 출력. 코드 외 어떤 텍스트도 포함 금지."
        );
    }
}
