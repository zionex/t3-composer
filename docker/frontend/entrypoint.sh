#!/bin/sh
# T3Composer Frontend entrypoint — 부모 t3series 의 realgrid + 일부 의존을 자동 복사
# (docker volume 의 익명 /app/node_modules 안에 부모와 동일한 패키지 배치)
set -e

WINGUI_REF="/workspace/wingui"
REALGRID_SRC="${WINGUI_REF}/packages/node_modules/realgrid"
REALGRID_DST="/app/node_modules/realgrid"

# realgrid 는 익명 volume (/app/node_modules) 안에서 종종 사라진다 — npm install 등으로
# node_modules 가 재구성되면 익명 layer 가 우선해 부모 사본만 빠지는 사고.
# `! -d target` 한 번만 가드하지 않고 핵심 파일 누락 시 매 startup 재복사 (idempotent).
if [ -d "${REALGRID_SRC}" ]; then
  if [ ! -f "${REALGRID_DST}/dist/main.esm.js" ] \
     || [ ! -f "${REALGRID_DST}/dist/realgrid-sky-blue.css" ]; then
    echo "[entrypoint] realgrid 복원: ${REALGRID_SRC} → ${REALGRID_DST}"
    rm -rf "${REALGRID_DST}"
    cp -r "${REALGRID_SRC}" "${REALGRID_DST}"
  fi
fi

exec "$@"
