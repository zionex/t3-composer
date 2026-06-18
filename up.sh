#!/bin/bash
# =============================================================================
# T3Composer 부팅 wrapper — `docker compose up -d` 호출 전에 .env 자동 준비.
#
# docker-compose 는 `.env` 를 컨테이너 기동 전에 읽어 ${VAR} 치환을 한다.
# 따라서 .env 가 없으면 모든 ${ANTHROPIC_API_KEY} 류가 빈 값으로 치환되어
# 경고가 쏟아지고 일부 기능이 동작하지 않는다. 첫 부팅 사용자 편의를 위해
# 이 스크립트가 .env.example 을 자동 복사해준다.
#
# 사용:
#   ./up.sh                  # = docker compose up -d
#   ./up.sh --build          # 추가 인자는 그대로 docker compose 로 전달
#   ./up.sh composer-backend # 특정 서비스만
#
# Windows PowerShell 사용자는 up.ps1 사용.
# =============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f .env ]; then
    if [ ! -f .env.example ]; then
        echo "[up] ERROR: .env 도 .env.example 도 없습니다. 레포 루트인지 확인하세요." >&2
        exit 1
    fi
    cp .env.example .env
    echo "[up] .env 가 없어서 .env.example 에서 자동 복사했습니다."
    echo "[up] ★ 다음 값은 직접 채워야 동작합니다 (편집기로 .env 열어 수정):"
    echo "[up]   · ANTHROPIC_API_KEY            — LLM 호출 (없으면 자연어 생성 비활성)"
    echo "[up]   · COMPOSER_SNAPSHOT_SECRET_KEY — 스냅샷 시크릿 암호화 마스터키 (임의 충분히 긴 문자열)"
    echo "[up]   · TARGET_T3SERIES_PATH 등      — 산출물 적용 대상 wingui 트리 절대경로"
    echo "[up] 미입력 항목이 있어도 부팅은 진행됩니다 (해당 기능만 비활성)."
    echo
fi

exec docker compose up -d "$@"
