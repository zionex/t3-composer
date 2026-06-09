import React from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import { zAxios } from './serviceCall';
import { insightSystemStoreApi } from '../store/insightStore';

/**
 * insight API 설정 싱글톤 (단순화 버전).
 *
 * 원본(apiconfig.js 460줄)에서 dashboardstudio가 실제 사용하는 기능만 남김:
 * - getInsightFullPath(path): apiPrefix 가 설정돼 있으면 prepend, 없으면 path 그대로
 * - makeRequest(method, path, data, options): HTTP 요청
 * - getImagePath(path): 정적 이미지 path 반환 (단독 환경은 path 그대로)
 * - SvgIcon: 원본에서 configureT3SeriesInsight 가 주입하던 아이콘 컴포넌트 stub
 *
 * 제거된 기능: WebSocket, SSE, configureT3SeriesInsight, captureStore, i18n 초기화
 */

// SvgIcon stub — 원본은 configureT3SeriesInsight({SvgIcon}) 로 주입.
// 단독 환경에서는 name 기준으로 @mui/icons-material 매핑. 미매핑 name 은 렌더 생략.
const ICON_MAP = {
  Download: DownloadIcon,
};
function SvgIconStub({ name, size = 16, color = 'currentColor' }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon sx={{ fontSize: size, color }} />;
}

class ApiConfig {
  // SvgIcon 은 인스턴스 필드로 노출 — 원본 호환 (`<apiConfig.SvgIcon ... />`)
  SvgIcon = SvgIconStub;

  /**
   * 정적 이미지/아이콘 경로. 원본은 insight 모드면 `/static` prefix.
   * 단독 환경은 webpack-dev-server 가 / 에서 직접 서빙하므로 path 그대로.
   */
  getImagePath(path) {
    return path;
  }

  /**
   * insightSystemStore 의 apiPrefix 가 설정돼 있을 때만 path 앞에 붙인다.
   * 단독 환경 default: apiPrefix='' → path 그대로 반환.
   * 호출자는 항상 full path 를 넘긴다 (예: '/insight/widget-builder/suggest', '/common/table-query').
   */
  getInsightFullPath(path) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const apiPrefix = insightSystemStoreApi.getState().apiPrefix;
    if (apiPrefix) {
      const normalizedPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;
      return `${normalizedPrefix}${normalizedPath}`;
    }
    return normalizedPath;
  }

  /**
   * insight-neo 서버에 HTTP 요청을 보낸다.
   * @param {string} method - 'get' | 'post' | 'put' | 'delete' | 'patch'
   * @param {string} path   - /insight 이하 경로 (예: '/widget-builder/suggest')
   * @param {*}      data   - GET이면 query params, 나머지는 request body
   * @param {object} options - axios 추가 옵션
   */
  async makeRequest(method, path, data, options = {}) {
    const fullPath = this.getInsightFullPath(path);
    const isGet = method.toLowerCase() === 'get';
    return zAxios({
      method,
      url: fullPath,
      ...(isGet ? { params: data } : { data }),
      ...options,
    });
  }
}

export const apiConfig = new ApiConfig();
export default apiConfig;
