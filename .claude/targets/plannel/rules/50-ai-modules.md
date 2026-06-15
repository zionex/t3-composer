# 50. AI 모듈 (saas-ai · saas-ai-agent)

> PlanNEL 의 AI 기능은 **두 개의 독립 Python 서비스** 로 분리:
> - **saas-ai**: 수요 예측 (Forecasting) — Spark + Apache Hop pipeline + AWS EC2 동적 생성
> - **saas-ai-agent**: AI 챗봇 + 시나리오 자동 추천 — FastAPI + AWS Bedrock Claude 3.5 + AgentCore Memory
>
> 화면 개발자가 직접 손댈 일은 거의 없지만, **PlanNEL 화면이 AI 결과를 표시할 때 어떤 테이블/endpoint 를 참조하는지** 알아야 함.

---

## 1. saas-ai (수요 예측 엔진)

### 1.1 역할
사용자가 BF 화면에서 "예측 실행" 버튼 클릭 → saas-application 이 BF 서버에 REST 요청 → BF 서버가 AWS EC2 instance 동적 생성 → instance 에서 Apache Hop pipeline 실행 → 결과 저장 → instance 자동 종료.

### 1.2 기술 스택
- Ubuntu Server (VM)
- Anaconda3 + Python 3.9
- **PySpark** (대량 시계열 데이터 병렬 처리)
- **Apache Hop** (ETL Pipeline)
- **Terraform** (AWS EC2 인스턴스 동적 프로비저닝)
- AWS S3 (모델/결과 저장)

### 1.3 워크플로우

```
1. Frontend BF 화면 → 예측 실행 버튼
   ↓
2. saas-application → POST /api/bf/run { itemCdList, periodFrom, periodTo, modelType }
   ↓
3. saas-application 의 BfRunService:
   ├─ Terraform apply → AWS EC2 instance 생성 (GPU/CPU 옵션)
   ├─ EC2 에 SSH 접속 → Apache Hop pipeline 실행 명령
   └─ pipeline 진행 상황 → DB (`z_bf_run_history`) 갱신
   ↓
4. EC2 의 Hop pipeline:
   ├─ S3 / RDS 에서 historical sales 로딩
   ├─ PySpark 로 모델 학습 (ARIMA / Prophet / DeepAR / LightGBM 등)
   ├─ 결과를 z_bf_result · z_bf_leaderboard 에 저장
   └─ 모델 metric 업데이트
   ↓
5. Terraform destroy → EC2 instance 자동 종료
   ↓
6. Frontend 가 z_bf_result 조회 → 차트 표시
```

### 1.4 관련 z_bf_* 테이블

| 테이블 | 역할 |
|---|---|
| `z_bf_run_history` | 예측 실행 이력 (status / start_ts / end_ts / parameters) |
| `z_bf_result` | 예측 결과 (item_cd / period / forecast_qty / lower / upper) |
| `z_bf_leaderboard` | 모델 비교 (model / metric / rank) |
| `z_bf_features_date` | 날짜별 feature (휴일/이벤트 등) |
| `z_bf_model` | 모델 메타 |

### 1.5 Frontend 통합

```jsx
// pages/demand-plan/baseline-forecast/BfDashboard.js
import bfResultService from "@plannel/services/dp/bf-result-service";
import bfRunService from "@plannel/services/dp/bf-run-service";

const handleRun = async () => {
  const runId = await bfRunService.start({ itemCdList, periodFrom, periodTo, modelType });
  // status polling
  const interval = setInterval(async () => {
    const status = await bfRunService.getStatus(runId);
    if (status === "COMPLETED") {
      clearInterval(interval);
      const results = await bfResultService.getAll({ runId });
      setRows(results.data.results);
    }
  }, 5000);
};
```

---

## 2. saas-ai-agent (AI 챗봇 + 시나리오 추천)

### 2.1 역할
- **챗봇 AI 분석**: 모듈별 화면 데이터를 실시간 분석 + 사용자와 자연어 대화
- **시나리오 자동 추천**: IP/DP/RP/MP 시나리오 생성 → 엔진 시뮬레이션 → AI 가 결과 순위 매김 → 추천 시나리오 제시

### 2.2 기술 스택
- Python + **FastAPI**
- **AWS Bedrock Claude 3.5 Sonnet**
- **AgentCore Runtime** (AWS 배포용 SDK)
- **Prompt Caching** (Bedrock 의 cache_control)
- **AgentCore Memory SessionManager** (대화 이력 영속)

### 2.3 패키지 구조

