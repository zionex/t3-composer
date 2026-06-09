/**
 * axios 응답에서 실제 데이터를 추출하는 헬퍼.
 * 원본 insight-front의 restapi/util.js stripResponse와 동일한 로직.
 *
 * 서버 응답 구조: { success, message, data, error }
 * axios 응답 구조: { data: <서버응답> }
 * → response.data.data 가 있으면 반환, 없으면 response.data 반환
 */
export function stripResponse(res) {
  if (res instanceof Promise) {
    return res.then(response => {
      const resData = response?.data;
      return resData?.data !== undefined ? resData.data : resData;
    });
  }
  const resData = res?.data;
  if (resData !== undefined) {
    return resData?.data !== undefined ? resData.data : resData;
  }
  return res;
}
