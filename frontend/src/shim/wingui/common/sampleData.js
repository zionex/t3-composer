// =============================================================================
// sampleData — Composer 화면 실행 시 빈 응답에 휴리스틱 sample 자동 주입.
// =============================================================================
// `window.__composerSampleData === true` 일 때만 동작. CheckBox 가 toggle.
//
// 사용처:
//   - BaseGrid.dataProvider.fillJsonData(arr) — arr 가 빈 배열이면 sample rows
//   - zAxios response interceptor — Array 응답이 빈 경우 차트/카드용 sample
//
// 설계 원칙:
//   1) 산출물 jsx 는 자유 형식 — 어떤 필드명을 access 할지 사전에 모름
//   2) Proxy 로 KPI object / 차트 row 를 감싸 — 어떤 prop access 도 의미 있는 값 반환
//   3) 컬럼명 키워드 (forecastQty / actualQty / planQty / amt / pct / dt 등) 매칭
//   4) 결정론적 난수 — i 인덱스 + key 길이 기반. 새로고침해도 같은 값
// =============================================================================

const ITEM_KEYWORDS = ['LED Module', 'Sensor Unit', 'PCB Assy', 'Power Pack',
                       'Display Panel', 'Motor Core', 'Connector', 'Battery Cell',
                       'Cable Set', 'Heat Sink', 'Resistor Pack', 'Capacitor'];

const ACCOUNT_KEYWORDS = ['Samsung Electronics', 'LG Display', 'SK Hynix', 'Hyundai Mobis',
                          'POSCO', 'Naver', 'Kakao', 'Coupang', 'KT', 'Hanwha',
                          'Doosan', 'CJ Logistics'];

const LOCATION_KEYWORDS = ['Seoul Plant', 'Suwon DC', 'Busan Hub', 'Incheon Port',
                           'Daegu Center', 'Gwangju Factory', 'Daejeon Whse', 'Ulsan Yard'];

const DEPT_KEYWORDS = ['영업1팀', '영업2팀', '구매팀', '생산팀', '품질팀', '재무팀', 'IT팀', '인사팀',
                       '물류팀', '기획팀', 'R&D팀'];

const POSITION_KEYWORDS = ['사원', '대리', '과장', '차장', '부장', '이사', '상무', '전무'];

const STATUS_KEYWORDS = ['NEW', 'ACTIVE', 'PROGRESS', 'COMPLETED', 'CANCELLED', 'PENDING', 'APPROVED'];

const KO_NOUNS = ['제품', '품목', '계정', '거점', '센터', '라인', '공정', '자재',
                  '예측', '계획', '실적', '재고', '주문', '생산', '판매', '발주'];