```
saas-ai-agent/
├── pyproject.toml
├── src/
│   ├── agent/                                    # AgentCore Runtime
│   │   ├── runtime.py                            # 진입점 (FastAPI + AgentCore)
│   │   └── hooks.py                              # SessionManager (대화 이력)
│   ├── analyzers/                                # 모듈별 분석기 (BaseAnalyzer 상속)
│   │   ├── base_analyzer.py                      # 공통 (prompt cache + memory)
│   │   ├── bf_analyzer.py                        # 수요 예측
│   │   ├── dp_analyzer.py                        # 수요 계획
│   │   ├── ip_analyzer.py                        # 재고 계획
│   │   ├── rp_analyzer.py                        # 보충 계획
│   │   └── mp_analyzer.py                        # 생산 계획
│   ├── scenario/                                 # 멀티모듈 시나리오
│   │   ├── ip/                                   # IP 시나리오 (완료)
│   │   │   ├── generator.py                      # 시나리오 자동 생성
│   │   │   ├── runner.py                         # 엔진 시뮬레이션 호출
│   │   │   └── ranker.py                         # AI 가 결과 순위 매김
│   │   ├── dp/  rp/  mp/                         # 예정
│   ├── tools/                                    # @tool 데코레이터로 LLM 에 노출
│   │   ├── data_query.py                         # PostgreSQL 직접 쿼리
│   │   └── api_caller.py                         # saas-application REST 호출
│   └── prompts/
│       ├── system_prompts.py
│       └── module_prompts/
│           ├── bf.txt
│           ├── ip.txt
│           └── ...
└── deploy/
    ├── agentcore.yaml                            # AgentCore 배포 설정
    └── terraform/                                # AWS 인프라
```

### 2.4 핵심 디자인 패턴

#### 2.4.1 `@register()` 데코레이터로 모듈 자동 등록

```python
# src/analyzers/registry.py
ANALYZERS = {}

def register(module_name: str):
    def decorator(cls):
        ANALYZERS[module_name] = cls
        return cls
    return decorator

# src/analyzers/bf_analyzer.py
from .base_analyzer import BaseAnalyzer
from .registry import register

@register("BF")
class BfAnalyzer(BaseAnalyzer):
    def __init__(self):
        super().__init__(module="BF", system_prompt_path="prompts/module_prompts/bf.txt")
    # ... 분석 로직
```

#### 2.4.2 BaseAnalyzer — Prompt Caching + Memory

```python
# src/analyzers/base_analyzer.py
from boto3 import client
from agentcore.memory import SessionManager

class BaseAnalyzer:
    def __init__(self, module: str, system_prompt_path: str):
        self.module = module
        self.bedrock = client("bedrock-runtime")
        self.memory = SessionManager.get(module=module)

        # 시스템 prompt 로딩 (한 번만 — Bedrock prompt cache 적용)
        with open(system_prompt_path) as f:
            self.system_prompt = f.read()

    async def analyze(self, user_message: str, context: dict, tenant_id: str, user_id: str):
        # AgentCore Memory 에서 대화 이력 로딩
        history = await self.memory.get_messages(tenant_id, user_id, self.module)

        messages = history + [{"role": "user", "content": user_message}]

        response = self.bedrock.converse(
            modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
            system=[{"text": self.system_prompt, "cachePoint": {"type": "default"}}],   # ★ Prompt cache
            messages=messages,
            inferenceConfig={"maxTokens": 4096, "temperature": 0.3}
        )

        ai_text = response["output"]["message"]["content"][0]["text"]

        # 대화 이력 저장
        await self.memory.append(tenant_id, user_id, self.module,
                                  user_message, ai_text)

        return ai_text
```

### 2.5 Frontend 통합 (`ChatWidget`)

```jsx
// components/ChatWidget.js
import { useChat } from "./useChat";

const ChatWidget = ({ open, onClose, module }) => {  // module: "BF" / "IP" / "DP" / ...
  const { messages, sendMessage, loading } = useChat(module);

  return (
    <Drawer open={open} onClose={onClose}>
      {messages.map((m) => <MessageBubble key={m.id} role={m.role} content={m.content} />)}
      <InputBox onSend={sendMessage} disabled={loading} />
    </Drawer>
  );
};
```

```js
// components/useChat.js
import { useState } from "react";
import aiAgentService from "@plannel/services/system/ai-agent-service";

export const useChat = (module) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    const res = await aiAgentService.chat({ module, message: text });
    setMessages((prev) => [...prev, { role: "assistant", content: res.data.text }]);
    setLoading(false);
  };

  return { messages, sendMessage, loading };
};
```

```js
// services/system/ai-agent-service.js
import restApi from "@plannel/services/utils/rest-api";

const chat = (params) => restApi.post("/api/ai-agent/chat", params);
const recommendScenario = (params) => restApi.post("/api/ai-agent/scenario/recommend", params);

export default { chat, recommendScenario };
```

### 2.6 시나리오 자동 추천 (IP 예시)

