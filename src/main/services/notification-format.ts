/** 알림 본문 포맷팅 유틸 (마크다운 제거 및 트런케이션) */

/** 알림 본문용 마크다운 제거 및 15자 트런케이션 */
export function formatNotificationBody(message: string): string {
  let text = message
    // 코드 블럭(```lang\ncontent``` 또는 ```content```) → content만 추출
    .replace(/```(?:[a-z]*\n)?([\s\S]*?)```/g, "$1")
    // 인라인 코드(`code`) → code만 추출
    .replace(/`([^`]*)`/g, "$1")
    // 볼드/이탤릭 마커 제거 (**text**, *text*, __text__, _text_)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // 헤더 마커 제거 (# 제목)
    .replace(/^#{1,6}\s+/gm, "")
    // 연속 공백/개행 정리
    .replace(/\s+/g, " ")
    .trim();

  if (text.length > 15) {
    text = `${text.slice(0, 15)}...`;
  }

  return text;
}
