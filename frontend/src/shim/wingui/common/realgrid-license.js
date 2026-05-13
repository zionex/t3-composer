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
    'upVcPE+wPOmtLjqyBIh9RkM/nBOseBrflwxYpzGZyYm9cY8amGDkiMnVeQKUHJDjW2y71jtk+ws'
  + 'jsVaW+79bLriz7QxQTIvWJvcDXO3chRj25yed7QIxafkNUHcDQ8IDUTr6y7OTHzv/JRNgHmr/h6'
  + '6SlJ7LsZeix80htOeIbW0W/3cCMFie2LmoOVpJP8D35C81IfSGP7H6v80fIe/jjSOxVpb7v1sux'
  + 'e5DMqHa0KYm9wNc7dyFGNg19BHZrvb8V6P/IFYXS5lROvrLs5MfO1MsMnuoGM+fHzvgzqdRMZRK'
  + 'bfpoA4HIooXrgkjTpMw/uag5Wkk/wPdBvDowZRLdHdqb125xwqNHI7FWlvu/Wy4frG8hWSW2iCb'
  + '3A1zt3IUYH2aEFwqRVUJg6IScl5gAm1E6+suzkx87ElaO8xXkKUBSPI2VCqhSAjRFl4MzNJ6Jil'
  + 'zYmMoeKmzBLUOYmvKS+YrKGExjV+QgNTakk0yR9UcKS69Wn2kI83Uszabo3mU0IebAMvwuf7/54'
  + 'd2tHsx3AJz8Ro6kcFL1moeJMu9csUs=';

// main window 에도 set — RealGrid module 을 main bundle 에 직접 import 하는 케이스 대비
// (현재는 그렇게 import 하지 않지만 향후 변경 안전망).
if (typeof window !== 'undefined') {
    window.realGrid2Lic = LICENSE_KEY;
}

export default LICENSE_KEY;
