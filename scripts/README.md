# t3-composer/scripts

> T3Series 의 `view/` 디렉토리를 정적 분석해 UI 패턴 카탈로그를 자동 생성하는 Node.js 스크립트.
> 의존성 없음 — `fs` + `path` + 정규식만 사용.

## 스크립트 목록

| 스크립트 | 단계 | 입력 | 출력 |
|---|---|---|---|
| `ui-inventory.cjs` | Phase 1 | `t3series/.../view/**/*.jsx` + `menus.js` | `docs/ui-inventory/{json,csv}` |
| `ui-patterns-gen.cjs` | Phase 2 | `docs/ui-inventory/ui-inventory.json` | `docs/ui-patterns-auto/<module>.md` × 17 |
| `pattern-coverage.cjs` | Phase 3 | DB 시드 + PatternPreview.jsx + ui-inventory.json | `docs/pattern-coverage/{md,json}` |
| `mockup-menu-mapping.cjs` | Phase 4b | `_data/t3smartscm-menus.json` + `docs/ui-inventory/ui-inventory.json` + `t3mockup/index.js` | `_data/t3smartscm-menu-mapping.json` |

## 사용법

```bash
# 1) 인벤토리 (956개 화면 분류)
node scripts/ui-inventory.cjs

# 2) Markdown 카탈로그
node scripts/ui-patterns-gen.cjs

# 3) Cross-check
node scripts/pattern-coverage.cjs

# 4) 운영 메뉴 ↔ mockup 매핑 (Phase 4b)
#    선행: target-mssql 의 운영 메뉴 트리를 _data/t3smartscm-menus.json 으로 미리 추출.
#    아래 명령은 backend 가 살아있는 상태에서 실행:
curl -s "http://localhost:8090/composer/target/menus?lang=ko&target=T3SERIES" | node -e "
  const d = JSON.parse(require('fs').readFileSync(0,'utf8'));
  const flat = [];
  (function walk(arr, parents=[]) {
    for (const it of arr || []) {
      flat.push({menuId:it.id, menuNm:it.displayName, filePath:it.filePath, seq:it.seq, parents:parents.slice()});
      walk(it.items, [...parents, it.displayName || it.id]);
    }
  })(d.items);
  const leafs = flat.filter(n => n.filePath);
  require('fs').writeFileSync('frontend/src/view/util/t3mockup/_data/t3smartscm-menus.json',
    JSON.stringify({source:d.source,total:flat.length,leafs:leafs.length,items:leafs},null,2));
"
node scripts/mockup-menu-mapping.cjs
```

순서대로 실행해야 함 (각 단계의 출력이 다음 단계 입력).

## 경로 결정

스크립트는 **자기 위치**를 인식해 입출력 경로를 자동 결정:

| 스크립트 위치 | 입력 (t3series) | 출력 |
|---|---|---|
| `t3-composer/scripts/` | `../t3series` (형제 폴더 자동 탐색) | `t3-composer/docs/{ui-inventory,ui-patterns-auto,pattern-coverage}/` |
| `t3series/.../scripts/` (원본) | 자기 부모 4단계 위 | `t3series/docs/reference/` |

### 환경변수

t3series 가 형제 폴더가 아니면 명시:

```bash
T3SERIES_ROOT=/path/to/t3series node scripts/ui-inventory.cjs
```

자동 탐색 우선순위 (`resolveSeriesRoot`):
1. `process.env.T3SERIES_ROOT`
2. `../t3series` ← 권장 (t3-composer 와 형제 폴더)
3. `../../t3series`
4. 부모 4단계 위 (t3series 내부 원본 경로 호환)
5. 현재 디렉토리 위

`t3series-wingui` 폴더가 존재하면 매칭.

## 휴리스틱 요약

### Phase 1 분류 우선순위 (가장 위가 우선)
1. **서브 컴포넌트** (`components/` 폴더)
2. **Base 래퍼** (`Base<Name>.jsx`)
3. **위젯** (`/widgets/` 경로)
4. **팝업** (`Pop<Name>.jsx`)
5. **도메인 키워드** (ControlBoard / Monitoring / PlanEdit / RouteLayout) — 파일명·경로·소스
6. **컴포넌트 stack** (BaseGrid 개수 / SplitPanel / TabContainer 등)
7. **catch-all** → `free_form`

### 분류 코드 정규화 (`NORMALIZE` 매핑)
분류기의 `P02_search_grid` → DB 시드의 `search_grid` 처럼 일관된 코드로 변환:

```
P01_widget_dashboard → widget_dashboard
P02_search_grid      → search_grid
P03_search_tabs      → search_tab
P04_tree_grid        → h2_tree_grid
P06_cross_pivot      → pivot_table
v2_chart_grid        → grid_chart_stacked
v2_master_detail     → split_master_detail
cb_master            → cb_master_dashboard
rl_layout            → rl_layout_design
```

메타 카테고리 (`popup`, `widget_*`, `subcomponent`, `base_wrapper`, `free_form`) 는 DB 시드 대상이 아니므로 정규화 매핑 없음.

## 산출물 spot-check

```bash
cd /c/Project/t3-composer

# 인벤토리 행 수 (956±5 이어야 함)
node -e "console.log(require('./docs/ui-inventory/ui-inventory.json').length)"

# 모듈별 화면 수 (Top 10)
node -e "
const r = require('./docs/ui-inventory/ui-inventory.json');
const m = {};
for (const x of r) m[x.moduleCode] = (m[x.moduleCode] || 0) + 1;
Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,v]) => console.log(v.toString().padStart(4), k));
"

# 패턴 빈도 (Top 15)
node -e "
const r = require('./docs/ui-inventory/ui-inventory.json');
const p = {};
for (const x of r) p[x.patternCode] = (p[x.patternCode] || 0) + 1;
Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,v]) => console.log(v.toString().padStart(4), k));
"
```
