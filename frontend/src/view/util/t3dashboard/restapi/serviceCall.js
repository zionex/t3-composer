import axios from 'axios';
import { baseURI } from './baseURI';
import { ENABLE_AUTH, resolveCurrentUser } from '../auth/currentUser';

/**
 * insight-neo 전용 axios 인스턴스.
 * - x-user-id 헤더: 현재 사용자 ID (오픈 환경은 composer-dev 고정 — auth/currentUser.js)
 * - Authorization 헤더: ENABLE_AUTH 시 sessionStorage access_token 주입
 * - insight-neo CORS 설정이 allow_origins=["*"] 이므로 별도 proxy 불필요
 */
export const zAxios = axios.create({
  baseURL: baseURI(),
  timeout: 3_600_000,
  headers: { 'Content-Type': 'application/json' },
});

zAxios.interceptors.request.use((config) => {
  if (ENABLE_AUTH) {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  config.headers['x-user-id'] = resolveCurrentUser().userId;
  return config;
});

export default zAxios;