```
1. 사용자가 IP 화면에서 "AI 시나리오 추천" 클릭
   ↓
2. Frontend → POST /api/ai-agent/scenario/recommend
        body: { module: "IP", versionId, currentSettings }
   ↓
3. saas-ai-agent 의 IpScenarioGenerator:
   ├─ 현재 settings 분석 → variation 생성 (안전재고 정책 / 서비스 레벨 / 분류 기준 변경 등)
   ├─ 5~10개 시나리오 생성
   └─ 각 시나리오를 saas-application 의 IP 엔진에 시뮬레이션 요청
   ↓
4. IP 엔진 실행 (각 시나리오 병렬) → 결과 (재고/서비스레벨/비용)
   ↓
5. IpScenarioRanker (Bedrock Claude):
   ├─ 결과 dataset 을 LLM 에 입력
   ├─ business goal 에 따라 순위 매김 (재고 최소화 / 서비스레벨 최대화 / 비용 최소화 등)
   └─ 추천 시나리오 + 이유 텍스트 응답
   ↓
6. Frontend 가 추천 시나리오 시각화 + "이 시나리오 적용" 버튼 노출
```

---

## 3. 두 모듈의 차이

| | saas-ai | saas-ai-agent |
|---|---|---|
| 목적 | 수요 예측 (시계열 모델 학습/추론) | 챗봇 분석 + 시나리오 추천 |
| 모델 | ARIMA / Prophet / DeepAR / LightGBM (자체 학습) | AWS Bedrock Claude 3.5 (외부 LLM) |
| 인프라 | AWS EC2 동적 생성 (Terraform) | AgentCore Runtime (AWS 배포) |
| 호출 빈도 | 가끔 (사용자가 명시 실행) | 자주 (대화형) |
| 결과 저장 | `z_bf_*` 테이블 | `z_ai_chat_history` (대화) + `z_ai_scenario` (시나리오) |
| Frontend | BF 화면의 "실행" 버튼 | 우하단 ChatWidget + 모듈별 "AI 추천" 버튼 |

## 4. Frontend 가 신경 쓸 것

### 4.1 BF 결과 표시 화면
- `z_bf_result` 의 결과를 polling 또는 WebSocket 으로 가져오기
- run status (`z_bf_run_history.status`) — `RUNNING` / `COMPLETED` / `FAILED` 별 UI 분기
- 모델 비교 (`z_bf_leaderboard`) — top-3 모델 제시

### 4.2 ChatWidget 통합
- 모든 페이지에 우하단 floating button 으로 노출
- 현재 화면의 module (`BF` / `IP` / `DP` / `RP` / `MP`) 자동 감지 (TabMenuList.js 의 lv1MenuList key 또는 lv2)
- 사용자별 대화 이력은 saas-ai-agent 의 AgentCore Memory 가 자동 영속

### 4.3 시나리오 추천 UI
- IP/DP/RP/MP 모듈 화면에 "AI 추천" 버튼
- 추천 시나리오 + 이유 텍스트 + "적용" 버튼
- 추천된 시나리오를 현재 화면 form 에 자동 채우기 (사용자가 수정 후 실제 실행)

## 5. Anti-patterns

| ❌ | ✅ |
|---|---|
| Frontend 가 saas-ai 또는 saas-ai-agent 에 **직접 호출** | 모든 호출은 `saas-application` 통과 — 인증/권한/멀티테넌트 일관 |
| 챗봇 응답을 frontend 에서 markdown 그대로 dangerouslySetInnerHTML | XSS 방지 위해 `react-markdown` 등 안전 렌더러 |
| BF 실행 status polling 간격 1초 미만 | 5~10초 권장 (EC2 provisioning 자체가 분 단위) |
| AI 추천 시나리오를 사용자 확인 없이 자동 적용 | 항상 사용자가 검토 후 "적용" 버튼 클릭 |
| AgentCore Memory 의 대화 이력에 비밀번호 / 토큰 / 개인정보 저장 | 민감 정보는 prompt 에 절대 포함 금지 (사용자 입력에서 sanitize) |
| 한 모듈의 분석기 (`BfAnalyzer`) 가 다른 모듈 (`IpAnalyzer`) 호출 | 각 분석기는 독립 — 통합 흐름은 별도 orchestrator |
| Bedrock 호출 비용 무시 — 모든 사용자 입력에 cache 없이 system prompt 매번 전송 | `cachePoint` 적용 + 시스템 prompt 변경 최소화 |
| BF Hop pipeline 결과를 saas-application 거치지 않고 frontend 에 직접 push | RDS 의 `z_bf_result` 만 진실. polling 또는 WebSocket via saas-application |

## 6. 신규 AI 통합 시 (Frontend 화면 작성자용)

대부분 frontend 작성자는 다음만 신경 쓰면 됨:

1. **AI 결과를 표시하는 화면** — 일반 데이터 화면처럼 service.getAll(params) 패턴
2. **ChatWidget 통합** — 이미 글로벌 레이아웃에 있음. module 자동 감지
3. **AI 추천 버튼** — `aiAgentService.recommendScenario({ module, ... })` 호출 + 응답 시각화

신규 AI 기능 추가 (analyzer / scenario) 는 **Python 백엔드 작업** — 별도 사양서 + 모델 prompt + 테스트 필요.
