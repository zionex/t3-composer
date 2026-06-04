#!/bin/sh
set -e

if [ "${LLM_BACKEND}" = "cli" ]; then
  if claude --version > /dev/null 2>&1; then
    echo "[entrypoint] claude CLI ready ($(claude --version 2>&1 | head -1))"
    if [ ! -d /root/.claude ] || [ -z "$(ls -A /root/.claude 2>/dev/null)" ]; then
      echo "[entrypoint] WARN: /root/.claude 비어있음 — 호스트에서 'claude /login' 실행 후 재기동 필요"
    else
      echo "[entrypoint] /root/.claude 마운트 확인 (호스트 ~/.claude 재사용 중)"
    fi
  else
    echo "[entrypoint] ERROR: claude CLI 를 찾을 수 없음 (LLM_BACKEND=cli)"
    exit 1
  fi
else
  echo "[entrypoint] LLM_BACKEND=${LLM_BACKEND:-api} (default api)"
fi

exec mvn -B -DskipTests spring-boot:run -Dspring-boot.run.jvmArguments="${JAVA_OPTS}"
