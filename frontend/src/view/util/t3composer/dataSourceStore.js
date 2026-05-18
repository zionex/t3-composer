import { create } from 'zustand';

import { listSchemaTables, listSchemaProcedures, getSchemaGraph } from './api';

/**
 * Data Source 별자리 맵 — Target DB 의 테이블/SP 목록·도메인 그래프 캐시.
 *
 * 다이얼로그를 닫았다 다시 열어도 재조회하지 않도록 targetCd 별로 보관.
 * 백엔드도 10분 TTL 캐시를 하지만, 여기서 한 번 더 캐시해 네트워크 왕복을 줄인다.
 */
export const useDataSourceStore = create((set, get) => ({
  /** { [targetCd]: { connected, tables[], procedures[], loaded, loading, error } } */
  catalogs: {},
  /** { [`${targetCd}::${DOMAIN}`]: { nodes[], edges[], dependencyGraphAvailable, loading, error } } */
  graphs: {},

  /** 전체 테이블/SP 목록 로드 (캐시 우선). */
  loadCatalog: async (targetCd) => {
    const key = targetCd || '__none__';
    const cur = get().catalogs[key];
    if (cur && (cur.loaded || cur.loading)) return cur;

    set((s) => ({ catalogs: { ...s.catalogs, [key]: { ...(cur || {}), loading: true, error: null } } }));
    try {
      const [tRes, pRes] = await Promise.all([
        listSchemaTables(targetCd),
        listSchemaProcedures(targetCd),
      ]);
      const tables = Array.isArray(tRes?.data?.tables) ? tRes.data.tables : [];
      const procedures = Array.isArray(pRes?.data?.procedures) ? pRes.data.procedures : [];
      const connected = !!(tRes?.data?.connected || pRes?.data?.connected);
      const entry = { connected, tables, procedures, loaded: true, loading: false, error: null };
      set((s) => ({ catalogs: { ...s.catalogs, [key]: entry } }));
      return entry;
    } catch (e) {
      const entry = {
        connected: false, tables: [], procedures: [], loaded: true, loading: false,
        error: e?.response?.data?.message || e?.message || '목록 조회 실패',
      };
      set((s) => ({ catalogs: { ...s.catalogs, [key]: entry } }));
      return entry;
    }
  },

  /** 한 도메인의 서브 그래프 로드 (캐시 우선). */
  loadGraph: async (targetCd, domain) => {
    const gkey = `${targetCd || '__none__'}::${domain}`;
    const cur = get().graphs[gkey];
    if (cur && !cur.loading) return cur;

    set((s) => ({ graphs: { ...s.graphs, [gkey]: { nodes: [], edges: [], loading: true } } }));
    try {
      const res = await getSchemaGraph(targetCd, domain);
      const d = res?.data || {};
      const graph = {
        nodes: Array.isArray(d.nodes) ? d.nodes : [],
        edges: Array.isArray(d.edges) ? d.edges : [],
        dependencyGraphAvailable: !!d.dependencyGraphAvailable,
        loading: false,
      };
      set((s) => ({ graphs: { ...s.graphs, [gkey]: graph } }));
      return graph;
    } catch (e) {
      const graph = {
        nodes: [], edges: [], dependencyGraphAvailable: false, loading: false,
        error: e?.message || '그래프 조회 실패',
      };
      set((s) => ({ graphs: { ...s.graphs, [gkey]: graph } }));
      return graph;
    }
  },

  /** targetCd 변경 등으로 캐시 무효화. */
  reset: () => set({ catalogs: {}, graphs: {} }),
}));
