"use client";

import * as React from "react";

// 240ms debounce — 입력 → SuggestList 검색 등에 사용.
// React 19: setState in effect는 외부 동기화(시간 윈도우) 정당 사용 사례.

export function useDebounce<T>(value: T, delay = 240): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