// ─── 결정론적 난수 ─────────────────────────────────────────────
function det(i, salt = 0) {
    const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function detFromKey(key, seed = 0) {
    let h = seed;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0x7fffffff;
    return det(seed, h);
}

function pickFrom(arr, i, salt = 0) {
    return arr[Math.floor(det(i, salt) * arr.length) % arr.length];
}

function pad(n, w = 3) {
    return String(n).padStart(w, '0');
}

function isoDate(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

function isoDateTime(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

function yearMonth(monthsAgo) {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return d.toISOString().slice(0, 7);   // YYYY-MM
}

// ─── 키 기반 값 추론 ─────────────────────────────────────────────
// 산출물이 어떤 필드명을 access 하든 키워드 의미로 적절한 값 반환.
// 가장 구체적인 키워드부터 매칭 (e.g. `forecastQty` 는 forecast + qty 둘 다 매칭됨).
function inferValueForKey(key, seed = 0) {
    if (key == null) return undefined;
    const k = String(key).toLowerCase();
    const rand = detFromKey(k, seed);

    // ── boolean
    if (/^(is|has|use|enable|active)/.test(k) || /yn$/.test(k)) {
        return /yn$/.test(k) ? (rand > 0.3 ? 'Y' : 'N') : (rand > 0.3);
    }

    // ── 시간 / 날짜
    if (/dttm$|datetime/.test(k)) return isoDateTime(seed * 3);
    if (/^date$|dt$|date$|day$|created|modified|registered|approved|confirmed/.test(k)) {
        return isoDate(seed * 3 + Math.floor(rand * 7));
    }
    if (/ym$|month$|yearmonth/.test(k)) return yearMonth(11 - seed);
    if (/year$|yr$/.test(k)) return new Date().getFullYear() - Math.floor(rand * 3);
    if (/week|wk/.test(k)) return `W${pad(Math.floor(rand * 52) + 1, 2)}`;

    // ── 수치 (구체적 도메인 키워드 먼저)
    if (/pct|rate|ratio|percent|accuracy|achiev|growth/.test(k)) {
        // 0.0 ~ 100.0 — 정확도/달성률은 70~100 범위가 자연스러움
        const lo = /accuracy|achiev/.test(k) ? 70 : 0;
        const hi = 100;
        return Math.round((lo + rand * (hi - lo)) * 10) / 10;
    }
    if (/amt|amount|price|cost|revenue|sales|won|usd|krw|budget/.test(k)) {
        return Math.round(rand * 10_000_000) * 100;   // 천 ~ 십억 단위
    }
    if (/forecast|actual|plan|target|capacity|stock|inventory|qty|cnt|count|num|order|demand|supply|production/.test(k)) {
        return Math.round(rand * 9000) + 1000;        // 1,000 ~ 10,000
    }
    if (/avg|average|mean/.test(k))    return Math.round(rand * 1000 * 100) / 100;
    if (/min|max|total|sum/.test(k))   return Math.round(rand * 100_000);
    if (/seq|order|sort|priority|level|rank|step/.test(k)) return seed + 1;

    // ── 식별자 / 코드 (이름이 nm/name 으로 끝나지 않는 *_cd / *_id)
    if (/email|mail/.test(k))       return `user${pad(seed + 1)}@example.com`;
    if (/tel|phone|mobile/.test(k)) return `010-${pad(1000 + seed, 4)}-${pad(seed * 7 + 100, 4)}`;
    if (/dept/.test(k) && /nm|name|title/.test(k)) return pickFrom(DEPT_KEYWORDS, seed);
    if (/dept/.test(k))                       return `D${pad(seed + 1)}`;
    if (/position|posit|grade|rank/.test(k) && /nm|name|title/.test(k))
        return pickFrom(POSITION_KEYWORDS, seed);
    if (/position|posit/.test(k))             return `P${pad(seed + 1)}`;
    if (/item/.test(k) && /nm|name|desc|title/.test(k))
        return `${pickFrom(ITEM_KEYWORDS, seed)} ${pad(seed + 1)}`;
    if (/item/.test(k) && /cd|code|id/.test(k)) return `ITM-${pad(seed + 1)}`;
    if (/account|acct|customer|client|vendor/.test(k) && /nm|name|title/.test(k))
        return pickFrom(ACCOUNT_KEYWORDS, seed);
    if (/account|acct|customer|client|vendor/.test(k)) return `ACC-${pad(seed + 1)}`;
    if (/locat|loc|site|plant|warehouse|whse|center|hub/.test(k) && /nm|name|title/.test(k))
        return pickFrom(LOCATION_KEYWORDS, seed);
    if (/locat|loc|site|plant|warehouse|whse|center|hub/.test(k)) return `LOC-${pad(seed + 1)}`;
    if (/user/.test(k) && /nm|name|title/.test(k)) return `사용자 ${pad(seed + 1)}`;
    if (/user/.test(k) && /id|cd/.test(k))         return `user${pad(seed + 1)}`;
    if (/ver|version/.test(k))      return `V${pad(seed + 1, 2)}`;
    if (/status|state/.test(k))     return pickFrom(STATUS_KEYWORDS, seed);
    if (/channel|chnl/.test(k))     return `CH-${pad(seed + 1)}`;
    if (/group|grp|category|cat/.test(k))   return `G${pad(seed + 1, 2)}`;

    // ── 일반 코드/명 fallback
    if (/cd$|code$|id$|key$/.test(k))   return `${k.replace(/(cd|code|id|key)$/, '').toUpperCase() || 'CD'}-${pad(seed + 1)}`;
    if (/nm$|name$|desc$|remark$|memo$|comment$|title$|label$/.test(k))
        return `${pickFrom(KO_NOUNS, seed)} ${pad(seed + 1)}`;

    // ── 진짜 모르는 키 — 짧고 의미 있게
    // 영어/한글 prefix 우선 추측: 숫자형 → number, 아니면 short text
    if (k.length <= 3) return `${k.toUpperCase()}-${pad(seed + 1)}`;
    return `샘플 ${pad(seed + 1)}`;
}

// ─── Proxy 로 감싼 sample row / object ─────────────────────────────────────────────
// 산출물이 row.foo.bar.baz 처럼 nested access 하지 않는 한 일반 prop access 는
// 모두 inferValueForKey 로 reach.
function wrapAsProxy(seed, base = {}) {
    return new Proxy(base, {
        get(target, prop, receiver) {
            // React/Proxy 내부 access — 명시적으로 undefined
            if (typeof prop === 'symbol') return undefined;
            if (prop === 'then' || prop === '$$typeof' || prop === '_owner'
                || prop === 'constructor' || prop === '__proto__'
                || prop === 'toJSON' || prop === 'nodeType' || prop === 'tagName'
                || prop === 'asymmetricMatch' || prop === '@@toPrimitive') return undefined;
            // base 에 이미 값이 있으면 우선
            if (prop in target) return Reflect.get(target, prop, receiver);
            return inferValueForKey(prop, seed);
        },
        has(target, prop) {
            if (typeof prop === 'symbol') return false;
            return true;   // any prop is "present" — Optional chaining 호환
        },
        ownKeys(target) { return Reflect.ownKeys(target); },
        getOwnPropertyDescriptor(target, prop) {
            return Reflect.getOwnPropertyDescriptor(target, prop);
        },
    });
}

// ─── 그리드 — columns 정의 기반 sample row ─────────────────────────────────────────────
function valueGeneratorFor(col) {
    const name = String(col.name || '');
    // useDropdown values 가 있으면 그 중에서 cycle
    if (col.useDropdown && Array.isArray(col.values) && col.values.length) {
        const vals = col.values;
        const labels = col.labels || vals;
        return (i) => (col.lookupDisplay ? labels[i % labels.length] : vals[i % vals.length]);
    }
    // 그 외 — inferValueForKey 위임. dataType 으로 boolean 등은 명시적 처리
    const dt = String(col.dataType || 'text').toLowerCase();
    if (dt === 'boolean') return (i) => det(i, name.length) > 0.5;
    return (i) => inferValueForKey(name, i);
}

/**
 * gridItems (column 정의 배열) 기준으로 n 행 sample 생성.
 * 컬럼에 정의된 name 으로 값 채움 + Proxy 로 감싸 산출물이 컬럼 외 필드 access 해도 동작.
 */
export function generateSampleRowsFromItems(items, n = 15) {
    if (!Array.isArray(items) || items.length === 0) return [];
    const generators = items
        .filter((c) => c && c.name && !c.iteration)
        .map((c) => ({ name: c.name, gen: valueGeneratorFor(c) }));
    const rows = [];
    for (let i = 0; i < n; i++) {
        const row = {};
        generators.forEach(({ name, gen }) => { row[name] = gen(i); });
        // RealGrid 가 enumerable 키만 사용 — Proxy 로 감싸지 않고 plain object 반환.
        // (그리드는 컬럼명이 fix 되어 있어 Proxy 불필요)
        rows.push(row);
    }
    return rows;
}

// ─── 차트 / 리스트 array — URL 패턴 + Proxy ─────────────────────────────────────────────
/**
 * 차트/리스트용 시계열 sample. URL 키워드 (trend/chart/series/by-date 등) 로 길이 결정.
 * 각 row 는 Proxy — 산출물이 r.forecastQty, r.actualQty, r.salesAmt 등 임의 키 access 해도 동작.
 */
export function generateSampleArrayFromUrl(url, n) {
    const u = String(url || '').toLowerCase();
    const isTimeSeries = /trend|chart|series|history|monthly|weekly|daily|by-?date|by-?month|by-?week/.test(u);
    const len = n || (isTimeSeries ? 12 : 15);

    const rows = [];
    for (let i = 0; i < len; i++) {
        // 시계열인 경우 base 에 date/planYm 미리 채워 — 차트 x축에 자주 쓰임
        const base = isTimeSeries
            ? {
                date:   isoDate((len - 1 - i) * 7),
                planYm: yearMonth(len - 1 - i),
                yearMonth: yearMonth(len - 1 - i),
                month: yearMonth(len - 1 - i),
                week:  `W${pad((len - i), 2)}`,
                seq:   i + 1,
            }
            : { seq: i + 1 };
        rows.push(wrapAsProxy(i, base));
    }
    return rows;
}

// ─── KPI object — Proxy ─────────────────────────────────────────────
/**
 * KPI 카드용 단일 object 응답에 빈 자리 채움. Proxy 라 어떤 필드명도 의미 있는 값 반환.
 *   kpi.forecastQty / kpi.actualQty / kpi.planQty / kpi.salesAmt / kpi.accuracyPct ...
 */
export function generateSampleKpiObject() {
    return wrapAsProxy(0, {});
}

/**
 * window flag 또는 localStorage 가 켜져 있는지 lookup.
 *   부모창에서 toggle 한 sample 모드를 새창(preview)도 공유하도록 localStorage 동기화.
 */
export function isSampleModeEnabled() {
    if (typeof window === 'undefined') return false;
    if (window.__composerSampleData === true) return true;
    try {
        if (window.localStorage && localStorage.getItem('composer.sampleData') === '1') {
            window.__composerSampleData = true;   // 이후 호출 빠르게
            return true;
        }
    } catch (_) { /* no-op */ }
    return false;
}

// 새창 mount 시 부모창의 localStorage 값을 즉시 반영 + 이후 변경도 따라가도록
if (typeof window !== 'undefined') {
    try {
        if (window.localStorage && localStorage.getItem('composer.sampleData') === '1') {
            window.__composerSampleData = true;
        }
    } catch (_) { /* no-op */ }
    window.addEventListener?.('storage', (e) => {
        if (e && e.key === 'composer.sampleData') {
            window.__composerSampleData = e.newValue === '1';
        }
    });
}
