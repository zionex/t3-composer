// =============================================================================
// RealGrid2 license — 부모 t3series-wingui 와 동일 키 (dev 환경 공유)
// =============================================================================
// 부모: t3series-wingui/src/main/resources/profile/local/static/license/realgrid-lic.js
// RealGrid2 는 import 시 window.realGrid2Lic 을 자동 감지하거나
// 명시적 RealGrid.setLicenseKey() 로 등록 가능. 두 방식 모두 동시 적용.
// =============================================================================

import RealGrid from 'realgrid';

const LICENSE_KEY =
    'upVcPE+wPOmtLjqyBIh9RkM/nBOseBrflwxYpzGZyYm9cY8amGDkiMnVeQKUHJDjW2y71jtk+ws'
  + 'jsVaW+79bLriz7QxQTIvWJvcDXO3chRj25yed7QIxafkNUHcDQ8IDUTr6y7OTHzv/JRNgHmr/h6'
  + '6SlJ7LsZeix80htOeIbW0W/3cCMFie2LmoOVpJP8D35C81IfSGP7H6v80fIe/jjSOxVpb7v1sux'
  + 'e5DMqHa0KYm9wNc7dyFGNg19BHZrvb8V6P/IFYXS5lROvrLs5MfO1MsMnuoGM+fHzvgzqdRMZRK'
  + 'bfpoA4HIooXrgkjTpMw/uag5Wkk/wPdBvDowZRLdHdqb125xwqNHI7FWlvu/Wy4frG8hWSW2iCb'
  + '3A1zt3IUYH2aEFwqRVUJg6IScl5gAm1E6+suzkx87ElaO8xXkKUBSPI2VCqhSAjRFl4MzNJ6Jil'
  + 'zYmMoeKmzBLUOYmvKS+YrKGExjV+QgNTakk0yR9UcKS69Wn2kI83Uszabo3mU0IebAMvwuf7/54'
  + 'd2tHsx3AJz8Ro6kcFL1moeJMu9csUs=';

// (1) global 변수 — RealGrid2 가 import 시 자동 검출
if (typeof window !== 'undefined') {
    window.realGrid2Lic = LICENSE_KEY;
}

// (2) 명시 등록 — RealGrid 에 setLicenseKey 가 있으면 호출
try {
    if (RealGrid && typeof RealGrid.setLicenseKey === 'function') {
        RealGrid.setLicenseKey(LICENSE_KEY);
    }
} catch (_e) { /* no-op — 일부 버전에서 실패해도 (1) 의 global 으로 동작 */ }

export default LICENSE_KEY;
