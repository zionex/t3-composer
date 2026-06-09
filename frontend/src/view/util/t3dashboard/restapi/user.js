import { stripResponse } from './util';
import { apiConfig } from './apiconfig';

/**
 * 사용자 그룹 목록 조회.
 * 서버 응답: [{ grp_cd, grp_nm }, ...]
 * → 화면 컴포넌트가 사용하는 { id, grpCd, grpNm } 형태로 정규화해서 반환.
 * @param {Object} options - 추가 요청 옵션
 * @returns {Promise<Array<{id:string, grpCd:string, grpNm:string}>>}
 */
const getGroups = async (options = {}) => {
  const response = await apiConfig.makeRequest('GET', '/user/groups', null, options);
  const data = await stripResponse(response);
  if (!Array.isArray(data)) return [];
  return data.map((g) => ({
    id: g.grp_cd,
    grpCd: g.grp_cd,
    grpNm: g.grp_nm,
  }));
};

export { getGroups };
