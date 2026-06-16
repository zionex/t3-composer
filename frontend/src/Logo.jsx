import React from 'react';

/**
 * T3Composer 프로그램 로고 — 인라인 SVG 마크.
 * 파스텔 블루 라운드 배지 + 화면 합성(compose) 글리프 (적층 라인 + AI 액센트 점).
 */
export default function Logo({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="T³Composer logo"
    >
      <defs>
        <linearGradient id="t3LogoGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A9C7EE" />
          <stop offset="1" stopColor="#7CA7E0" />
        </linearGradient>
      </defs>

      {/* 라운드 배지 + 깊이 그림자 */}
      <rect x="1.5" y="2" width="29" height="29" rx="8.5" fill="#5683C0" fillOpacity="0.35" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="url(#t3LogoGrad)" />
      {/* 상단 글래스 하이라이트 */}
      <rect x="1.5" y="1.5" width="29" height="13" rx="8.5" fill="#ffffff" fillOpacity="0.20" />

      {/* compose 글리프 — 적층 라인 3개 (생성되는 화면 행) */}
      <rect x="7"  y="9.4"  width="13.5" height="3.6" rx="1.8" fill="#ffffff" fillOpacity="0.96" />
      <rect x="7"  y="14.8" width="18"   height="3.6" rx="1.8" fill="#ffffff" fillOpacity="0.82" />
      <rect x="7"  y="20.2" width="10"   height="3.6" rx="1.8" fill="#ffffff" fillOpacity="0.66" />
      {/* AI 액센트 점 — 첫 라인 끝의 생성 커서 */}
      <circle cx="24" cy="11.2" r="2.1" fill="#ffffff" />
    </svg>
  );
}
