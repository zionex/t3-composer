#!/usr/bin/env node
/**
 * build-standalone-guide.cjs
 *
 * 가이드 HTML 의 `src="img/..."` 이미지를 base64 data URI 로 인라인해
 * **파일 하나로 완결되는 배포용 사본**을 만든다.
 *
 *   원본  frontend/public/T3Composer-Beginner-Guide.html + frontend/public/img/*.png
 *   출력  frontend/public/T3Composer-Beginner-Guide-standalone.html  (원본과 같은 위치)
 *
 * 사용:
 *   node scripts/build-standalone-guide.cjs            # 전체
 *   node scripts/build-standalone-guide.cjs beginner   # 초심자 가이드만
 *
 * ⚠️ 원본 가이드를 수정하면 반드시 다시 실행할 것 — 사본은 자동 갱신되지 않는다.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'frontend', 'public');
// 출력은 원본 가이드와 같은 폴더 — 배포 시 한 곳에서 찾을 수 있도록.
const OUT_DIR = SRC_DIR;

const GUIDES = [
  { key: 'beginner', file: 'T3Composer-Beginner-Guide.html' },
  { key: 'user', file: 'T3Composer-User-Guide.html' },
];

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const BANNER = (file) => `<!--
  ⚠️ 자동 생성 파일 — 직접 수정하지 마세요.
     원본: frontend/public/${file}
     생성: node scripts/build-standalone-guide.cjs
     이미지가 base64 로 내장된 배포용 사본입니다 (파일 하나만 전달하면 됩니다).
-->
`;

function humanSize(bytes) {
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

function build(guide) {
  const srcPath = path.join(SRC_DIR, guide.file);
  if (!fs.existsSync(srcPath)) {
    console.log(`  [skip] ${guide.file} — 원본 없음`);
    return null;
  }

  let html = fs.readFileSync(srcPath, 'utf8');
  const srcBytes = Buffer.byteLength(html);

  const missing = [];
  let inlined = 0;

  // src="img/xxx.png"  또는  src="/img/xxx.png"
  html = html.replace(/src="\/?img\/([^"]+)"/g, (whole, rel) => {
    const imgPath = path.join(SRC_DIR, 'img', rel);
    if (!fs.existsSync(imgPath)) {
      missing.push(rel);
      return whole;
    }
    const mime = MIME[path.extname(rel).toLowerCase()];
    if (!mime) {
      missing.push(`${rel} (지원하지 않는 확장자)`);
      return whole;
    }
    inlined += 1;
    return `src="data:${mime};base64,${fs.readFileSync(imgPath).toString('base64')}"`;
  });

  if (inlined === 0) {
    console.log(`  [skip] ${guide.file} — 인라인할 이미지 없음`);
    return null;
  }

  const outName = guide.file.replace(/\.html$/, '-standalone.html');
  const outPath = path.join(OUT_DIR, outName);
  // 출력과 원본이 같은 폴더이므로 자기 자신을 덮어쓰지 않는지 방어
  if (path.resolve(outPath) === path.resolve(srcPath)) {
    console.error(`  [fail] ${guide.file} — 출력 경로가 원본과 동일합니다.`);
    process.exit(1);
  }
  const out = BANNER(guide.file) + html;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');

  console.log(`  [ok]   ${outName}`);
  console.log(`         이미지 ${inlined}개 인라인 · ${humanSize(srcBytes)} → ${humanSize(Buffer.byteLength(out))}`);
  if (missing.length) {
    console.log(`         ⚠️ 누락 ${missing.length}개: ${missing.join(', ')}`);
  }
  return { outPath, inlined, missing };
}

function main() {
  const only = process.argv[2];
  const targets = only ? GUIDES.filter((g) => g.key === only) : GUIDES;

  if (targets.length === 0) {
    console.error(`알 수 없는 대상: ${only} (가능: ${GUIDES.map((g) => g.key).join(' · ')})`);
    process.exit(1);
  }

  console.log('배포용 단일 파일 생성 —');
  const results = targets.map(build).filter(Boolean);

  const failed = results.filter((r) => r.missing.length > 0);
  if (failed.length) {
    console.error('\n❌ 일부 이미지를 찾지 못했습니다. 위 목록을 확인하세요.');
    process.exit(1);
  }
  console.log(`\n완료 — ${results.length}개 생성. 이 파일 하나만 전달하면 됩니다.`);
}

main();
