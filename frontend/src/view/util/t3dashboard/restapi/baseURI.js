/**
 * insight-neo 백엔드 Base URL.
 *
 * 우선순위:
 *   1) window.__INSIGHT_API_BASE__  — 런타임에 호스트 페이지가 동적으로 override 한 경우
 *   2) process.env.INSIGHT_API_BASE — webpack DefinePlugin 이 빌드 시점에 literal 로 정적 치환
 *   3) 'http://localhost:9160'      — 최종 fallback
 *
 * ※ 2 가 필요한 이유: serviceCall.js 의 `axios.create({ baseURL: baseURI() })` 가
 *   모듈 평가 시점에 한 번 실행된다. ES module import hoisting 때문에 이 시점은
 *   index.jsx 가 window.__INSIGHT_API_BASE__ 를 set 하는 시점보다 앞선다.
 *   window 폴백만 의지하면 항상 'http://localhost:9160' 로 설정된다.
 */
export function baseURI() {
  if (typeof window !== 'undefined' && window.__INSIGHT_API_BASE__) {
    return window.__INSIGHT_API_BASE__;
  }
  return process.env.INSIGHT_API_BASE || 'http://localhost:9160';
}
