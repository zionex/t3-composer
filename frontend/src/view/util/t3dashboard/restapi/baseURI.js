/**
 * insight-neo 백엔드 Base URL.
 * webpack.config.js → index.jsx 에서 window.__INSIGHT_API_BASE__ 로 주입됨.
 * 기본값: http://localhost:9160
 */
export function baseURI() {
  return (typeof window !== 'undefined' && window.__INSIGHT_API_BASE__)
    ? window.__INSIGHT_API_BASE__
    : 'http://localhost:9160';
}
