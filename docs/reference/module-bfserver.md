# t3series-bfserver

> AI/ML **Baseline Forecasting** 서버 — Python 기반. T3 Series Maven 모듈 **아님**(루트 pom.xml `<modules>` 에 포함되지 않음). 독립된 Python 프로젝트로 관리.

## 1. 모듈 개요

| 항목 | 값 |
|------|-----|
| 루트 경로 | `C:\Project\t3series\t3series-bfserver\` |
| 타입 | Python 애플리케이션 (Flask 기반) |
| 배포 타깃 | **Linux 전용** (README에 명시) |
| 권장 사양 | 20+ CPU cores, 32+ GB RAM |
| 역할 | T3SmartSCM 공급망 최적화용 시계열 수요예측 서버. 다중 알고리즘 기반 baseline forecasting. |
| 성능 기준 | 20코어 · 32GB 장비에서 1,000 시계열 예측 시 약 1시간 |
| DB 지원 | Oracle (cx-Oracle, pyodbc), MS SQL Server (pyodbc) |

## 2. 기술 스택 요약

- **언어**: Python **3.9** (conda 가상환경, `conda create -n t3series python=3.9`)
- **웹 프레임워크**: Flask 3.0.0 + Flask-CORS 4.0.0 + Flask-Compress 1.14
- **WSGI 서버**: Waitress 2.1.2
- **DB 접근**: SQLAlchemy 2.0.23, pyodbc 5.0.1, cx-Oracle 8.3.0
- **ML 프레임워크**: LightGBM 3.3.5, Bayesian Optimization 1.5.1, sentence-transformers 3.3.0
- **수치/성능**: NumPy 1.26.4, Numba 0.60.0, llvmlite 0.43.0
- **한국어 NLP**: KoNLPy 0.6.0, kss 6.0.4, langdetect 1.0.9
- **스케줄러**: APScheduler 3.10.4, schedule 1.2.2
- **인프라**: Terraform (AWS + Azure), Ray (분산 클러스터)
- **내부 ML 라이브러리**: `zionexar-1.6.0-py3-none-any.whl` (별도 설치)

## 3. 디렉터리 구조

```
t3series-bfserver/
├── README.md
├── BF_SCALE_OUT_PERF_TEST.md
├── HOW_TO_CONNECT_TO_ORACLE.md
├── HOW_TO_SETUP_ENV_FOR_BFSERVER.md
├── src/
│   ├── requirements.txt          ← 의존성 명세
│   ├── setup.py                  ← 패키지: zionex-bf v1.0
│   ├── t3core/                   ← 예측 엔진 구현
│   └── t3main/                   ← Flask API 엔드포인트
├── bin/                          ← 운영 스크립트
│   ├── Linux/Windows 서비스 인스톨러
│   ├── Ray 클러스터 관리
│   └── 환경 셋업 스크립트
├── terraform/
│   ├── aws/                      (main.tf, variables.tf)
│   ├── azure/                    (main.tf, variables.tf)
│   └── MULTIPLE_MACHINE_SETTING.md
├── local_model/                  ← 사전학습 모델 (safetensors)
├── images/                       ← 문서 이미지
└── zionexar-1.6.0-py3-none-any.whl   ← 내부 ML 패키지 (~435MB)
```

## 4. 의존성 (`src/requirements.txt`)

### 웹 / 서버
```
flask           3.0.0
flask-cors      4.0.0
flask-compress  1.14
waitress        2.1.2
```

### 데이터베이스
```
pyodbc          5.0.1
cx-Oracle       8.3.0
sqlalchemy      2.0.23
```

### ML / 최적화
```
lightgbm                    3.3.5
bayesian-optimization       1.5.1
sentence-transformers       3.3.0
```

### 과학계산
```
numpy           1.26.4
numba           0.60.0
llvmlite        0.43.0
```

### 한국어/NLP
```
konlpy          0.6.0
kss             6.0.4
langdetect      1.0.9
```

### 스케줄링
```
apscheduler     3.10.4
schedule        1.2.2
```

### 유틸 / 설정
```
pyyaml          6.0
getmac          0.9.4
```

### 보안 / XML
```
pyopenssl       24.1.0
defusedxml      0.7.1
```

### 웹 스크래핑 / 데이터
```
bs4             0.0.1
lxml            4.9.3
pytrends        4.9.2
```

### 인프라 코드
```
python_terraform    0.10.1
```

### 플랫폼별
```
pywin32         227       (Windows 전용)
lz4             4.3.2     (Linux 전용)
```

## 5. `setup.py`

- 패키지 명: `zionex-bf`
- 버전: `1.0`
- `requirements.txt` 를 동적으로 로드
- YAML 설정 파일을 패키지에 포함

## 6. 내부 ML 라이브러리

**`zionexar-1.6.0-py3-none-any.whl`** — Zionex 자체 forecasting 알고리즘 라이브러리 (약 435MB). base requirements 설치 후 **별도 설치** 필요. 배포 경로는 GitHub releases 또는 T3SmartSCM 배포 zip.

## 7. 로컬 모델 (`local_model/`)

- **모델**: `jhgan/ko-sroberta-multitask` (한국어 RoBERTa 기반 sentence embedding)
- **차원**: 768
- **형식**: safetensors (5-shard 분할, 총 ~383MB)
- **토크나이저**: 한국어 토크나이저 config 포함
- **용도**: NLP 기반 수요 신호 처리(유사 상품/설명 매칭 등)

## 8. 인프라 (`terraform/`)

### AWS
| 항목 | 값 |
|------|-----|
| Provider | `hashicorp/aws ~> 3.27` |
| Terraform | `>= 0.14.9` |
| 리소스 | EC2 (ray-head, ray-worker) |

### Azure
| 항목 | 값 |
|------|-----|
| Provider | `hashicorp/azurerm ~> 2.65` |
| Terraform | `>= 1.0` |
| 리소스 | VM, 네트워크, 시큐리티 그룹 |

> 두 클라우드 모두 **Ray** 기반 분산 예측 클러스터 배포 지원.

## 9. 컨테이너화

**Dockerfile 없음.** 배포는 Linux 호스트에서 직접 Python 실행 (`bin/` 내 bash 스크립트 기반 서비스 등록).

## 10. 타 모듈과의 차이 / 특이점

- **Java 스택 전혀 없음** — Maven 빌드 대상이 아니며 pom.xml 에서 참조되지 않음.
- **Linux 전용 배포** — Windows 환경은 개발용 pywin32 지원만.
- **멀티 클라우드 IaC** — 프로젝트 내 유일하게 Terraform 으로 AWS/Azure 이중 배포를 지원.
- **한국어 NLP 파이프라인 내장** (KoNLPy + kss + RoBERTa 임베딩) — 국내 고객사 대응.
- **내부 상용 라이브러리(zionexar)** 의존 — 오픈소스 라이브러리만으로는 빌드 불가, 별도 whl 필요.
- **스케줄링은 APScheduler** 사용 — 자바 쪽 Quartz 와 독립적으로 운영.
- **모든 DB 통신은 Python 드라이버** (pyodbc / cx-Oracle) — Spring Boot 풀과 공유하지 않음.
