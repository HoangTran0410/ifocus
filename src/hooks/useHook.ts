import { useCallback, useRef } from "react";

export default function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    }) as T,
    [fn, delay]
  );
}
