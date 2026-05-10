#!/bin/sh
# T3Composer Frontend entrypoint — 부모 t3series 의 realgrid + 일부 의존을 자동 복사
# (docker volume 의 익명 /app/node_modules 안에 부모와 동일한 패키지 배치)
set -e

WINGUI_REF="/workspace/wingui"

if [ -d "${WINGUI_REF}/packages/node_modules/realgrid" ] \
   && [ ! -d "/app/node_modules/realgrid" ]; then
  echo "[entrypoint] realgrid 복사: ${WINGUI_REF}/packages/node_modules/realgrid → /app/node_modules/realgrid"
  cp -r "${WINGUI_REF}/packages/node_modules/realgrid" "/app/node_modules/realgrid"
fi

exec "$@"
