import React from 'react';
import iconSrc from './assets/T3Composer_icon.png';

export default function Logo({ size = 28 }) {
  return (
    <img
      src={iconSrc}
      width={size}
      height={size}
      alt="T³Composer logo"
      style={{ display: 'block', objectFit: 'contain', borderRadius: '22%' }}
    />
  );
}
