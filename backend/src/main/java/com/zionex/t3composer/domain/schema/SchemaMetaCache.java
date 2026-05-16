package com.zionex.t3composer.domain.schema;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Target DB 의 테이블/SP 목록·도메인 그래프 메타를 targetCd 별로 캐시.
 *
 * 800+ 테이블 / 965 SP 목록은 자주 바뀌지 않으므로 TTL 10분 캐시.
 * Spring Cache / Caffeine 미설치 — {@link TargetDataSourceRegistry} 의 negative-cache 와
 * 동일하게 timestamp 를 가진 ConcurrentHashMap 사용.
 *
 * key 규약: "&lt;targetCd&gt;::tables" · "&lt;targetCd&gt;::procs" · "&lt;targetCd&gt;::graph::&lt;DOMAIN&gt;"
 * Target DB 연결정보가 바뀌면 {@link #evict(String)} 로 해당 target 전체 제거.
 */
@Component
public class SchemaMetaCache {

    private static final long TTL_MS = 10 * 60 * 1000L;

    private record Entry(Object value, long createdAt) {}

    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();

    public static String tablesKey(String targetCd)              { return targetCd + "::tables"; }
    public static String proceduresKey(String targetCd)          { return targetCd + "::procs"; }
    public static String graphKey(String targetCd, String domain) { return targetCd + "::graph::" + domain; }

    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        if (key == null) return null;
        Entry e = store.get(key);
        if (e == null) return null;
        if (System.currentTimeMillis() - e.createdAt() > TTL_MS) {
            store.remove(key);
            return null;
        }
        return (T) e.value();
    }

    public void put(String key, Object value) {
        if (key == null || value == null) return;
        store.put(key, new Entry(value, System.currentTimeMillis()));
    }

    /** 한 target 의 모든 캐시 항목 제거 — DB 연결정보 변경 시 호출. */
    public void evict(String targetCd) {
        if (targetCd == null) return;
        store.keySet().removeIf(k -> k.equals(targetCd) || k.startsWith(targetCd + "::"));
    }
}
