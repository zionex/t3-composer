// =============================================================================
// RealGrid2 license — 부모 t3series-wingui 와 동일 키 (dev 환경 공유)
// =============================================================================
// 부모: t3series-wingui/src/main/resources/profile/local/static/license/realgrid-lic.js
// RealGrid2 는 import 시 window.realGrid2Lic 을 자동 감지하거나
// 명시적 RealGrid.setLicenseKey() 로 등록 가능.
//
// 주의: 이 파일은 RealGrid module 을 import 하지 않는다 — main bundle 에 realgrid 가
// 끌려오면 main window 에 global pointer handler 가 등록되어 iframe element 와 cross-document
// 비교 시 깨짐. PreviewEmbed 가 LICENSE_KEY 만 import 해서 iframe window 에 직접 set.
// =============================================================================

const LICENSE_KEY =
  'upVcPE+wPOmtLjqyBIh9RkM/nBOseBrflwxYpzGZyYm9cY8amGDkiMnVeQKUHJDjW2y71jtk+wth2fQ5LJrC3RVTZ62jVWZFJNZENFVQgg22H1Tb8tWrEsUCJ0sjTY+V1bTAmKPP6lDBU7lwk4QZcWfDWTh/cnw0fxio2AHaC0du3lmUGY5TVg==';

// main window 에도 set — RealGrid module 을 main bundle 에 직접 import 하는 케이스 대비
// (현재는 그렇게 import 하지 않지만 향후 변경 안전망).
if (typeof window !== 'undefined') {
    window.realGrid2Lic = LICENSE_KEY;
}

export default LICENSE_KEY;
