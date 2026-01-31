/**
 * 값이 주어진 패턴 중 하나로 시작하는지 확인
 * 패턴이 비어있으면 모든 값에 대해 true 반환
 */
export function matchesAnyPattern(value: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  return patterns.some((pattern) => value.startsWith(pattern));
}

/**
 * 패턴에 매칭되는 항목만 필터링
 */
export function filterByPatterns<T>(
  items: T[],
  patterns: string[],
  getValue: (item: T) => string,
): T[] {
  if (patterns.length === 0) return items;
  return items.filter((item) => matchesAnyPattern(getValue(item), patterns));
}
