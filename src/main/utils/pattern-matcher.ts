/** 패턴 매칭 유틸 함수 */
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
